/** Node positions in the React Flow canvas (must match NetworkGraph LAYOUT). */
export const LAYOUT: Record<string, { x: number; y: number }> = {
  client: { x: 30, y: 220 },
  resolver: { x: 200, y: 220 },
  cache: { x: 200, y: 70 },
  root: { x: 370, y: 220 },
  "tld-com": { x: 540, y: 24 },
  "tld-org": { x: 540, y: 118 },
  "tld-dev": { x: 540, y: 212 },
  "tld-in": { x: 540, y: 306 },
  "auth-portfolio": { x: 730, y: 12 },
  "auth-example": { x: 730, y: 106 },
  "auth-geeksforgeeks": { x: 730, y: 200 },
  "auth-scalar": { x: 730, y: 294 },
  "auth-reverse": { x: 730, y: 388 },
  "web-server": { x: 920, y: 220 },
};

export const NODE_W = 148;
export const NODE_H = 76;

/** Pick handle sides so edges attach at borders, not through node boxes. */
export function handleIdsForEdge(
  sourceId: string,
  targetId: string
): { sourceHandle: string; targetHandle: string } {
  const s = LAYOUT[sourceId];
  const t = LAYOUT[targetId];
  if (!s || !t) {
    return { sourceHandle: "source-right", targetHandle: "target-left" };
  }

  const dx = t.x - s.x;
  const dy = t.y - s.y;

  if (Math.abs(dy) > Math.abs(dx) * 0.55) {
    if (dy < 0) {
      return { sourceHandle: "source-top", targetHandle: "target-bottom" };
    }
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  }

  if (dx >= 0) {
    return { sourceHandle: "source-right", targetHandle: "target-left" };
  }
  return { sourceHandle: "source-left", targetHandle: "target-right" };
}

function handleOffset(handleId: string): { dx: number; dy: number } {
  switch (handleId) {
    case "source-right":
    case "target-right":
      return { dx: NODE_W / 2, dy: 0 };
    case "source-left":
    case "target-left":
      return { dx: -NODE_W / 2, dy: 0 };
    case "source-top":
    case "target-top":
      return { dx: 0, dy: -NODE_H / 2 };
    case "source-bottom":
    case "target-bottom":
      return { dx: 0, dy: NODE_H / 2 };
    default:
      return { dx: NODE_W / 2, dy: 0 };
  }
}

/** Flow-space coordinate for a handle on a node. */
export function attachPoint(
  node: { position: { x: number; y: number }; measured?: { width?: number; height?: number }; width?: number; height?: number },
  handleId: string
): { x: number; y: number } {
  const w = node.measured?.width ?? node.width ?? NODE_W;
  const h = node.measured?.height ?? node.height ?? NODE_H;
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;
  const off = handleOffset(handleId);
  return { x: cx + off.dx, y: cy + off.dy };
}

/** Midpoint between two nodes for a given hop (for step number badges). */
export function edgeMidpoint(
  sourceId: string,
  targetId: string,
  nodes: { id: string; position: { x: number; y: number }; measured?: { width?: number; height?: number }; width?: number; height?: number }[]
): { x: number; y: number } | null {
  const from = nodes.find((n) => n.id === sourceId);
  const to = nodes.find((n) => n.id === targetId);
  if (!from || !to) return null;
  const handles = handleIdsForEdge(sourceId, targetId);
  const a = attachPoint(from, handles.sourceHandle);
  const b = attachPoint(to, handles.targetHandle);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Place step badge along edge; spreads multiple hops on the same link. */
export function edgeMarkerPosition(
  sourceId: string,
  targetId: string,
  nodes: {
    id: string;
    position: { x: number; y: number };
    measured?: { width?: number; height?: number };
    width?: number;
    height?: number;
  }[],
  indexOnEdge: number,
  totalOnEdge: number
): { x: number; y: number } | null {
  const from = nodes.find((n) => n.id === sourceId);
  const to = nodes.find((n) => n.id === targetId);
  if (!from || !to) return null;

  const handles = handleIdsForEdge(sourceId, targetId);
  const a = attachPoint(from, handles.sourceHandle);
  const b = attachPoint(to, handles.targetHandle);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;

  const t =
    totalOnEdge === 1
      ? 0.5
      : 0.22 + (0.56 * indexOnEdge) / Math.max(1, totalOnEdge - 1);

  const mx = a.x + dx * t;
  const my = a.y + dy * t;

  const perpX = -dy / len;
  const perpY = dx / len;
  const spread = (indexOnEdge - (totalOnEdge - 1) / 2) * 16;

  return { x: mx + perpX * spread, y: my + perpY * spread };
}
