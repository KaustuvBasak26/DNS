from app.core.conversions import _ptr_to_ip, build_conversions
from app.models import RecordType


def test_build_conversions_includes_major_types():
    conv = build_conversions()
    types = {c.record_type for c in conv}
    assert RecordType.A in types
    assert RecordType.AAAA in types
    assert RecordType.MX in types
    assert RecordType.PTR in types
    assert RecordType.CNAME in types


def test_mx_conversion_format():
    conv = build_conversions()
    mx = next(
        c
        for c in conv
        if c.record_type == RecordType.MX and c.input == "portfolio.dev"
    )
    assert " " in mx.output
    assert mx.mechanism


def test_ptr_to_ip_from_in_addr():
    assert _ptr_to_ip("20.0.100.198.in-addr.arpa.") == "198.100.0.20"


def test_ptr_conversion_uses_ip_as_input():
    conv = build_conversions()
    ptr = next(c for c in conv if c.record_type == RecordType.PTR)
    assert "." in ptr.input
    assert ptr.output
