from __future__ import annotations

import time
from typing import Callable

from app.core.cache import DnsCache
from app.data.zones import DOMAIN_TO_AUTH, RECORDS, TLD_TO_SERVER
from app.models import (
    QueryType,
    RecordType,
    ResolutionStep,
    ResolveRequest,
    ResolveResponse,
)

STEP_DELAY_MS = 45.0
CNAME_CHASE_TYPES = {RecordType.A, RecordType.AAAA}


def _normalize(name: str) -> str:
    name = name.strip().lower()
    if not name.endswith("."):
        name += "."
    return name


def _apex(domain: str) -> str:
    """Longest registered apex match (e.g. shop.portfolio.dev → portfolio.dev)."""
    host = domain.rstrip(".").lower()
    for apex in sorted(DOMAIN_TO_AUTH.keys(), key=len, reverse=True):
        if host == apex or host.endswith("." + apex):
            return apex + "."
    parts = host.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:]) + "."
    return _normalize(domain)


def _tld(domain: str) -> str:
    apex = _apex(domain).rstrip(".")
    return apex.split(".")[-1] if apex else ""


class DnsResolverEngine:
    def __init__(self, cache: DnsCache) -> None:
        self._cache = cache

    def resolve(self, request: ResolveRequest) -> ResolveResponse:
        domain = _normalize(request.domain)
        record_type = request.record_type
        steps: list[ResolutionStep] = []
        cname_chain: list[str] = []
        start = time.perf_counter()
        step_num = 0

        def add_step(
            from_node: str,
            to_node: str,
            query_type: QueryType,
            query: str,
            response: str,
            *,
            cache_hit: bool = False,
            detail: str = "",
        ) -> None:
            nonlocal step_num
            step_num += 1
            steps.append(
                ResolutionStep(
                    step=step_num,
                    from_node=from_node,
                    to_node=to_node,
                    query_type=query_type,
                    query=query,
                    record_type=record_type,
                    response=response,
                    cache_hit=cache_hit,
                    elapsed_ms=STEP_DELAY_MS,
                    detail=detail,
                )
            )

        if record_type == RecordType.PTR:
            return self._resolve_ptr(domain, steps, start)

        add_step(
            "client", "resolver", QueryType.RECURSIVE,
            f"{domain} {record_type.value}", "Accepted recursive query",
            detail="Browser sends UDP port 53 query to configured resolver.",
        )

        if request.use_cache:
            cached = self._cache.get(domain, record_type.value)
            add_step(
                "resolver", "cache", QueryType.NON_RECURSIVE,
                f"{domain} {record_type.value}", "HIT" if cached else "MISS",
                cache_hit=bool(cached),
                detail="Resolver checks local cache before traversing hierarchy.",
            )
            if cached:
                answer, _ttl = cached
                add_step(
                    "resolver", "client", QueryType.RECURSIVE,
                    f"{domain} {record_type.value}", answer,
                    detail="Cached answer returned immediately (non-recursive).",
                )
                total_ms = (time.perf_counter() - start) * 1000 + len(steps) * STEP_DELAY_MS
                return ResolveResponse(
                    domain=domain.rstrip("."), record_type=record_type, answer=answer,
                    canonical_name=domain.rstrip("."), steps=steps, total_ms=total_ms,
                    cache_used=True, cname_chain=cname_chain,
                )

        answer, canonical, cname_chain = self._iterative_lookup(domain, record_type, add_step)

        if answer and request.use_cache:
            ttl = self._record_ttl(canonical, record_type) or 300
            self._cache.set(domain, record_type.value, answer, ttl)

        add_step(
            "resolver", "client", QueryType.RECURSIVE,
            f"{domain} {record_type.value}", answer or "NXDOMAIN",
            detail="Resolver returns final answer to the client.",
        )

        if answer and record_type == RecordType.A:
            add_step(
                "client", "web-server", QueryType.NON_RECURSIVE,
                f"TCP connect {answer}", "Connection established",
                detail="Browser opens HTTP/TLS session to resolved IP.",
            )

        total_ms = (time.perf_counter() - start) * 1000 + len(steps) * STEP_DELAY_MS
        return ResolveResponse(
            domain=domain.rstrip("."), record_type=record_type, answer=answer,
            canonical_name=canonical.rstrip(".") if canonical else domain.rstrip("."),
            steps=steps, total_ms=total_ms, cache_used=False, cname_chain=cname_chain,
        )

    def _resolve_ptr(self, domain: str, steps: list[ResolutionStep], start: float) -> ResolveResponse:
        ip = domain.rstrip(".")
        if "in-addr" not in ip:
            octets = ip.split(".")
            arpa = ".".join(reversed(octets)) + ".in-addr.arpa." if len(octets) == 4 else domain
        else:
            arpa = _normalize(ip)

        steps.append(ResolutionStep(
            step=1, from_node="client", to_node="resolver", query_type=QueryType.RECURSIVE,
            query=f"{ip} PTR", record_type=RecordType.PTR, response="Accepted",
            elapsed_ms=STEP_DELAY_MS, detail="Reverse DNS lookup initiated.",
        ))

        record = self._find_record(arpa, RecordType.PTR)
        if record:
            steps.append(ResolutionStep(
                step=2, from_node="resolver", to_node="auth-reverse", query_type=QueryType.ITERATIVE,
                query=arpa, record_type=RecordType.PTR, response=record.value,
                elapsed_ms=STEP_DELAY_MS, detail="Authoritative reverse zone returns PTR.",
            ))
            answer = record.value.rstrip(".")
        else:
            answer = None

        total_ms = (time.perf_counter() - start) * 1000 + len(steps) * STEP_DELAY_MS
        return ResolveResponse(
            domain=ip, record_type=RecordType.PTR, answer=answer,
            canonical_name=answer or "", steps=steps, total_ms=total_ms,
            cache_used=False, cname_chain=[],
        )

    def _iterative_lookup(
        self,
        domain: str,
        record_type: RecordType,
        add_step: Callable[..., None],
    ) -> tuple[str | None, str, list[str]]:
        cname_chain: list[str] = []
        current = domain

        for _ in range(6):
            tld = _tld(current)
            tld_node = TLD_TO_SERVER.get(tld, "tld-com")
            apex = _apex(current)
            auth_node = DOMAIN_TO_AUTH.get(apex.rstrip("."), "auth-portfolio")

            add_step(
                "resolver", "root", QueryType.ITERATIVE,
                f"{current} {record_type.value}", f"Refer to .{tld} TLD server",
                detail="Root server returns NS referral for TLD.",
            )
            add_step(
                "resolver", tld_node, QueryType.ITERATIVE,
                f"{current} {record_type.value}", f"Refer to {apex.rstrip('.')} authoritative",
                detail="TLD server returns NS referral to domain's authoritative server.",
            )

            if record_type == RecordType.MX:
                mx_records = self._find_mx(current)
                if mx_records:
                    mx_records.sort(key=lambda r: r.priority or 999)
                    mx_val = ", ".join(
                        f"{r.priority} {r.value.rstrip('.')}" for r in mx_records
                    )
                    add_step(
                        "resolver", auth_node, QueryType.ITERATIVE,
                        f"{current} MX", mx_val,
                        detail="Authoritative server returns MX set (lower priority = preferred).",
                    )
                    return mx_val, current, cname_chain

            record = self._find_record(current, record_type)
            if record:
                add_step(
                    "resolver", auth_node, QueryType.ITERATIVE,
                    f"{current} {record_type.value}", record.value,
                    detail="Authoritative server returns the requested record.",
                )
                if record.type == RecordType.CNAME:
                    cname_chain.append(current.rstrip("."))
                    current = _normalize(record.value)
                    if record_type != RecordType.CNAME:
                        continue
                    return record.value.rstrip("."), current, cname_chain
                return record.value.rstrip("."), current, cname_chain

            cname = self._find_record(current, RecordType.CNAME)
            if cname and record_type in CNAME_CHASE_TYPES:
                cname_chain.append(current.rstrip("."))
                add_step(
                    "resolver", auth_node, QueryType.ITERATIVE,
                    f"{current} CNAME", cname.value,
                    detail="CNAME alias found; resolver follows to canonical name.",
                )
                current = _normalize(cname.value)
                continue

            add_step(
                "resolver", auth_node, QueryType.ITERATIVE,
                f"{current} {record_type.value}", "NXDOMAIN",
                detail="No matching record in authoritative zone.",
            )
            return None, current, cname_chain

        return None, current, cname_chain

    def _find_record(self, name: str, record_type: RecordType):
        name = _normalize(name)
        for r in RECORDS:
            if _normalize(r.name) == name and r.type == record_type:
                return r
        return None

    def _find_mx(self, name: str) -> list:
        name = _normalize(name)
        return [r for r in RECORDS if _normalize(r.name) == name and r.type == RecordType.MX]

    def _record_ttl(self, name: str, record_type: RecordType) -> int | None:
        rec = self._find_record(name, record_type)
        return rec.ttl if rec else None
