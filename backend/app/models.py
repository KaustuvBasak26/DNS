from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RecordType(str, Enum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    MX = "MX"
    NS = "NS"
    TXT = "TXT"
    PTR = "PTR"
    SOA = "SOA"


class ServerRole(str, Enum):
    CLIENT = "client"
    RESOLVER = "resolver"
    CACHE = "cache"
    ROOT = "root"
    TLD = "tld"
    AUTHORITATIVE = "authoritative"
    TARGET = "target"


class QueryType(str, Enum):
    RECURSIVE = "recursive"
    ITERATIVE = "iterative"
    NON_RECURSIVE = "non_recursive"


class DnsRecord(BaseModel):
    name: str
    type: RecordType
    value: str
    ttl: int = Field(ge=0)
    priority: int | None = None
    zone: str
    server_id: str
    description: str = ""


class DnsServerNode(BaseModel):
    id: str
    label: str
    role: ServerRole
    address: str
    description: str = ""


class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""


class ResolutionStep(BaseModel):
    step: int
    from_node: str
    to_node: str
    query_type: QueryType
    query: str
    record_type: RecordType
    response: str
    cache_hit: bool = False
    elapsed_ms: float = 0.0
    detail: str = ""


class ResolveRequest(BaseModel):
    domain: str
    record_type: RecordType = RecordType.A
    use_cache: bool = True


class ResolveResponse(BaseModel):
    domain: str
    record_type: RecordType
    answer: str | None
    canonical_name: str
    steps: list[ResolutionStep]
    total_ms: float
    cache_used: bool
    cname_chain: list[str] = Field(default_factory=list)


class RecordConversion(BaseModel):
    input: str
    record_type: RecordType
    output: str
    mechanism: str
    zone: str = ""


class DemoScenario(BaseModel):
    id: str
    category: str
    title: str
    domain: str
    record_type: RecordType
    description: str
    learning_goal: str


class DemosResponse(BaseModel):
    scenarios: list[DemoScenario]
    categories: list[str]


class HealthResponse(BaseModel):
    status: str
    zones: int
    records: int
    servers: int


class TopologyResponse(BaseModel):
    nodes: list[DnsServerNode]
    edges: list[NetworkEdge]


class RecordsResponse(BaseModel):
    records: list[DnsRecord]
    conversions: list[RecordConversion]
    zones: list[str]


class CacheEntry(BaseModel):
    key: str
    answer: str
    ttl_remaining: int
    cached_at: str
