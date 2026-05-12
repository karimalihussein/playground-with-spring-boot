import { motion } from "framer-motion";
import type { LatencyBreakdown } from "../types";

export function LatencyBars({ lat }: { lat: LatencyBreakdown | null }) {
  if (!lat) return null;
  const entries = Object.entries(lat) as [keyof LatencyBreakdown, number][];
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
      <div className="text-[9px] uppercase text-slate-500">Latency model (client-side split)</div>
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-20 text-[9px] text-slate-400">{k}</span>
          <div className="h-2 flex-1 rounded bg-slate-800">
            <motion.div
              className="h-2 rounded bg-indigo-400/80"
              initial={{ width: 0 }}
              animate={{ width: `${(v / max) * 100}%` }}
            />
          </div>
          <span className="w-14 text-right text-[9px] tabular-nums text-slate-300">{v.toFixed(2)} ms</span>
        </div>
      ))}
    </div>
  );
}

export function TcpHud({
  tcp,
  streams,
  ws,
  reused,
}: {
  tcp: number;
  streams: number;
  ws: number;
  reused: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-[9px] text-slate-300 md:grid-cols-4">
      <Metric k="TCP (est.)" v={tcp} />
      <Metric k="HTTP/2 streams" v={streams} />
      <Metric k="WS sockets" v={ws} />
      <Metric k="Reused REST" v={reused} />
    </div>
  );
}

function Metric({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded border border-slate-800/80 bg-slate-900/50 px-2 py-1">
      <div className="text-slate-500">{k}</div>
      <div className="text-sm font-semibold tabular-nums text-cyan-200">{v}</div>
    </div>
  );
}

export function MemoryHud({ bufferedChars, incrementalChunks }: { bufferedChars: number; incrementalChunks: number }) {
  const restEstKb = (bufferedChars * 2) / 1024;
  const streamEstKb = (incrementalChunks * 48) / 1024;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-[10px]">
      <div className="mb-1 font-medium text-slate-400">Memory intuition (rough JS model)</div>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <div className="text-slate-500">REST / unary</div>
          <motion.div
            className="mt-1 h-3 rounded bg-blue-500/40"
            animate={{ width: `${Math.min(100, restEstKb * 8)}%` }}
            style={{ maxWidth: "100%" }}
          />
          <div className="text-slate-400">~{restEstKb.toFixed(1)} KB string graph (UTF-16 fudge)</div>
        </div>
        <div>
          <div className="text-slate-500">Streaming (+ slow consumer)</div>
          <motion.div
            className="mt-1 h-3 rounded bg-orange-500/40"
            animate={{ width: `${Math.min(100, streamEstKb * 12)}%` }}
            style={{ maxWidth: "100%" }}
          />
          <div className="text-slate-400">{incrementalChunks} chunks processed incrementally</div>
        </div>
      </div>
    </div>
  );
}
