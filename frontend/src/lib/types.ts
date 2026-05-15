/** Shared shapes for the protocol lab UI layer (not wire-accurate protos — teaching only). */

export type PanelKind = "rest" | "unary" | "stream" | "ws";

export type ChartPoint = {
  t: number;
  msgsPerSec: number;
  chunksPerSec: number;
  kbPerSec: number;
  buffer: number;
  renderMs: number;
};

export type LatencyBreakdown = {
  connect: number;
  tls: number;
  serialize: number;
  server: number;
  transfer: number;
  render: number;
};

export type SerializationEdu = {
  jsonSample: string;
  jsonUtf8Bytes: number;
  protobufChunkHex: string;
  protobufChunkBytes: number;
  note: string;
};

export function wsUrl(path: string): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}
