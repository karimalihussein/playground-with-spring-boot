import type { LatencyBreakdown, SerializationEdu } from "../types";

export async function fetchSerialization(square: number): Promise<SerializationEdu> {
  const r = await fetch(`/demo/edu/serialization?square=${square}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchRestUnary(count: number): Promise<{ body: ArrayBuffer; latency: LatencyBreakdown }> {
  const t0 = performance.now();
  const r = await fetch(`/rest/unary/${count}`);
  if (!r.ok) throw new Error(r.statusText);
  const t1 = performance.now();
  const buf = await r.arrayBuffer();
  const t2 = performance.now();
  return {
    body: buf,
    latency: {
      connect: (t1 - t0) * 0.15,
      tls: 0,
      serialize: (t2 - t1) * 0.25,
      server: (t2 - t1) * 0.35,
      transfer: (t2 - t1) * 0.25,
      render: 0,
    },
  };
}

export async function fetchGrpcUnary(count: number): Promise<{
  json: Record<string, unknown>;
  latency: LatencyBreakdown;
}> {
  const t0 = performance.now();
  const r = await fetch(`/demo/grpc/unary/${count}`);
  if (!r.ok) throw new Error(await r.text());
  const t1 = performance.now();
  const json = await r.json();
  const t2 = performance.now();
  return {
    json,
    latency: {
      connect: (t1 - t0) * 0.1,
      tls: 0,
      serialize: (t2 - t1) * 0.2,
      server: Number((json as { serverProcessingNanos?: number }).serverProcessingNanos ?? 0) / 1e6,
      transfer: (t2 - t1) * 0.4,
      render: (t2 - t1) * 0.1,
    },
  };
}
