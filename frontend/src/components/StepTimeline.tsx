import type { ResolutionStep } from "../types";

interface Props {
  steps: ResolutionStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
}

const NODE_LABELS: Record<string, string> = {
  client: "Client",
  resolver: "Resolver",
  cache: "Cache",
  root: "Root",
  "tld-com": "TLD (.com)",
  "tld-org": "TLD (.org)",
  "tld-dev": "TLD (.dev)",
  "tld-in": "TLD (.in)",
  "auth-portfolio": "Auth portfolio.dev",
  "auth-example": "Auth example.com",
  "auth-geeksforgeeks": "Auth geeksforgeeks.org",
  "auth-scalar": "Auth scalar.in",
  "auth-reverse": "Auth in-addr.arpa",
  "web-server": "Web server",
};

export function StepTimeline({ steps, activeStep, onStepChange }: Props) {
  const total = steps.length;

  return (
    <ol className="steps-list">
      {steps.map((s, i) => {
        const displayNum = i + 1;
        const isLast = i === total - 1;
        return (
          <li
            key={`hop-${i}-${s.from_node}-${s.to_node}`}
            className={`step-item ${i === activeStep ? "active" : ""} ${i < activeStep ? "done" : ""} ${s.cache_hit ? "cache" : ""} ${isLast ? "final" : ""}`}
            onMouseEnter={() => onStepChange(i)}
            onFocus={() => onStepChange(i)}
            tabIndex={0}
            role="button"
          >
            <span className="step-num">{isLast ? "✓" : displayNum}</span>
            <div className="step-content">
              <strong>
                Hop {displayNum}/{total}: {NODE_LABELS[s.from_node] ?? s.from_node} →{" "}
                {NODE_LABELS[s.to_node] ?? s.to_node}
                {isLast ? " (complete)" : ""}
              </strong>
              <span> · {s.query_type}</span>
              <div style={{ marginTop: 4, fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
                {s.query} → {s.response}
              </div>
              {s.detail && (
                <div style={{ marginTop: 4, color: "var(--muted)", fontSize: "0.75rem" }}>
                  {s.detail}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
