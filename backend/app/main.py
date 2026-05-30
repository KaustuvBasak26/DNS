from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
_extra_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app = FastAPI(
    title="DNS Resolution Simulator",
    description="Educational DNS hierarchy resolver with step-by-step tracing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

_serve_static = os.getenv("SERVE_STATIC") == "1" and STATIC_DIR.is_dir()
if _serve_static:
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="frontend")
else:

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "service": "DNS Resolution Simulator",
            "docs": "/docs",
            "api": "/api/health",
        }
