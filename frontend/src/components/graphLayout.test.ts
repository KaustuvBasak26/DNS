import { describe, expect, it } from "vitest";
import {
  attachPoint,
  edgeMarkerPosition,
  edgeMidpoint,
  handleIdsForEdge,
  LAYOUT,
  NODE_H,
  NODE_W,
} from "./graphLayout";

const nodeAt = (id: string) => ({
  id,
  position: LAYOUT[id],
  width: NODE_W,
  height: NODE_H,
});

describe("handleIdsForEdge", () => {
  it("uses left-right handles for horizontal hops", () => {
    expect(handleIdsForEdge("client", "resolver")).toEqual({
      sourceHandle: "source-right",
      targetHandle: "target-left",
    });
  });

  it("uses vertical handles for cache hop", () => {
    expect(handleIdsForEdge("resolver", "cache")).toEqual({
      sourceHandle: "source-top",
      targetHandle: "target-bottom",
    });
  });

  it("falls back when layout missing", () => {
    expect(handleIdsForEdge("unknown", "resolver")).toEqual({
      sourceHandle: "source-right",
      targetHandle: "target-left",
    });
  });
});

describe("attachPoint", () => {
  it("places right handle on east edge", () => {
    const p = attachPoint(nodeAt("client"), "source-right");
    expect(p.x).toBe(LAYOUT.client.x + NODE_W);
    expect(p.y).toBe(LAYOUT.client.y + NODE_H / 2);
  });
});

describe("edgeMidpoint", () => {
  it("returns midpoint between client and resolver", () => {
    const nodes = [nodeAt("client"), nodeAt("resolver")];
    const mid = edgeMidpoint("client", "resolver", nodes);
    expect(mid).not.toBeNull();
    expect(mid!.x).toBeGreaterThan(LAYOUT.client.x);
    expect(mid!.x).toBeLessThan(LAYOUT.resolver.x + NODE_W);
  });

  it("returns null for unknown nodes", () => {
    expect(edgeMidpoint("client", "missing", [nodeAt("client")])).toBeNull();
  });
});

describe("edgeMarkerPosition", () => {
  it("spreads multiple markers on same edge", () => {
    const nodes = [nodeAt("resolver"), nodeAt("root")];
    const a = edgeMarkerPosition("resolver", "root", nodes, 0, 2);
    const b = edgeMarkerPosition("resolver", "root", nodes, 1, 2);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.x !== b!.x || a!.y !== b!.y).toBe(true);
  });
});
