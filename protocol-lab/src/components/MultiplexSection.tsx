import { motion } from "framer-motion";
import { TermTip } from "./EduPrimitives";

/** Contrasts sequential connections / HOL blocking with HTTP/2 multiplexing (RFC 9113). */
export function MultiplexSection() {
  return (
    <section className="glass rounded-2xl p-4 shadow-glow">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-slate-200">
        HTTP/1.1 vs HTTP/2 multiplexing
        <TermTip
          label="Multiplexing"
          brief="Many independent streams share one TCP connection."
          detail="See RFC 9113 stream layers; gRPC maps RPCs to HTTP/2 streams."
          accent="text-amber-300"
        />
      </h3>
      <p className="mb-3 text-[11px] text-slate-400">
        HTTP/1.1 traditionally needs parallel TCP connections or stalls behind a slow response (head-of-line). HTTP/2 interleaves
        frames from many streams on one connection.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] font-medium text-slate-500">HTTP/1.1 style (simplified)</div>
          <div className="space-y-2">
            {["Conn A · slow req blocks lane", "Conn B · separate socket", "Conn C · extra handshake cost"].map((t, i) => (
              <motion.div
                key={t}
                className={`rounded border border-slate-700 bg-slate-900/60 px-2 py-2 text-[10px] ${i === 0 ? "text-amber-200" : "text-slate-300"}`}
                initial={{ x: -6, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                {t}
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium text-slate-500">HTTP/2 · one connection</div>
          <div className="relative h-28 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-2">
            {[1, 3, 5].map((sid, idx) => (
              <motion.div
                key={sid}
                className="absolute left-2 right-2 h-5 rounded bg-emerald-500/15 ring-1 ring-emerald-400/30"
                style={{ top: 8 + idx * 22 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.15, duration: 0.4 }}
              >
                <span className="pl-2 text-[9px] text-emerald-200">Stream #{sid} · interleaved DATA frames</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
