/** Protocol stack / framing badges — teaching labels, not wire-accurate enums. */
export function ProtocolBadgeRow({ labels, highlight }: { labels: string[]; highlight: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((l, i) => (
        <span
          key={l}
          className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${
            i === highlight ? "bg-slate-700 text-cyan-200 ring-1 ring-cyan-500/40" : "bg-slate-800/80 text-slate-500"
          }`}
        >
          {l}
        </span>
      ))}
    </div>
  );
}
