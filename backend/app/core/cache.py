from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass
class CacheItem:
    answer: str
    ttl: int
    cached_at: float


class DnsCache:
    def __init__(self) -> None:
        self._store: dict[str, CacheItem] = {}

    @staticmethod
    def _key(domain: str, record_type: str) -> str:
        return f"{domain.lower().rstrip('.')}:{record_type.upper()}"

    def get(self, domain: str, record_type: str) -> tuple[str, int] | None:
        key = self._key(domain, record_type)
        item = self._store.get(key)
        if not item:
            return None
        age = int(time.time() - item.cached_at)
        remaining = item.ttl - age
        if remaining <= 0:
            del self._store[key]
            return None
        return item.answer, remaining

    def set(self, domain: str, record_type: str, answer: str, ttl: int) -> None:
        if ttl <= 0:
            return
        self._store[self._key(domain, record_type)] = CacheItem(
            answer=answer, ttl=ttl, cached_at=time.time()
        )

    def clear(self) -> None:
        self._store.clear()

    def entries(self) -> list[dict[str, str | int]]:
        now = time.time()
        result: list[dict[str, str | int]] = []
        expired: list[str] = []
        for key, item in self._store.items():
            remaining = item.ttl - int(now - item.cached_at)
            if remaining <= 0:
                expired.append(key)
                continue
            result.append(
                {
                    "key": key,
                    "answer": item.answer,
                    "ttl_remaining": remaining,
                    "cached_at": time.strftime(
                        "%Y-%m-%dT%H:%M:%SZ", time.gmtime(item.cached_at)
                    ),
                }
            )
        for key in expired:
            del self._store[key]
        return result
