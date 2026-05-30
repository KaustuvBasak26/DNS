import type { ResolutionStep } from "../types";

const NODE_LABELS: Record<string, string> = {
  client: "Browser / Client",
  resolver: "Recursive Resolver",
  cache: "Resolver Cache",
  root: "Root DNS Server",
  "tld-com": "TLD Server (.com)",
  "tld-org": "TLD Server (.org)",
  "tld-dev": "TLD Server (.dev)",
  "tld-in": "TLD Server (.in)",
  "auth-portfolio": "Authoritative — portfolio.dev",
  "auth-example": "Authoritative — example.com",
  "auth-geeksforgeeks": "Authoritative — geeksforgeeks.org",
  "auth-scalar": "Authoritative — scalar.in",
  "auth-reverse": "Authoritative — in-addr.arpa",
  "web-server": "Origin Web Server",
};

interface Props {
  steps: ResolutionStep[];
  activeStep: number;
  domain?: string;
  answer?: string | null;
  onSelectHop?: (index: number) => void;
}

export function HopDetailsPanel({ steps, activeStep, domain, answer, onSelectHop }: Props) {
  if (!steps.length) {
    return (
      <aside className="hop-details" aria-label="Hop details">
        <div className="hop-details-empty">
          <span className="hop-details-empty-icon" aria-hidden>
            ↗
          </span>
          <p className="hop-details-empty-title">Hop-by-hop trace</p>
          <p className="hop-details-empty-text">
            Run <strong>Resolve</strong> to see each DNS hop explained here as the packet moves
            through the graph.
          </p>
        </div>
      </aside>
    );
  }

  const step = steps[activeStep];
  const total = steps.length;
  const isLast = activeStep === total - 1;
  const from = NODE_LABELS[step.from_node] ?? step.from_node;
  const to = NODE_LABELS[step.to_node] ?? step.to_node;

  return (
    <aside className="hop-details" aria-label="Hop details" aria-live="polite">
      <div className={`hop-details-hero ${isLast ? "hop-details-hero--done" : ""}`}>
        <div className="hop-details-hero-top">
          <span className="hop-details-eyebrow">
            {isLast ? "Resolution complete" : "Now playing"}
          </span>
          <span className="hop-details-counter">
            {activeStep + 1} / {total}
          </span>
        </div>
        <div className="hop-details-hop-num">{isLast ? "✓" : activeStep + 1}</div>
        <h3 className="hop-details-route">
          <span>{from}</span>
          <span className="hop-details-arrow" aria-hidden>
            →
          </span>
          <span>{to}</span>
        </h3>
        {domain && (
          <p className="hop-details-query-name">
            Looking up <strong>{domain}</strong> ({step.record_type})
          </p>
        )}
      </div>

      <dl className="hop-details-facts">
        <div className="hop-details-fact">
          <dt>Query</dt>
          <dd className="hop-details-mono">{step.query}</dd>
        </div>
        <div className="hop-details-fact">
          <dt>Response</dt>
          <dd className="hop-details-mono">{step.response}</dd>
        </div>
        <div className="hop-details-fact hop-details-fact--inline">
          <dt>Type</dt>
          <dd>{step.query_type}</dd>
        </div>
        <div className="hop-details-fact hop-details-fact--inline">
          <dt>Time</dt>
          <dd>{step.elapsed_ms} ms</dd>
        </div>
        {step.cache_hit && (
          <div className="hop-details-cache-badge">Cache hit</div>
        )}
      </dl>

      {step.detail && <p className="hop-details-narrative">{step.detail}</p>}

      {isLast && answer != null && (
        <div className="hop-details-answer">
          <span className="hop-details-answer-label">Final answer</span>
          <code>{answer}</code>
        </div>
      )}

      <div className="hop-details-timeline">
        <p className="hop-details-timeline-title">Full path</p>
        <ol className="hop-details-steps">
          {steps.map((s, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            const last = i === total - 1;
            const f = NODE_LABELS[s.from_node] ?? s.from_node;
            const t = NODE_LABELS[s.to_node] ?? s.to_node;
            return (
              <li key={`detail-${i}`}>
                <button
                  type="button"
                  className={`hop-details-step-btn ${done ? "done" : ""} ${current ? "current" : ""} ${last ? "final" : ""}`}
                  onClick={() => onSelectHop?.(i)}
                >
                  <span className="hop-details-step-num">{last ? "✓" : i + 1}</span>
                  <span className="hop-details-step-text">
                    {f.split(" ").slice(-1)[0]} → {t.split(" ").slice(-1)[0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
