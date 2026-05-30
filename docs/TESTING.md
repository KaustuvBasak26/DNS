# Testing

Automated tests cover the resolver engine, HTTP API, cache, record conversions, and key UI components (hop panel, sequence rail, graph layout).

## Quick commands

From the repo root (after `make install`):

```bash
make test              # 33 backend + 13 frontend tests
make test-backend
make test-frontend
```

### Backend only

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt   # includes pytest + httpx
PYTHONPATH=. pytest tests/ -v
```

### Frontend only

```bash
cd frontend
npm install
npm run test:run       # single run (CI)
npm test               # watch mode
```

## Backend (`backend/tests/`)

| File | What it verifies |
|------|------------------|
| `test_resolver.py` | Apex/TLD helpers, CNAME chains, MX, PTR, NXDOMAIN, cache, ccTLD, AAAA |
| `test_api.py` | FastAPI routes: health, topology, records, demos, resolve, cache, 400 on empty domain |
| `test_conversions.py` | `build_conversions()`, PTR name → IP |
| `test_cache.py` | TTL hit, expiry, clear |
| `test_resolution_steps.py` | Step trace shape, cache warm path |
| `conftest.py` | Shared `TestClient`; clears `/api/cache` before/after each test |

**Dependencies:** `pytest`, `httpx` (required by Starlette’s `TestClient`).

## Frontend (`frontend/src/`)

| File | What it verifies |
|------|------------------|
| `components/graphLayout.test.ts` | Edge handles, attach points, marker spread |
| `components/HopDetailsPanel.test.tsx` | Empty state, active hop, timeline clicks |
| `components/SequenceRail.test.tsx` | Hop cards, `onSelectHop` |
| `test/fixtures.ts` | Shared sample `ResolutionStep[]` |
| `test/setup.ts` | `@testing-library/jest-dom` for Vitest |

**Stack:** Vitest + jsdom + Testing Library (`vite.config.ts` → `test` block).

## CI suggestion

```yaml
# Example GitHub Actions steps
- run: make install
- run: make test
```

## Adding tests

- **New zone or record behavior** → extend `test_resolver.py` and/or `test_api.py`.
- **New API route** → `test_api.py` with the shared `client` fixture.
- **Graph/hop UI logic** → pure functions in `graphLayout.ts` (unit) or component tests with fixtures in `test/fixtures.ts`.

When changing demo count or zone stats, update assertions in `test_api.py` (`test_health`, `test_demos`) if those numbers are intentional contract checks.
