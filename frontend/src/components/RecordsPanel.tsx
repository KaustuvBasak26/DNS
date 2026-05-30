import { useMemo, useState } from "react";
import type { DnsRecord, RecordConversion } from "../types";

interface Props {
  records: DnsRecord[];
  conversions: RecordConversion[];
  zones: string[];
}

export function RecordsPanel({ records, conversions, zones }: Props) {
  const [zone, setZone] = useState<string>("all");
  const [tab, setTab] = useState<"records" | "conversions">("records");
  const [search, setSearch] = useState("");

  const filteredRecords = useMemo(() => {
    let list = zone === "all" ? records : records.filter((r) => r.zone === zone);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.value.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, zone, search]);

  const filteredConversions = useMemo(() => {
    let list = zone === "all" ? conversions : conversions.filter((c) => c.zone === zone);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.input.toLowerCase().includes(q) ||
          c.output.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversions, zone, search]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>DNS Zone Records</h2>
        <span className="badge">{records.length} records · {zones.length} zones</span>
      </div>
      <div className="panel-body">
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search names, values, types…"
          aria-label="Search records"
        />
        <div className="zone-tabs">
          <button
            type="button"
            className={`zone-tab ${zone === "all" ? "active" : ""}`}
            onClick={() => setZone("all")}
          >
            All
          </button>
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              className={`zone-tab ${zone === z ? "active" : ""}`}
              onClick={() => setZone(z)}
            >
              {z}
            </button>
          ))}
        </div>
        <div className="zone-tabs">
          <button
            type="button"
            className={`zone-tab ${tab === "records" ? "active" : ""}`}
            onClick={() => setTab("records")}
          >
            Raw records ({filteredRecords.length})
          </button>
          <button
            type="button"
            className={`zone-tab ${tab === "conversions" ? "active" : ""}`}
            onClick={() => setTab("conversions")}
          >
            Conversions ({filteredConversions.length})
          </button>
        </div>
        {tab === "records" ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>TTL</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, i) => (
                <tr key={`${r.name}-${r.type}-${i}`} title={r.description}>
                  <td style={{ fontFamily: "var(--mono)", fontSize: "0.75rem" }}>{r.name}</td>
                  <td><span className="type-pill">{r.type}</span></td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
                    {r.priority != null ? `${r.priority} ` : ""}{r.value}
                  </td>
                  <td>{r.ttl}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Input</th>
                <th>Type</th>
                <th>Output</th>
                <th>Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversions.map((c, i) => (
                <tr key={`${c.input}-${c.record_type}-${i}`}>
                  <td style={{ fontFamily: "var(--mono)" }}>{c.input}</td>
                  <td><span className="type-pill">{c.record_type}</span></td>
                  <td style={{ fontFamily: "var(--mono)", color: "var(--success)" }}>{c.output}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{c.mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
