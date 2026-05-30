from app.core.cache import DnsCache
from app.core.resolver import DnsResolverEngine
from app.models import RecordType, ResolveRequest


def _engine() -> DnsResolverEngine:
    return DnsResolverEngine(DnsCache())


def test_steps_start_at_client():
    res = _engine().resolve(ResolveRequest(domain="example.com", record_type=RecordType.A))
    assert res.steps[0].from_node == "client"
    assert res.steps[0].to_node == "resolver"


def test_steps_end_with_answer():
    res = _engine().resolve(ResolveRequest(domain="blog.example.com", record_type=RecordType.A))
    assert res.answer is not None
    assert any(s.to_node == "client" for s in res.steps)
    assert res.steps[-1].to_node == "web-server"


def test_steps_have_query_and_detail():
    res = _engine().resolve(ResolveRequest(domain="portfolio.dev", record_type=RecordType.MX))
    for s in res.steps:
        assert s.query
        assert s.response
        assert s.query_type
        assert s.elapsed_ms >= 0


def test_cache_hit_shortens_path():
    cache = DnsCache()
    engine = DnsResolverEngine(cache)
    req = ResolveRequest(domain="example.com", record_type=RecordType.A, use_cache=True)
    cold = engine.resolve(req)
    warm = engine.resolve(req)
    assert len(warm.steps) <= len(cold.steps)
    assert warm.cache_used is True
    assert any(s.cache_hit for s in warm.steps)
