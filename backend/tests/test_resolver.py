from app.core.cache import DnsCache
from app.core.resolver import DnsResolverEngine, _apex, _tld
from app.models import RecordType, ResolveRequest


def test_apex_multi_part_domain():
    assert _apex("app.shop.portfolio.dev.") == "portfolio.dev."
    assert _apex("www.scalar.in.") == "scalar.in."


def test_tld_from_apex():
    assert _tld("shop.portfolio.dev.") == "dev"
    assert _tld("www.example.com.") == "com"
    assert _tld("practice.geeksforgeeks.org.") == "org"


def test_cname_chain_to_a():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="app.shop.portfolio.dev", record_type=RecordType.A))
    assert res.answer == "198.51.100.30"
    assert "app.shop.portfolio.dev" in res.cname_chain


def test_double_cname_www_portfolio():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="www.portfolio.dev", record_type=RecordType.A))
    assert res.answer == "93.184.216.34"
    assert res.cname_chain == ["www.portfolio.dev"]


def test_mx_returns_both_priorities():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="portfolio.dev", record_type=RecordType.MX))
    assert "10 mail.portfolio.dev" in (res.answer or "")
    assert "20 mail-backup.portfolio.dev" in (res.answer or "")


def test_cache_hit():
    cache = DnsCache()
    engine = DnsResolverEngine(cache)
    req = ResolveRequest(domain="example.com", record_type=RecordType.A, use_cache=True)
    first = engine.resolve(req)
    assert first.cache_used is False
    second = engine.resolve(req)
    assert second.cache_used is True
    assert second.answer == first.answer


def test_ptr_reverse():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="198.51.100.20", record_type=RecordType.PTR))
    assert res.answer == "mail.portfolio.dev"


def test_nxdomain():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="doesnotexist.portfolio.dev", record_type=RecordType.A))
    assert res.answer is None
    assert any(s.response == "NXDOMAIN" for s in res.steps)


def test_scalar_cctld():
    engine = DnsResolverEngine(DnsCache())
    res = engine.resolve(ResolveRequest(domain="www.scalar.in", record_type=RecordType.A))
    assert res.answer == "103.21.244.0"
