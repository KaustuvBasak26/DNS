import time

from app.core.cache import DnsCache


def test_cache_miss():
    cache = DnsCache()
    assert cache.get("example.com", "A") is None


def test_cache_hit_within_ttl():
    cache = DnsCache()
    cache.set("example.com", "A", "93.184.216.1", ttl=300)
    hit = cache.get("example.com", "A")
    assert hit is not None
    assert hit[0] == "93.184.216.1"
    assert hit[1] > 0


def test_cache_expired():
    cache = DnsCache()
    cache.set("example.com", "A", "1.2.3.4", ttl=1)
    cache._store[cache._key("example.com", "A")].cached_at = time.time() - 10
    assert cache.get("example.com", "A") is None


def test_cache_clear():
    cache = DnsCache()
    cache.set("a.com", "A", "1.1.1.1", ttl=60)
    cache.clear()
    assert cache.get("a.com", "A") is None
    assert cache.entries() == []
