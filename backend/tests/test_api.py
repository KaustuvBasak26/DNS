from app.data.demos import DEMO_SCENARIOS
from app.data.zones import RECORDS, SERVERS, ZONES


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["service"] == "DNS Resolution Simulator"


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["zones"] == len(ZONES)
    assert body["records"] == len(RECORDS)
    assert body["servers"] == len(SERVERS)


def test_topology(client):
    r = client.get("/api/topology")
    assert r.status_code == 200
    body = r.json()
    assert len(body["nodes"]) == len(SERVERS)
    assert len(body["edges"]) > 0
    ids = {n["id"] for n in body["nodes"]}
    assert "client" in ids
    assert "resolver" in ids
    assert "web-server" in ids


def test_records(client):
    r = client.get("/api/records")
    assert r.status_code == 200
    body = r.json()
    assert len(body["records"]) == len(RECORDS)
    assert len(body["conversions"]) > 0
    assert body["zones"] == ZONES


def test_demos(client):
    r = client.get("/api/demos")
    assert r.status_code == 200
    body = r.json()
    assert len(body["scenarios"]) == len(DEMO_SCENARIOS)
    assert len(body["scenarios"]) >= 20
    assert body["categories"]
    assert all(s["domain"] for s in body["scenarios"])


def test_resolve_post_a_record(client):
    r = client.post(
        "/api/resolve",
        json={"domain": "blog.example.com", "record_type": "A", "use_cache": True},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["domain"] == "blog.example.com"
    assert body["answer"]
    assert len(body["steps"]) >= 5
    assert body["steps"][0]["from_node"] == "client"
    assert body["total_ms"] >= 0


def test_resolve_post_aaaa(client):
    r = client.post(
        "/api/resolve",
        json={"domain": "portfolio.dev", "record_type": "AAAA", "use_cache": False},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["answer"] and ":" in body["answer"]


def test_resolve_get(client):
    r = client.get("/api/resolve/www.portfolio.dev?record_type=A&use_cache=false")
    assert r.status_code == 200
    assert r.json()["answer"] == "93.184.216.34"


def test_resolve_empty_domain_400(client):
    r = client.post("/api/resolve", json={"domain": "  ", "record_type": "A"})
    assert r.status_code == 400


def test_cache_clear_and_list(client):
    client.post(
        "/api/resolve",
        json={"domain": "example.com", "record_type": "A", "use_cache": True},
    )
    listed = client.get("/api/cache")
    assert listed.status_code == 200
    assert len(listed.json()["entries"]) >= 1

    cleared = client.delete("/api/cache")
    assert cleared.status_code == 200
    assert cleared.json()["cleared"] is True
    assert client.get("/api/cache").json()["entries"] == []
