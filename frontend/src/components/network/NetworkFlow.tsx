import { motion } from "framer-motion";

export type FlowVariant = "rest" | "unary" | "stream" | "ws";

export function NetworkFlow({
  variant,
  phase,
}: {
  variant: FlowVariant;
  phase: "idle" | "request" | "wait" | "data" | "done";
}) {
  const active = phase !== "idle";

  const arrowColor =
    variant === "rest"
      ? "#5b8cff"
      : variant === "unary"
        ? "#00c896"
        : variant === "stream"
          ? "#ff8c42"
          : "#d946ef";

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-3 font-mono text-[10px]">
      <div className="mb-2 flex justify-between text-slate-500">
        <span>Client</span>
        <span>Server</span>
      </div>
      <div className="relative h-16">
        {variant === "rest" && (
          <svg viewBox="0 0 200 60" className="h-full w-full">
            <motion.line
              x1="10"
              y1="30"
              x2="190"
              y2="30"
              stroke={arrowColor}
              strokeWidth="2"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength:
                  active && phase === "request" ? 1 : phase === "wait" ? 1 : phase === "done" ? 0.3 : 0.05,
              }}
              transition={{ duration: 0.6 }}
            />
            {active && (phase === "wait" || phase === "data") && (
              <motion.text x="70" y="22" fill="#ffc857" fontSize="9" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                waiting…
              </motion.text>
            )}
            {phase === "done" && (
              <motion.line
                x1="190"
                y1="38"
                x2="20"
                y2="38"
                stroke="#5b8cff"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </svg>
        )}
        {variant === "unary" && (
          <svg viewBox="0 0 200 60" className="h-full w-full">
            <text x="5" y="12" fill="#64748b" fontSize="8">
              HTTP/2 · one connection
            </text>
            <motion.rect x="8" y="22" width="184" height="10" rx="2" fill="none" stroke="#334155" strokeWidth="1" />
            <motion.line
              x1="20"
              y1="27"
              x2="160"
              y2="27"
              stroke={arrowColor}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: phase === "request" || phase === "wait" || phase === "data" || phase === "done" ? 1 : 0,
              }}
              transition={{ duration: 0.4 }}
            />
            {phase === "done" && (
              <motion.line
                x1="170"
                y1="34"
                x2="30"
                y2="34"
                stroke={arrowColor}
                strokeWidth="2"
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
            )}
          </svg>
        )}
        {(variant === "stream" || variant === "ws") && (
          <svg viewBox="0 0 200 60" className="h-full w-full">
            <text x="5" y="10" fill="#64748b" fontSize="8">
              {variant === "stream" ? "Chunks · SSE in browser" : "WebSocket · duplex"}
            </text>
            <motion.line x1="15" y1="26" x2="185" y2="26" stroke="#334155" strokeWidth="2" />
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                r="3"
                fill={variant === "ws" ? "#d946ef" : "#ff8c42"}
                initial={{ cx: 185, cy: 42 }}
                animate={phase === "data" || phase === "done" ? { cx: 30 + i * 18, cy: 42 } : { cx: 185, cy: 42 }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
              />
            ))}
            {variant === "ws" && phase === "data" && (
              <motion.line
                x1="60"
                y1="52"
                x2="140"
                y2="52"
                stroke="#22d3ee"
                strokeWidth="1"
                strokeDasharray="3 2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
