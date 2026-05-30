# Pre-Requirements Document

## 1. Purpose

Build an educational, portfolio-ready DNS resolution system that visualizes how domain names map to IP addresses through the global DNS hierarchy, based on:

- GeeksforGeeks: *Domain Name System (DNS) in Application Layer*
- Internal architecture notes (DNS Arch)

## 2. Stakeholders

| Stakeholder | Need |
|-------------|------|
| Portfolio reviewer | Clear HLD/LLD, working demo, professional UI |
| Learner | Step-by-step resolution trace, record type examples |
| Developer | Runnable locally with minimal setup |

## 3. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Simulate DNS lookup: client → resolver → root → TLD → authoritative | Must |
| FR-2 | Support record types A, AAAA, CNAME, MX, NS, TXT, PTR, SOA | Must |
| FR-3 | Model recursive, iterative, and non-recursive (cache) queries | Must |
| FR-4 | Resolver cache with TTL semantics | Must |
| FR-5 | REST API exposing records, topology, and resolve trace | Must |
| FR-6 | React UI: list all records and name↔address conversions | Must |
| FR-7 | Live network graph animating packet/route per resolution step | Must |
| FR-8 | CNAME chain following for hostname → IP resolution | Should |
| FR-9 | Reverse DNS (PTR) for IPv4 in-addr.arpa | Should |
| FR-10 | Preset demo queries (e.g. geeksforgeeks.org flow) | Should |

## 4. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Local startup in under 2 minutes (venv + npm) |
| NFR-2 | API response for resolve &lt; 500 ms (simulated delays excluded) |
| NFR-3 | UI readable on 1280px+ desktop; graceful stack on tablet |
| NFR-4 | Documented HLD, LLD, README, how-it-works guide |
| NFR-5 | No external DNS dependency for demo (self-contained zones) |

## 5. Out of scope

- Binding to real UDP port 53 on the public Internet
- DNSSEC, EDNS0, zone transfers (AXFR/IXFR)
- Dynamic zone updates (RFC 2136)
- Production-scale anycast or geographic routing

## 6. Assumptions

- Single-machine deployment for demos
- Sample zones (`portfolio.dev`, `example.com`, `geeksforgeeks.org`) are fictional/educational
- Timings in traces are simulated for visualization, not wall-clock network RTT

## 7. Dependencies

| Component | Version |
|-----------|---------|
| Python | 3.11+ |
| FastAPI | 0.115+ |
| Node.js | 20+ |
| React | 18+ |
| React Flow | 12+ |

## 8. Success criteria

- [ ] User can resolve `www.portfolio.dev` and see full path on graph
- [ ] Second identical query shows cache hit (non-recursive)
- [ ] All seeded records visible in UI with conversion explanations
- [ ] HLD and LLD documents accurately describe implementation

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Confusion with real DNS | README states "simulator" scope |
| Stale portfolio demo | Docker Compose + health endpoint |
| Over-complex UI | Preset queries + auto-play steps on graph |
