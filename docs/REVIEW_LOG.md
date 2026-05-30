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
- Resolver unit tests in `backend/tests/` (see [TESTING.md](TESTING.md); now includes API, cache, conversions, and frontend Vitest)

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

---

## Production hardening — 5 improvement passes

Five review cycles for deployment copy/view-source deterrents (`frontend/src/hardening/`).

### Hardening Pass 1 — Consistent prod detection

**Critic:** `index.html` used hostname checks while TS used only `import.meta.env.PROD`; `npm run preview` on localhost would harden locally; IPv6 loopback missed; duplicate logic.

**Improvements:**
- `shouldApplyHardening()` — active only when `PROD && !isLocalDevHost()`
- Shared localhost list includes `[::1]`
- `index.html` inline script aligned with same host rules for early CSS class

### Hardening Pass 2 — UX & graph interaction

**Critic:** Blanket `user-select: none` blocked no escape hatch; risk of breaking React Flow pointer handling; images draggable on long-press (iOS).

**Improvements:**
- `.allow-select` opt-in regions for future copyable snippets
- `.react-flow` keeps `pointer-events: auto` (graph pan/zoom/click intact)
- `-webkit-user-drag: none` on images only (not SVG — avoids breaking the graph)
- Form controls remain fully selectable

### Hardening Pass 3 — Shortcut & selection gaps

**Critic:** macOS `Option+Cmd+I/J/C` not blocked; paste still worked on page; double-click selection could persist; print could exfiltrate UI.

**Improvements:**
- `shouldBlockKeyDown()` covers Mac Option+Cmd inspect shortcuts
- Block `paste` outside editable fields
- `selectionchange` clears non-input selections
- `@media print { body { display: none } }` on hardened pages

### Hardening Pass 4 — Testability & build hygiene

**Critic:** Logic untested; `installProductionHardening` could double-register; production source maps would expose readable TS.

**Improvements:**
- Pure helpers exported for Vitest (`productionHardening.test.ts`, 11 cases)
- `installed` guard prevents duplicate listeners
- Vite `build.sourcemap: false` for production bundles

### Hardening Pass 5 — Deterrence & documentation

**Critic:** Silent failure — no ownership signal; no review trace for portfolio; devtools still trivially bypass client JS.

**Improvements:**
- One-time styled `console.log` attribution + reuse notice (deterrent, not security)
- This review log section
- **Limitation (explicit):** client-side hardening cannot prevent DevTools, Network tab, or `curl /api/*` — backend remains the trust boundary
