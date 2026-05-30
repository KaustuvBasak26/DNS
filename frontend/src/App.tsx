import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import { Header } from "./components/Header";
import { NetworkGraph } from "./components/NetworkGraph";
import { RecordsPanel } from "./components/RecordsPanel";
import { ResolverPanel } from "./components/ResolverPanel";
import type { RecordType, ResolveResponse, RecordsResponse, TopologyResponse } from "./types";

export default function App() {
  const [topology, setTopology] = useState<TopologyResponse | null>(null);
  const [recordsData, setRecordsData] = useState<RecordsResponse | null>(null);
  const [stats, setStats] = useState({ records: 0, zones: 0, servers: 0 });
  const [result, setResult] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    Promise.all([api.topology(), api.records(), api.health()])
      .then(([topo, rec, health]) => {
        setTopology(topo);
        setRecordsData(rec);
        setStats({ records: health.records, zones: health.zones, servers: health.servers });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!result?.steps.length || !animating) return;
    setActiveStep(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      if (i >= result.steps.length) {
        window.clearInterval(id);
        return;
      }
      setActiveStep(i);
    }, 550);
    return () => window.clearInterval(id);
  }, [result, animating]);

  const onResolve = useCallback(
    async (domain: string, recordType: RecordType, useCache: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.resolve(domain, recordType, useCache);
        setResult(res);
        if (animating) setActiveStep(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Resolution failed");
      } finally {
        setLoading(false);
      }
    },
    [animating]
  );

  const onClearCache = useCallback(async () => {
    await api.clearCache();
  }, []);

  if (error && !topology) {
    return (
      <div className="error">
        Failed to load: {error}. Start the API with <code>make api</code> (port 8000).
      </div>
    );
  }

  if (!topology || !recordsData) {
    return <div className="loading">Loading DNS simulator…</div>;
  }

  return (
    <div className="app">
      <Header stats={stats} />
      {error && <div className="banner-error">{error}</div>}
      <main className="main">
        <div className="panel graph-panel">
          <div className="panel-header">
            <h2>Resolution Path — Live Network Graph</h2>
            <span className="badge">
              Hop {result?.steps?.length ? activeStep + 1 : 0} / {result?.steps.length ?? 0}
              {result?.steps &&
              activeStep === result.steps.length - 1 &&
              result.steps.length > 0
                ? " · Complete"
                : ""}
            </span>
          </div>
          <div className="panel-body">
            <NetworkGraph
              nodes={topology.nodes}
              edges={topology.edges}
              steps={result?.steps ?? []}
              activeStep={activeStep}
              domain={result?.domain}
              answer={result?.answer}
              onSelectHop={setActiveStep}
            />
          </div>
        </div>
        <ResolverPanel
          onResolve={onResolve}
          result={result}
          loading={loading}
          activeStep={activeStep}
          onStepChange={setActiveStep}
          onClearCache={onClearCache}
          animating={animating}
          onToggleAnimation={() => setAnimating((a) => !a)}
        />
        <RecordsPanel
          records={recordsData.records}
          conversions={recordsData.conversions}
          zones={recordsData.zones}
        />
      </main>
    </div>
  );
}
