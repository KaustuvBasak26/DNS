# Review Log — 5 Improvement Passes

This document captures five deliberate review cycles applied to the DNS Resolution Simulator.

---

## Pass 1 — Expand demo coverage

**Critic:** Only 6 presets and 3 zones; portfolio.dev incorrectly delegated under `.com` TLD; no ccTLD or multi-hop CNAME examples.

**Improvements:**
- Added 20 categorized demo scenarios (`backend/app/data/demos.py`, `GET /api/demos`)
- New zones: `scalar.in` (ccTLD `.in`), expanded `portfolio.dev` subdomains
- Correct TLD hierarchy: `.dev` and `.in` TLD servers; portfolio.dev under `.dev` not `.com`
- Double CNAME chain: `app.shop.portfolio.dev` → `shop.portfolio.dev` → A
- Backup MX (priority 20), blog subdomain, CDN/practice aliases, 5 PTR records

---

## Pass 2 — Fix resolver correctness

**Critic:** `_apex()` broke multi-label domains (`shop.portfolio.dev` → wrong apex); MX returned only first record; cache hit skipped resolver→client step; AAAA didn't chase CNAME.

**Improvements:**
- Longest-match apex using `DOMAIN_TO_AUTH`
- TLD derived from apex (`portfolio.dev` → `.dev`)
- MX queries return full sorted set (`10 …, 20 …`)
- Cache HIT now includes explicit return step to client
- CNAME chase extended to AAAA lookups

---

## Pass 3 — API & data model polish

**Critic:** Presets hardcoded in frontend; conversion zone filter broken (`includes(zone.replace(".dev"))`); no learning context per demo.

**Improvements:**
- `DemoScenario` model with `description` + `learning_goal`
- `RecordConversion.zone` field for accurate filtering
- `/api/demos` endpoint drives UI demo cards
- 9 resolver unit tests in `backend/tests/test_resolver.py`

---

## Pass 4 — UX & visualization

**Critic:** Presets only filled form, didn't run; graph missing new TLD/auth nodes; no search; animation couldn't pause.

**Improvements:**
- Demo card click → immediate resolve + learning panel
- Category tabs: Forward / Mail & Text / Reverse & Cache / Edge Cases
- Graph layout for `tld-dev`, `tld-in`, `auth-scalar`
- Records search box; hover tooltips via `title={description}`
- Play/Pause graph animation; NXDOMAIN styled in red
- Header stats (records, zones, servers)

---

## Pass 5 — Documentation & portfolio readiness

**Critic:** README demo table stale; HOW_IT_WORKS missing new scenarios; no review traceability for interviewers.

**Improvements:**
- Updated README demo table (see below)
- This review log for portfolio narrative
- Health endpoint surfaces counts for live header

---

## Recommended demo script (updated)

| # | Query | Type | Highlights |
|---|-------|------|------------|
| 1 | `app.shop.portfolio.dev` | A | Double CNAME chain |
| 2 | `www.scalar.in` | A | ccTLD `.in` delegation |
| 3 | `portfolio.dev` | MX | Primary + backup priorities |
| 4 | `198.51.100.20` | PTR | Mail server reverse DNS |
| 5 | `staging.api.portfolio.dev` | A | Run twice → cache HIT |
| 6 | `doesnotexist.portfolio.dev` | A | NXDOMAIN edge case |
