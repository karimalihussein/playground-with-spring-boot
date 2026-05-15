import { motion } from "framer-motion";

export function LifecycleBar({
  states,
  active,
}: {
  states: string[];
  active: number;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {states.map((s, i) => (
        <motion.span
          key={s}
          className={`rounded px-2 py-0.5 text-[9px] uppercase tracking-wide ${
            i === active ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50" : "bg-slate-800 text-slate-500"
          }`}
          layout
        >
          {s}
        </motion.span>
      ))}
    </div>
  );
}
