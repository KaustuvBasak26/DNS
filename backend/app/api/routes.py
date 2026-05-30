from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.cache import DnsCache
from app.core.conversions import build_conversions
from app.core.resolver import DnsResolverEngine
from app.data.demos import DEMO_CATEGORIES, DEMO_SCENARIOS
from app.data.zones import RECORDS, SERVERS, TOPOLOGY_EDGES, ZONES
from app.models import (
    DemosResponse,
    HealthResponse,
    RecordType,
    RecordsResponse,
    ResolveRequest,
    ResolveResponse,
    TopologyResponse,
)

router = APIRouter(prefix="/api")

_cache = DnsCache()
_resolver = DnsResolverEngine(_cache)


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        zones=len(ZONES),
        records=len(RECORDS),
        servers=len(SERVERS),
    )


@router.get("/topology", response_model=TopologyResponse)
def topology() -> TopologyResponse:
    return TopologyResponse(nodes=SERVERS, edges=TOPOLOGY_EDGES)


@router.get("/records", response_model=RecordsResponse)
def records() -> RecordsResponse:
    return RecordsResponse(
        records=RECORDS,
        conversions=build_conversions(),
        zones=ZONES,
    )


@router.get("/demos", response_model=DemosResponse)
def demos() -> DemosResponse:
    return DemosResponse(scenarios=DEMO_SCENARIOS, categories=DEMO_CATEGORIES)


@router.get("/cache")
def cache_entries() -> dict:
    return {"entries": _cache.entries()}


@router.delete("/cache")
def clear_cache() -> dict:
    _cache.clear()
    return {"cleared": True}


@router.post("/resolve", response_model=ResolveResponse)
def resolve(request: ResolveRequest) -> ResolveResponse:
    if not request.domain.strip():
        raise HTTPException(status_code=400, detail="domain is required")
    return _resolver.resolve(request)


@router.get("/resolve/{domain}", response_model=ResolveResponse)
def resolve_get(
    domain: str,
    record_type: RecordType = RecordType.A,
    use_cache: bool = True,
) -> ResolveResponse:
    return _resolver.resolve(
        ResolveRequest(domain=domain, record_type=record_type, use_cache=use_cache)
    )
