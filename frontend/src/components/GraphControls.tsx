import { Panel, useReactFlow } from "@xyflow/react";
import "./graph-controls.css";

const FIT_VIEW_OPTS = { padding: 0.12, maxZoom: 1.15, duration: 300 };

interface Props {
  locked: boolean;
  onLockChange: (locked: boolean, zoom?: number) => void;
}

export function GraphControls({ locked, onLockChange }: Props) {
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();

  const toggleLock = () => {
    if (locked) {
      onLockChange(false);
      return;
    }
    onLockChange(true, getZoom());
  };

  return (
    <>
      {locked && (
        <Panel position="top-left" className="graph-interaction-shield-panel">
          <div
            className="graph-interaction-shield"
            aria-hidden
            onWheel={(e) => e.preventDefault()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.preventDefault()}
          />
        </Panel>
      )}
      <Panel position="bottom-left" className="graph-controls-panel">
        <button
          type="button"
          className="react-flow__controls-button graph-control-btn"
          aria-label="Zoom in"
          disabled={locked}
          onClick={() => zoomIn({ duration: 200 })}
        >
          +
        </button>
        <button
          type="button"
          className="react-flow__controls-button graph-control-btn"
          aria-label="Zoom out"
          disabled={locked}
          onClick={() => zoomOut({ duration: 200 })}
        >
          −
        </button>
        <button
          type="button"
          className="react-flow__controls-button graph-control-btn"
          aria-label="Fit view"
          disabled={locked}
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
          onClick={toggleLock}
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
    </>
  );
}
