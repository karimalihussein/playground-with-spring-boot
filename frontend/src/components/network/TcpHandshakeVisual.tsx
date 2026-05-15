import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  { id: "syn", dir: "c2s" as const, label: "SYN", detail: "Initial sequence (simplified)" },
  { id: "synack", dir: "s2c" as const, label: "SYN-ACK", detail: "Server ISN + acknowledgment" },
  { id: "ack", dir: "c2s" as const, label: "ACK", detail: "Handshake complete (RFC 9293)" },
];

/** Pedagogical three-way handshake — not a byte-accurate TCP segment viewer. */
export function TcpHandshakeVisual({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <div className="glass rounded-2xl border border-slate-800/80 p-4">
      <h3 className="text-xs font-semibold text-slate-200">TCP three-way handshake</h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Teaching animation only — see{" "}
        <a className="text-sky-400 underline" href="https://www.rfc-editor.org/rfc/rfc9293" target="_blank" rel="noreferrer">
          RFC 9293
        </a>
        .
      </p>
      <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-300">
        <span className="text-cyan-200/95">Client</span>
        <span className="text-violet-200/95">Server</span>
      </div>
      <div className="relative mt-3 min-h-[140px]">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-slate-700/80" aria-hidden />
        <ul className="relative flex flex-col gap-4">
          {STEPS.map((s, i) => {
            const visible = step > i;
            const Arrow = () => (
              <div
                className={`flex items-center ${s.dir === "c2s" ? "justify-start pl-0" : "justify-end pr-0"}`}
                style={{ minHeight: 28 }}
              >
                <motion.div
                  initial={false}
                  animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0.25, scale: 0.98 }}
                  className={`max-w-[min(100%,220px)] rounded-lg border px-2 py-1.5 ${
                    s.dir === "c2s" ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-violet-500/40 bg-violet-500/10 text-violet-100"
                  }`}
                >
                  <div className="text-[11px] font-semibold">{s.label}</div>
                  <div className="text-[10px] text-slate-400">{s.detail}</div>
                </motion.div>
              </div>
            );
            return (
              <li key={s.id}>
                <Arrow />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Auto-advances the handshake so labs feel alive without user interaction. */
export function TcpHandshakeDemo() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => ((((s + 1) % 4) + 4) % 4) as 0 | 1 | 2 | 3);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);
  return <TcpHandshakeVisual step={step} />;
}
