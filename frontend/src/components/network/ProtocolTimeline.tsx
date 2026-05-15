import { motion } from "framer-motion";

export type TimelineStep = { id: string; label: string; detail?: string };

export function ProtocolTimeline({ steps, activeIndex }: { steps: TimelineStep[]; activeIndex: number }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <motion.li
            key={s.id}
            layout
            className={`relative flex gap-3 rounded-xl border px-3 py-2 text-xs ${
              active ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-50" : done ? "border-slate-600/60 bg-slate-900/40 text-slate-400" : "border-slate-800/80 bg-slate-950/40 text-slate-500"
            }`}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">{i + 1}</span>
            <div>
              <div className="font-medium text-slate-100">{s.label}</div>
              {s.detail && <p className="mt-0.5 text-[11px] text-slate-500">{s.detail}</p>}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
