import { TermTip } from "./EduPrimitives";
import { motion } from "framer-motion";

export function BrowserBridgeExplainer() {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">
        Browser reality check
        <TermTip
          label="gRPC in browsers"
          brief="Native gRPC needs HTTP/2 + framing; browsers use fetch/XHR/WebSocket."
          detail="Production pattern: gRPC-Web (Envoy/Proxy) or a small backend relay — exactly what this app does for unary/stream demos."
          accent="text-sky-300"
        />
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-2 py-4 font-mono text-[10px] text-slate-300 md:text-xs">
        <span className="rounded border border-slate-600 px-2 py-1">Browser</span>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-cyan-300">
          ──SSE / fetch / WS──►
        </motion.span>
        <span className="rounded border border-emerald-700 px-2 py-1 text-emerald-200">Spring bridge</span>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} className="text-emerald-300">
          ──gRPC HTTP/2──►
        </motion.span>
        <span className="rounded border border-slate-600 px-2 py-1">Netty gRPC</span>
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Unary panel uses JSON over HTTP to wrap one protobuf response. Streaming uses SSE carrying chunks from a real server-streaming RPC.
      </p>
    </section>
  );
}
