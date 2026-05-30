export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "TXT"
  | "PTR"
  | "SOA";

export type ServerRole =
  | "client"
  | "resolver"
  | "cache"
  | "root"
  | "tld"
  | "authoritative"
  | "target";

export interface DnsRecord {
  name: string;
  type: RecordType;
  value: string;
  ttl: number;
  priority?: number | null;
  zone: string;
  server_id: string;
  description: string;
}

export interface DnsServerNode {
  id: string;
  label: string;
  role: ServerRole;
  address: string;
  description: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ResolutionStep {
  step: number;
  from_node: string;
  to_node: string;
  query_type: string;
  query: string;
  record_type: RecordType;
  response: string;
  cache_hit: boolean;
  elapsed_ms: number;
  detail: string;
}

export interface ResolveResponse {
  domain: string;
  record_type: RecordType;
  answer: string | null;
  canonical_name: string;
  steps: ResolutionStep[];
  total_ms: number;
  cache_used: boolean;
  cname_chain: string[];
}

export interface RecordConversion {
  input: string;
  record_type: RecordType;
  output: string;
  mechanism: string;
  zone: string;
}

export interface DemoScenario {
  id: string;
  category: string;
  title: string;
  domain: string;
  record_type: RecordType;
  description: string;
  learning_goal: string;
}

export interface DemosResponse {
  scenarios: DemoScenario[];
  categories: string[];
}

export interface RecordsResponse {
  records: DnsRecord[];
  conversions: RecordConversion[];
  zones: string[];
}

export interface TopologyResponse {
  nodes: DnsServerNode[];
  edges: NetworkEdge[];
}
