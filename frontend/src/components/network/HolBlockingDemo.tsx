import { motion } from "framer-motion";
import { TermTip } from "./TermTip";

export function HolBlockingDemo() {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">
        Head-of-line blocking (concept)
        <TermTip
          label="HOL"
          brief="A large or slow response can delay others when multiplexing is absent or limited."
          detail="HTTP/2 addresses this at the HTTP framing layer; TCP has its own HOL story at the transport layer."
          accent="text-rose-300"
        />
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3">
          <div className="mb-2 text-[10px] text-rose-200">HTTP/1.1 — one lane</div>
          <Lane bars={[{ w: 90, slow: true }, { w: 35, slow: false }, { w: 45, slow: false }]} />
        </div>
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
          <div className="mb-2 text-[10px] text-emerald-200">HTTP/2 — concurrent streams</div>
          <div className="flex flex-col gap-1">
            {[55, 40, 48].map((w, i) => (
              <motion.div
                key={i}
                className="h-2 rounded-full bg-emerald-400/70"
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Lane({ bars }: { bars: { w: number; slow: boolean }[] }) {
  return (
    <div className="flex h-16 flex-col justify-center gap-1">
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className={`h-2 rounded-full ${b.slow ? "bg-rose-400/90" : "bg-slate-600"}`}
          initial={{ width: 0 }}
          animate={{ width: `${b.w}%` }}
          transition={{ delay: i * 0.45, duration: b.slow ? 1.2 : 0.35 }}
        />
      ))}
    </div>
  );
}
