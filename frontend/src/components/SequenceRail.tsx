import { useEffect, useRef } from "react";
import type { ResolutionStep } from "../types";

const NODE_SHORT: Record<string, string> = {
  client: "Client",
  resolver: "Resolver",
  cache: "Cache",
  root: "Root",
  "tld-com": "TLD .com",
  "tld-org": "TLD .org",
  "tld-dev": "TLD .dev",
  "tld-in": "TLD .in",
  "auth-portfolio": "Auth",
  "auth-example": "Auth",
  "auth-geeksforgeeks": "Auth",
  "auth-scalar": "Auth",
  "auth-reverse": "PTR",
  "web-server": "Origin",
};

interface Props {
  steps: ResolutionStep[];
  activeStep: number;
  onSelectHop?: (index: number) => void;
}

export function SequenceRail({ steps, activeStep, onSelectHop }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeStep]);

  if (!steps.length) return null;

  const isDone = activeStep === steps.length - 1;

  return (
    <div className="sequence-rail-wrap">
      <div className="sequence-rail-header">
        <strong>Hop sequence</strong>
        <span className="sequence-rail-progress">
          {activeStep + 1} / {steps.length}
          {isDone ? " · complete" : ""}
        </span>
      </div>
      <div className="sequence-rail" aria-label="Resolution hop sequence">
        {steps.map((s, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          const last = i === steps.length - 1;
          const from = NODE_SHORT[s.from_node] ?? s.from_node;
          const to = NODE_SHORT[s.to_node] ?? s.to_node;

          return (
            <button
              key={`rail-${i}`}
              type="button"
              ref={current ? activeRef : undefined}
              className={`sequence-rail-item ${done ? "done" : ""} ${current ? "current" : ""} ${last ? "final" : ""}`}
              title={s.detail || `${from} → ${to}`}
              onClick={() => onSelectHop?.(i)}
            >
              <span className="sequence-rail-num">{last ? "✓" : i + 1}</span>
              <span className="sequence-rail-route">
                {from} → {to}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
