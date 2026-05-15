import { motion } from "framer-motion";

/** Small “?” chip — expands educational copy on hover (no extra deps). */
export function TermTip({
  label,
  brief,
  detail,
  accent,
}: {
  label: string;
  brief: string;
  detail: string;
  accent: string;
}) {
  return (
    <span className="group relative inline-flex align-middle">
      <span
        className={`ml-0.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold ${accent}`}
        title={detail}
      >
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden w-56 -translate-x-1/2 rounded-lg border border-slate-600/50 bg-slate-950/95 p-2 text-[11px] leading-snug text-slate-200 shadow-xl group-hover:block">
        <span className="font-semibold text-cyan-200">{label}</span>
        <br />
        {brief}
        <br />
        <span className="text-slate-400">{detail}</span>
      </span>
    </span>
  );
}
