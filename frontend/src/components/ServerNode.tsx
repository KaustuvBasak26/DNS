import { Handle, Position } from "@xyflow/react";

const ROLE_COLORS: Record<string, string> = {
  client: "var(--role-client)",
  resolver: "var(--role-resolver)",
  cache: "var(--role-cache)",
  root: "var(--role-root)",
  tld: "var(--role-tld)",
  authoritative: "var(--role-auth)",
  target: "var(--role-target)",
};

export function ServerNode({
  data,
}: {
  data: {
    label: string;
    role: string;
    address: string;
    active?: boolean;
    pulse?: boolean;
    isFinalHop?: boolean;
  };
}) {
  const color = ROLE_COLORS[data.role] ?? "var(--muted)";
  return (
    <div className="server-node-wrap">
      <Handle id="target-left" type="target" position={Position.Left} className="flow-handle" />
      <Handle id="target-right" type="target" position={Position.Right} className="flow-handle" />
      <Handle id="target-top" type="target" position={Position.Top} className="flow-handle" />
      <Handle id="target-bottom" type="target" position={Position.Bottom} className="flow-handle" />
      <div
        className={`server-node ${data.active ? "active" : ""} ${data.pulse ? "pulse" : ""} ${data.isFinalHop ? "final" : ""}`}
        style={{ "--node-accent": color } as React.CSSProperties}
      >
        <div className="server-node-title">{data.label}</div>
        <div className="server-node-addr">{data.address}</div>
        <div className="server-node-role">{data.role}</div>
      </div>
      <Handle id="source-right" type="source" position={Position.Right} className="flow-handle" />
      <Handle id="source-left" type="source" position={Position.Left} className="flow-handle" />
      <Handle id="source-top" type="source" position={Position.Top} className="flow-handle" />
      <Handle id="source-bottom" type="source" position={Position.Bottom} className="flow-handle" />
    </div>
  );
}
