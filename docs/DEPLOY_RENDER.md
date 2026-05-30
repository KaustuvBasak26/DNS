# Deploy on Render

This guide covers deploying the DNS Resolution Simulator to [Render](https://render.com) as a **single web service**. The FastAPI backend serves both the REST API and the built React UI from one URL, so the frontend can keep using relative `/api` paths with no cross-origin configuration.

## Architecture

```mermaid
flowchart LR
  subgraph render [Render Web Service]
    build[render-build.sh]
    api[FastAPI /api/*]
    ui[StaticFiles /]
    build --> static[backend/static/]
    static --> ui
    api --> ui
  end
  user[Browser] --> ui
  user --> api
```

| Component | Role |
|-----------|------|
| `render.yaml` | Blueprint: build command, start command, env vars, health check |
| `scripts/render-build.sh` | Installs Python deps, builds frontend, copies `dist` → `backend/static` |
| `backend/runtime.txt` | Pins Python 3.12 for Render |
| `SERVE_STATIC=1` | Tells FastAPI to mount `backend/static` at `/` (production only) |

Local development is unchanged: run the API and Vite dev server separately (`make api` / `make web`). Static serving is disabled unless `SERVE_STATIC=1` is set.

## Prerequisites

- A [Render](https://render.com) account
- This repository pushed to GitHub, GitLab, or Bitbucket
- No database or external services — the app uses in-memory zone data

## Deploy with Blueprint (recommended)

1. Push your branch to the remote repository.
2. In the Render dashboard, click **New** → **Blueprint**.
3. Connect the repository. Render detects `render.yaml` at the repo root.
4. Review the proposed service (`dns-simulator`) and click **Apply**.

Render creates one **Web Service** with:

| Setting | Value |
|---------|-------|
| Runtime | Python |
| Root directory | `backend` |
| Build command | `bash ../scripts/render-build.sh` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/health` |

After the first deploy succeeds, open the service URL (e.g. `https://dns-simulator.onrender.com`). The simulator UI loads at `/`; API docs are at `/docs`.

## Deploy manually (without Blueprint)

If you prefer to create the service by hand:

1. **New** → **Web Service** → connect your repo.
2. Set **Root Directory** to `backend`.
3. **Build Command:** `bash ../scripts/render-build.sh`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Health Check Path:** `/api/health`
6. Add environment variables (see below).

## Environment variables

Set automatically by `render.yaml`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `PYTHON_VERSION` | `3.12.0` | Python runtime for the web service |
| `NODE_VERSION` | `22` | Node.js used during the build to compile the frontend |
| `SERVE_STATIC` | `1` | Enable serving the React production bundle from FastAPI |

Optional:

| Variable | Example | Purpose |
|----------|---------|---------|
| `ALLOWED_ORIGINS` | `https://my-custom-domain.com` | Extra CORS origins (comma-separated). Not needed when UI and API share the same Render URL. |

Render injects `PORT` automatically; do not set it manually.

## Build pipeline

`scripts/render-build.sh` runs on every deploy:

1. `pip install -r backend/requirements.txt`
2. `npm install` and `npm run build` in `frontend/`
3. Replace `backend/static/` with the Vite `dist/` output

The `backend/static/` directory is gitignored; it exists only on the server after a successful build.

## Verify production locally

Simulate the Render build and runtime before pushing:

```bash
# From repo root
bash scripts/render-build.sh

cd backend
SERVE_STATIC=1 uvicorn app.main:app --port 8000
```

Open **http://localhost:8000** for the UI and **http://localhost:8000/docs** for the API. Health check: **http://localhost:8000/api/health**.

Backend tests still run without `SERVE_STATIC` (they expect JSON at `/`, not the HTML shell).

## Redeploys

Render redeploys automatically when you push to the connected branch. To redeploy without a code change, use **Manual Deploy** → **Deploy latest commit** in the service dashboard.

## Free tier behavior

On Render’s free plan, the web service **spins down after ~15 minutes of inactivity**. The first request after sleep can take 30–60 seconds while the container starts. The health check path keeps monitoring working once the service is up.

For a always-on demo, upgrade to a paid instance type in the service settings.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails at `npm run build` | Node missing or wrong version | Confirm `NODE_VERSION=22` is set |
| Build fails at `pip install` | Python version mismatch | Confirm `PYTHON_VERSION=3.12.0` and `backend/runtime.txt` |
| UI shows JSON at `/` instead of the app | Static bundle not served | Set `SERVE_STATIC=1`; confirm build copied files to `backend/static` |
| UI loads but API calls fail | Wrong base URL or service not ready | Use same-origin `/api`; wait for cold start on free tier |
| Health check failing | Service crashed or wrong path | Check logs; path must be `/api/health` |

View build and runtime logs in the Render dashboard under your service → **Logs**.

## Related files

```
├── render.yaml              # Render Blueprint
├── scripts/render-build.sh  # Production build script
├── backend/
│   ├── runtime.txt          # Python version pin
│   ├── app/main.py          # Static mount when SERVE_STATIC=1
│   └── static/              # Generated at deploy (not in git)
└── frontend/                # Built during deploy
```

For local Docker-based runs, see the **Docker** section in [README.md](../README.md).
