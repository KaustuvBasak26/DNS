import { Panel, useReactFlow } from "@xyflow/react";
import "./graph-controls.css";

const FIT_VIEW_OPTS = { padding: 0.12, maxZoom: 1.15, duration: 300 };

interface Props {
  locked: boolean;
  onToggleLock: () => void;
}

export function GraphControls({ locked, onToggleLock }: Props) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <Panel position="bottom-left" className="graph-controls-panel">
      <button
        type="button"
        className="react-flow__controls-button graph-control-btn"
        aria-label="Zoom in"
        onClick={() => zoomIn({ duration: 200 })}
      >
        +
      </button>
      <button
        type="button"
        className="react-flow__controls-button graph-control-btn"
        aria-label="Zoom out"
        onClick={() => zoomOut({ duration: 200 })}
      >
        −
      </button>
      <button
        type="button"
        className="react-flow__controls-button graph-control-btn"
        aria-label="Fit view"
        onClick={() => void fitView(FIT_VIEW_OPTS)}
      >
        <svg viewBox="0 0 32 32" aria-hidden width={16} height={16}>
          <path
            d="M3 9V3h6M25 3h6v6M29 25v6h-6M9 29H3v-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
        </svg>
      </button>
      <button
        type="button"
        className={`react-flow__controls-button graph-control-btn${locked ? " active" : ""}`}
        aria-label={locked ? "Unlock pan and zoom" : "Lock pan and zoom"}
        aria-pressed={locked}
        onClick={onToggleLock}
      >
        <svg viewBox="0 0 32 32" aria-hidden width={16} height={16}>
          {locked ? (
            <path
              d="M10 14V10a6 6 0 1112 0v4M8 14h16v12H8z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            />
          ) : (
            <path
              d="M10 14V10a6 6 0 0110.5-3.5M22 14h2v12H8V14h2M14 10a2 2 0 014 0v4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            />
          )}
        </svg>
      </button>
    </Panel>
  );
}
