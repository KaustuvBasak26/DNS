import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { DemoScenario, RecordType, ResolveResponse } from "../types";
import { StepTimeline } from "./StepTimeline";

interface Props {
  onResolve: (domain: string, type: RecordType, useCache: boolean) => Promise<void>;
  result: ResolveResponse | null;
  loading: boolean;
  activeStep: number;
  onStepChange: (step: number) => void;
  onClearCache: () => void;
  animating: boolean;
  onToggleAnimation: () => void;
}

export function ResolverPanel({
  onResolve,
  result,
  loading,
  activeStep,
  onStepChange,
  onClearCache,
  animating,
  onToggleAnimation,
}: Props) {
  const [domain, setDomain] = useState("www.portfolio.dev");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [useCache, setUseCache] = useState(true);
  const [demos, setDemos] = useState<DemoScenario[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  useEffect(() => {
    api.demos().then((d) => setDemos(d.scenarios)).catch(() => {});
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(demos.map((d) => d.category)))],
    [demos]
  );

  const filteredDemos = useMemo(
    () => (category === "all" ? demos : demos.filter((d) => d.category === category)),
    [demos, category]
  );

  const runResolve = (d: string, t: RecordType, cache = useCache) => {
    setDomain(d);
    setRecordType(t);
    void onResolve(d, t, cache);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runResolve(domain, recordType);
  };

  const activeDemo = demos.find((d) => d.id === selectedDemo);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Resolution Tester</h2>
        <span className="badge">{demos.length} demo scenarios</span>
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="hostname or IP for PTR"
              aria-label="Domain name"
            />
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              aria-label="Record type"
            >
              {(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "PTR"] as RecordType[]).map(
                (t) => (
                  <option key={t} value={t}>{t}</option>
                )
              )}
            </select>
            <button type="submit" disabled={loading}>
              {loading ? "Resolving…" : "Resolve"}
            </button>
            <button type="button" className="secondary" onClick={onClearCache}>
              Clear cache
            </button>
            <button type="button" className="secondary" onClick={onToggleAnimation}>
              {animating ? "Pause graph" : "Play graph"}
            </button>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={useCache}
              onChange={(e) => setUseCache(e.target.checked)}
            />
            Use resolver cache (run same query twice to see cache HIT)
          </label>
        </form>

        <div className="demo-section">
          <div className="zone-tabs">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`zone-tab ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c === "all" ? "All demos" : c}
              </button>
            ))}
          </div>
          <div className="demo-grid">
            {filteredDemos.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`demo-card ${selectedDemo === d.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedDemo(d.id);
                  runResolve(d.domain, d.record_type);
                }}
              >
                <span className="demo-card-title">{d.title}</span>
                <span className="demo-card-query">{d.domain} · {d.record_type}</span>
              </button>
            ))}
          </div>
          {activeDemo && (
            <div className="demo-detail">
              <p>{activeDemo.description}</p>
              <p className="demo-goal"><strong>Learning goal:</strong> {activeDemo.learning_goal}</p>
            </div>
          )}
        </div>

        {result && (
          <>
            <div className="result-box">
              <div className="label">Answer</div>
              <div className={`answer ${result.answer ? "" : "nx"}`}>
                {result.answer ?? "NXDOMAIN"}
              </div>
              <div className="meta">
                {result.cache_used && "Served from cache · "}
                {result.total_ms.toFixed(0)} ms · {result.steps.length} hops
                {result.cname_chain.length > 0 &&
                  ` · CNAME: ${result.cname_chain.join(" → ")} → ${result.canonical_name}`}
              </div>
            </div>
            <StepTimeline
              steps={result.steps}
              activeStep={activeStep}
              onStepChange={onStepChange}
            />
          </>
        )}
      </div>
    </section>
  );
}
