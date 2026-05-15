import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LABS = [
  { to: "/protocol-lab", title: "Protocol lab", blurb: "REST, gRPC unary/stream, WebSocket, HTTP/2 framing demos tied to Spring." },
  { to: "/osi-lab", title: "OSI journey", blurb: "Stack encapsulation, DNS, TCP, TLS — visual syllabus vs. real stacks." },
  { to: "/grpc-lab", title: "gRPC lab", blurb: "HTTP/2, protobuf framing, unary vs streaming mental models." },
  { to: "/streaming-lab", title: "Streaming lab", blurb: "Chunked responses, backpressure, throughput charts." },
  { to: "/websocket-lab", title: "WebSocket lab", blurb: "Duplex channels, compared to HTTP request/response." },
  { to: "/http2-lab", title: "HTTP/2 lab", blurb: "Multiplexing, priorities, HOL blocking intuition." },
  { to: "/dns-lab", title: "DNS lab", blurb: "Name resolution timeline and pointers into the OSI simulator." },
  { to: "/tls-lab", title: "TLS lab", blurb: "Record layer, handshakes, certificates — teaching view." },
] as const;

export function HomePage() {
  return (
    <div className="bg-grid min-h-screen pb-16">
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">Unified networking playground</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            One React app, one design system, many labs. Use the sidebar to switch topics; everything runs against the same Spring Boot backend
            (<code className="text-cyan-300/90">/rest</code>, <code className="text-cyan-300/90">/demo</code>).
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-8 sm:grid-cols-2">
        {LABS.map(({ to, title, blurb }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={to}
              className="glass flex h-full flex-col rounded-2xl border border-slate-800/80 p-5 transition-colors hover:border-cyan-500/35 hover:bg-slate-900/40"
            >
              <h2 className="text-sm font-semibold text-cyan-100/95">{title}</h2>
              <p className="mt-2 flex-1 text-xs text-slate-500">{blurb}</p>
              <span className="mt-3 text-[10px] font-medium uppercase tracking-wide text-cyan-500/80">Open →</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
