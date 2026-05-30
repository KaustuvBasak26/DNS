from __future__ import annotations

from app.data.zones import RECORDS
from app.models import RecordConversion, RecordType

_MECHANISMS: dict[RecordType, str] = {
    RecordType.A: "Forward DNS: hostname → IPv4 address",
    RecordType.AAAA: "Forward DNS: hostname → IPv6 address",
    RecordType.CNAME: "Alias: canonical name → target hostname",
    RecordType.MX: "Mail routing: domain → mail exchanger + priority",
    RecordType.PTR: "Reverse DNS: IP address → hostname (in-addr.arpa)",
    RecordType.TXT: "Text record: domain → verification / policy string",
    RecordType.NS: "Delegation: zone → authoritative nameserver",
}


def build_conversions() -> list[RecordConversion]:
    conversions: list[RecordConversion] = []
    included = {
        RecordType.A,
        RecordType.AAAA,
        RecordType.CNAME,
        RecordType.MX,
        RecordType.PTR,
        RecordType.TXT,
        RecordType.NS,
    }

    for record in RECORDS:
        if record.type not in included:
            continue
        inp = (
            _ptr_to_ip(record.name)
            if record.type == RecordType.PTR
            else record.name.rstrip(".")
        )
        if record.type == RecordType.MX:
            out = f"{record.priority} {record.value.rstrip('.')}"
        elif record.type == RecordType.CNAME:
            out = record.value.rstrip(".")
        elif record.type == RecordType.PTR:
            out = record.value.rstrip(".")
        elif record.type == RecordType.NS:
            out = record.value.rstrip(".")
        else:
            out = record.value

        conversions.append(
            RecordConversion(
                input=inp,
                record_type=record.type,
                output=out,
                mechanism=_MECHANISMS[record.type],
                zone=record.zone,
            )
        )

    return conversions


def _ptr_to_ip(name: str) -> str:
    parts = name.rstrip(".").split(".")
    if "in-addr" not in parts:
        return name
    idx = parts.index("in-addr")
    octets = list(reversed(parts[:idx]))
    return ".".join(octets)
