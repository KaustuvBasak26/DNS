# Low-Level Design (LLD)

## 1. Module map

```
backend/app/
├── main.py              # FastAPI app, CORS
├── models.py            # Pydantic schemas
├── api/routes.py        # REST handlers
├── core/
│   ├── resolver.py      # Resolution orchestration
│   ├── cache.py         # TTL cache
│   └── conversions.py   # Human-readable mappings
└── data/zones.py        # Servers, edges, records

frontend/src/
├── App.tsx              # Layout + data loading
├── api/client.ts        # fetch wrappers
├── components/
│   ├── NetworkGraph.tsx # React Flow topology
│   ├── ResolverPanel.tsx
│   ├── RecordsPanel.tsx
│   └── StepTimeline.tsx
└── types.ts
```

## 2. Core classes

### 2.1 `DnsCache`

| Method | Description |
|--------|-------------|
| `get(domain, type)` | Returns `(answer, ttl_remaining)` or `None` if expired/missing |
| `set(domain, type, answer, ttl)` | Stores with wall-clock timestamp |
| `entries()` | Lists active cache rows for debugging |

### 2.2 `DnsResolverEngine`

| Method | Description |
|--------|-------------|
| `resolve(request)` | Main entry; builds `ResolveResponse` with `steps` |
| `_iterative_lookup()` | Walks root → TLD → auth; follows CNAME for A |
| `_resolve_ptr()` | Builds in-addr.arpa name from IPv4 input |

**Normalization**: All names stored/compared as FQDN with trailing dot.

**Delegation maps**:

```python
TLD_TO_SERVER = {"com": "tld-com", "org": "tld-org"}
DOMAIN_TO_AUTH = {
    "portfolio.dev": "auth-portfolio",
    "example.com": "auth-example",
    "geeksforgeeks.org": "auth-geeksforgeeks",
}
```

## 3. Data models (API)

### DnsRecord

| Field | Type | Notes |
|-------|------|-------|
| name | string | FQDN e.g. `www.portfolio.dev.` |
| type | enum | A, AAAA, CNAME, … |
| value | string | RDATA string |
| ttl | int | Seconds |
| zone | string | Zone file grouping |
| server_id | string | Which topology node holds authority |

### ResolutionStep

| Field | Type | Notes |
|-------|------|-------|
| from_node, to_node | string | Topology node IDs |
| query_type | enum | recursive \| iterative \| non_recursive |
| cache_hit | bool | True for cache HIT step |

## 4. API specification

### POST `/api/resolve`

**Request**

```json
{
  "domain": "www.portfolio.dev",
  "record_type": "A",
  "use_cache": true
}
```

**Response**

```json
{
  "domain": "www.portfolio.dev",
  "record_type": "A",
  "answer": "93.184.216.34",
  "canonical_name": "portfolio.dev",
  "steps": [ { "step": 1, "from_node": "client", ... } ],
  "total_ms": 315.0,
  "cache_used": false,
  "cname_chain": ["www.portfolio.dev"]
}
```

### GET `/api/records`

Returns `records`, `conversions`, `zones`.

### GET `/api/topology`

Returns `nodes` (servers) and `edges` (static links).

## 5. Frontend behavior

| Component | Logic |
|-----------|-------|
| `App` | Loads topology + records on mount |
| `ResolverPanel` | POST resolve; preset buttons |
| `NetworkGraph` | Highlights nodes/edges for `steps[0..activeStep]` |
| Auto-play | `setInterval` 600ms advances `activeStep` after resolve |

**Graph layout**: Fixed coordinates per `server_id` in `LAYOUT` map.

## 6. CNAME resolution algorithm

```
current = query name
loop up to 5:
  query authoritative for (current, requested_type)
  if found: return
  if requested_type == A and CNAME exists:
    append to chain
    current = CNAME target
    continue
  return NXDOMAIN
```

## 7. Reverse DNS

Input `93.184.216.34` → `34.216.184.93.in-addr.arpa.` → PTR lookup on `auth-reverse`.

## 8. Error handling

| Case | HTTP | Behavior |
|------|------|----------|
| Empty domain | 400 | Validation error |
| Unknown name | 200 | `answer: null`, steps show NXDOMAIN |
| Unknown record type on zone | 200 | NXDOMAIN after auth query |

## 9. Configuration

| Item | Location | Default |
|------|----------|---------|
| API port | uvicorn CLI | 8000 |
| UI port | vite.config | 5173 |
| CORS origins | main.py | localhost:5173 |
| Step delay (display) | resolver.py | 45 ms per step |

## 10. Extension points

1. Add zone: append to `RECORDS`, `DOMAIN_TO_AUTH`, topology nodes/edges
2. UDP adapter: wrap `DnsResolverEngine.resolve` in DNS wire format parser (future)
3. Persist cache: replace `DnsCache` dict with Redis (future)
