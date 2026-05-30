import type {
  DemosResponse,
  RecordsResponse,
  ResolveResponse,
  TopologyResponse,
} from "../types";

const BASE = "/api";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    fetchJson<{ status: string; records: number; zones: number; servers: number }>(
      "/health"
    ),
  topology: () => fetchJson<TopologyResponse>("/topology"),
  records: () => fetchJson<RecordsResponse>("/records"),
  demos: () => fetchJson<DemosResponse>("/demos"),
  cache: () => fetchJson<{ entries: unknown[] }>("/cache"),
  clearCache: () =>
    fetchJson<{ cleared: boolean }>("/cache", { method: "DELETE" }),
  resolve: (domain: string, recordType: string, useCache: boolean) =>
    fetchJson<ResolveResponse>("/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        record_type: recordType,
        use_cache: useCache,
      }),
    }),
};
