import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import type { DnsServerNode, NetworkEdge, ResolutionStep } from "../types";
import { ServerNode } from "./ServerNode";
import { PacketAnimator } from "./PacketAnimator";
import { SequenceRail } from "./SequenceRail";
import { HopDetailsPanel } from "./HopDetailsPanel";
import { LAYOUT, handleIdsForEdge } from "./graphLayout";
import { useTheme } from "../theme/ThemeContext";

const NODE_W = 148;
const NODE_H = 76;

const EDGE_COLORS = {
  light: { dim: "#94a3b8", active: "#1d4ed8", packet: "#1d4ed8" },
  dark: { dim: "#64748b", active: "#60a5fa", packet: "#60a5fa" },
};

const nodeTypes = { server: ServerNode };

interface Props {
  nodes: DnsServerNode[];
  edges: NetworkEdge[];
  steps: ResolutionStep[];
  activeStep: number;
  domain?: string;
  answer?: string | null;
  onSelectHop?: (index: number) => void;
}

export function NetworkGraph({
  nodes: serverNodes,
  edges: topologyEdges,
  steps,
  activeStep,
  domain,
  answer,
  onSelectHop,
}: Props) {
  const { theme } = useTheme();
  const colors = EDGE_COLORS[theme];
  const activeNodes = useMemo(() => {
    const set = new Set<string>();
    steps.slice(0, activeStep + 1).forEach((s) => {
      set.add(s.from_node);
      set.add(s.to_node);
    });
    return set;
  }, [steps, activeStep]);

  const pulseNode = steps[activeStep]?.to_node;
  const currentStep = steps[activeStep];

  const nodeHopMeta = useMemo(() => {
    const isTarget = currentStep?.to_node;
    const isFinal = activeStep === steps.length - 1 && steps.length > 0;
    return { isTarget, isFinal };
  }, [currentStep, activeStep, steps.length]);

  const initialNodes: Node[] = useMemo(
    () =>
      serverNodes.map((n) => {
        const pos = LAYOUT[n.id] ?? { x: 400, y: 200 };
        const active = activeNodes.has(n.id);
        const isCurrentTarget = n.id === nodeHopMeta.isTarget;
        return {
          id: n.id,
          type: "server",
          position: pos,
          width: NODE_W,
          height: NODE_H,
          zIndex: active ? 3 : 2,
          data: {
            label: n.label,
            role: n.role,
            address: n.address,
            active,
            pulse: pulseNode === n.id,
            isFinalHop: isCurrentTarget && nodeHopMeta.isFinal,
          },
        };
      }),
    [serverNodes, activeNodes, pulseNode, nodeHopMeta]
  );

  const makeEdge = useCallback(
    (
      id: string,
      source: string,
      target: string,
      opts: { dim?: boolean; active?: boolean; animated?: boolean }
    ): Edge => {
      const { sourceHandle, targetHandle } = handleIdsForEdge(source, target);
      const stroke = opts.active ? colors.active : colors.dim;
      const width = opts.active ? 3 : 1.5;
      return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        animated: opts.animated ?? false,
        zIndex: 0,
        style: {
          stroke,
          strokeWidth: width,
          opacity: opts.dim ? 0.45 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: 16,
          height: 16,
        },
      };
    },
    [colors]
  );

  const initialEdges: Edge[] = useMemo(() => {
    const edgeMap = new Map<string, Edge>();
    const stepKeys = new Set(steps.map((s) => `${s.from_node}->${s.to_node}`));

    topologyEdges.forEach((e) => {
      const key = `${e.source}->${e.target}`;
      if (stepKeys.has(key)) return;
      edgeMap.set(key, makeEdge(`topo-${e.id}`, e.source, e.target, { dim: true }));
    });

    steps.forEach((s, i) => {
      if (i > activeStep) return;
      const isActive = i <= activeStep;
      const isCurrent = i === activeStep;
      edgeMap.set(
        `hop-edge-${i}`,
        makeEdge(`hop-edge-${i}`, s.from_node, s.to_node, {
          active: isActive,
          animated: isCurrent,
        })
      );
    });

    return Array.from(edgeMap.values());
  }, [topologyEdges, steps, activeStep, makeEdge]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  return (
    <div className="graph-wrap">
      <div className="graph-body">
        <div className="graph-main">
          <div className="graph-chrome">
            <div className="graph-toolbar">
              <div className="graph-legend" aria-label="Graph legend">
                <span className="legend-item">
                  <span className="legend-dot legend-dot--packet" /> DNS query packet
                </span>
                <span className="legend-item">
                  <span className="legend-line legend-line--active" /> Resolution path
                </span>
                <span className="legend-item">
                  <span className="legend-line legend-line--dim" /> Infrastructure (grey)
                </span>
              </div>
            </div>
            {steps.length > 0 && (
              <SequenceRail
                steps={steps}
                activeStep={activeStep}
                onSelectHop={onSelectHop}
              />
            )}
          </div>
          <div className="graph-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1.15 }}
        proOptions={{ hideAttribution: true }}
        colorMode={theme}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        elevateNodesOnSelect={false}
        defaultEdgeOptions={{ type: "smoothstep", zIndex: 0 }}
      >
        <Background color="var(--grid-color)" gap={24} size={1} />
        <Controls />
        <PacketAnimator step={currentStep} nodes={nodes} color={colors.packet} />
      </ReactFlow>
          </div>
        </div>
      <HopDetailsPanel
        steps={steps}
        activeStep={activeStep}
        domain={domain}
        answer={answer}
        onSelectHop={onSelectHop}
      />
      </div>
    </div>
  );
}
