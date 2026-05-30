# DNS Resolution Simulator

A portfolio-grade educational DNS system that simulates hierarchical name resolution—from browser query through recursive resolver, root, TLD, and authoritative servers—with a React dashboard for records, conversions, and a live resolution-path graph.

## Features

- **Hierarchical DNS model** — Root → TLD → authoritative delegation (aligned with GeeksforGeeks / standard DNS teaching material)
- **Record types** — A, AAAA, CNAME, MX, NS, TXT, PTR, SOA with realistic sample zones
- **Resolution tracing** — Step-by-step recursive/iterative/non-recursive query simulation with cache hits
- **React UI** — Zone browser, conversion table, resolver tester, animated network graph (React Flow)
- **Design docs** — Pre-requirements, HLD, LLD, and operational guide

## Quick start

### Prerequisites

- Python 3.11–3.13 recommended (3.14 works with `pydantic>=2.11`)
- Node.js 20+

### Run locally

```bash
# Terminal 1 — API
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — UI
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. API docs: **http://localhost:8000/docs**.

### Tests

```bash
make test              # backend (pytest) + frontend (vitest)
make test-backend      # Python only
make test-frontend     # React only
```

See **[docs/TESTING.md](docs/TESTING.md)** for layout, coverage map, and CI notes.

### Docker

```bash
docker compose up --build
```

### Render (production)

Deploy as a single web service (API + UI on one URL). See **[docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)** for the Blueprint setup, env vars, and troubleshooting.

```bash
# Optional: verify the production build locally
bash scripts/render-build.sh
cd backend && SERVE_STATIC=1 uvicorn app.main:app --port 8000
```

## Project structure

```
├── backend/           # FastAPI resolver engine + zone data
├── frontend/          # React + Vite + React Flow visualization
├── docs/
│   ├── PRE_REQUIREMENTS.md
│   ├── HLD.md
│   ├── LLD.md
│   ├── HOW_IT_WORKS.md
│   └── DEPLOY_RENDER.md
├── render.yaml
├── scripts/render-build.sh
└── docker-compose.yml
```

## Try these lookups

| Query | Type | What you'll see |
|-------|------|-----------------|
| `app.shop.portfolio.dev` | A | Double CNAME chain → shop IP |
| `www.scalar.in` | A | ccTLD `.in` → authoritative |
| `www.geeksforgeeks.org` | A | Article-style CNAME → apex |
| `portfolio.dev` | MX | Primary (10) + backup (20) mail |
| `198.51.100.20` | PTR | Mail server reverse DNS |
| `staging.api.portfolio.dev` | A | Run twice with cache → HIT |
| `doesnotexist.portfolio.dev` | A | NXDOMAIN |

**20 demo scenarios** are available in the UI (categorized) via `GET /api/demos`. See [docs/REVIEW_LOG.md](docs/REVIEW_LOG.md) for the five improvement passes.

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/PRE_REQUIREMENTS.md](docs/PRE_REQUIREMENTS.md) | Goals, scope, constraints |
| [docs/HLD.md](docs/HLD.md) | High-level architecture |
| [docs/LLD.md](docs/LLD.md) | Modules, APIs, data models |
| [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) | Resolution walkthrough |
| [docs/REVIEW_LOG.md](docs/REVIEW_LOG.md) | Five review/improvement passes |
| [docs/TESTING.md](docs/TESTING.md) | Test suite, commands, coverage |
| [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md) | Render deployment (Blueprint, env vars, troubleshooting) |

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health |
| GET | `/api/topology` | Network nodes and edges |
| GET | `/api/records` | All zone records + conversions |
| POST | `/api/resolve` | Simulate DNS lookup with trace |
| GET | `/api/demos` | Categorized demo scenarios |
| GET | `/api/cache` | Resolver cache entries |
| DELETE | `/api/cache` | Clear cache |

## Portfolio notes

This project demonstrates **system design** concepts: distributed naming hierarchy, caching (TTL), query types (recursive vs iterative), CNAME chasing, reverse DNS, and observability via step traces—not a production authoritative DNS server.

## License

MIT — suitable for portfolio and learning use.
