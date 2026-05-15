export function LogsViewer({ title, text, className = "" }: { title?: string; text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {title && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{title}</span>}
      <pre className="max-h-48 overflow-auto rounded-lg border border-slate-800/80 bg-slate-950/90 p-3 font-mono text-[10px] leading-relaxed text-slate-300">{text || "…"}</pre>
    </div>
  );
}
