# How It Works

This guide explains the DNS Resolution Simulator end-to-end for demos and portfolio walkthroughs.

## What problem DNS solves

Computers route traffic using **IP addresses** (e.g. `93.184.216.34`). Humans use **hostnames** (e.g. `www.portfolio.dev`). DNS is the distributed database that translates names to addresses (and supports the reverse for diagnostics and email).

## The eight-step resolution story

When you type a hostname in the browser, the logical steps are:

1. **User input** — You enter `www.geeksforgeeks.org`
2. **Local cache** — OS/browser may already know the IP
3. **Resolver query** — Query goes to your configured recursive resolver (e.g. `8.8.8.8`)
4. **Root referral** — Resolver asks a root server; root says “ask the `.org` TLD server”
5. **TLD referral** — TLD says “ask the authoritative server for `geeksforgeeks.org`”
6. **Authoritative answer** — That server returns CNAME and/or A records
7. **Cache & respond** — Resolver caches the answer (respecting TTL) and returns IP to client
8. **Connect** — Browser opens TCP/TLS to the resolved IP

The UI **Resolution Path** graph animates each hop. The **Step timeline** lists the same path in text form.

## Record types in this demo

| Type | Meaning | Example in simulator |
|------|---------|----------------------|
| **A** | IPv4 address | `portfolio.dev` → `93.184.216.34` |
| **AAAA** | IPv6 address | `portfolio.dev` → `2606:2800:…` |
| **CNAME** | Alias to another name | `www.portfolio.dev` → `portfolio.dev` |
| **MX** | Mail server + priority | `portfolio.dev` → `10 mail.portfolio.dev` |
| **NS** | Delegation to nameserver | `com.` → TLD / child zone NS |
| **TXT** | Arbitrary text (SPF, DMARC) | SPF on `portfolio.dev` |
| **PTR** | Reverse: IP → name | `93.184.216.34` → `example.com` |

Use the **Conversions** tab to see each record expressed as input → output with a short explanation.

## Query types you'll see in traces

- **Recursive** — Client asks resolver; resolver does the full walk (you only talk to resolver).
- **Iterative** — Resolver asks root/TLD/auth; each server gives its best answer or a referral.
- **Non-recursive** — Resolver asks its **cache**; on HIT, no upstream servers are contacted.

**Try it:** Resolve `www.portfolio.dev` twice with cache enabled. The second run should show a cache HIT step.

## CNAME chasing

For an **A** lookup on `www.portfolio.dev`:

1. Authoritative returns **CNAME** → `portfolio.dev`
2. Resolver queries again for **A** on `portfolio.dev`
3. Final **A** record returns the IPv4 address

The result panel shows the **CNAME chain** when applicable.

## Reverse DNS

Enter an IPv4 address and choose **PTR**. The engine builds an `in-addr.arpa` name (octets reversed) and queries the reverse zone—for example `93.184.216.34` → `example.com`.

## TTL and caching

Each record has a **TTL** (seconds). When cached, the resolver serves answers until TTL expires. Clearing cache via the UI forces a full hierarchy walk again.

## Architecture alignment

This simulator intentionally mirrors teaching material (GeeksforGeeks DNS article):

- Hierarchical structure: Root → TLD → Second-level domain → Subdomains
- gTLD vs ccTLD concept (`.com`, `.org` in demo)
- Caching and TTL for performance
- Reverse DNS and PTR for diagnostics

It is **not** a replacement for BIND/Unbound or public DNS infrastructure—it is a **traceable model** for learning and interviews.

## Running a portfolio demo (3 minutes)

1. Start API + UI (see README).
2. Open **Records** → filter `portfolio.dev` → mention SOA, MX, TXT for realism.
3. **Resolve** `www.portfolio.dev` (A) — narrate graph animation.
4. Resolve again — point out cache hit.
5. **PTR** on `93.184.216.34` — explain reverse zones.
6. Point reviewers to `docs/HLD.md` and `docs/LLD.md`.

## API for automation

```bash
curl -s -X POST http://localhost:8000/api/resolve \
  -H 'Content-Type: application/json' \
  -d '{"domain":"www.geeksforgeeks.org","record_type":"A","use_cache":true}' | jq .
```

OpenAPI: `http://localhost:8000/docs`.
