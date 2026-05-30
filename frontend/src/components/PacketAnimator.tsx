import { useEffect, useState } from "react";
import { ViewportPortal } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import type { ResolutionStep } from "../types";
import { attachPoint, handleIdsForEdge } from "./graphLayout";

interface Props {
  step: ResolutionStep | undefined;
  nodes: Node[];
  color: string;
}

export function PacketAnimator({ step, nodes, color }: Props) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!step) return;
    setT(0);
    const start = performance.now();
    const duration = 650;
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setT(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step?.step, step?.from_node, step?.to_node]);

  if (!step) return null;

  const from = nodes.find((n) => n.id === step.from_node);
  const to = nodes.find((n) => n.id === step.to_node);
  if (!from || !to) return null;

  const handles = handleIdsForEdge(step.from_node, step.to_node);
  const a = attachPoint(from, handles.sourceHandle);
  const b = attachPoint(to, handles.targetHandle);
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;

  return (
    <ViewportPortal>
      <div
        className="dns-packet"
        style={{
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
          background: color,
          boxShadow: `0 0 0 3px var(--surface), 0 0 12px ${color}`,
          border: "2px solid var(--surface)",
        }}
        aria-hidden
      />
    </ViewportPortal>
  );
}
