/** Hex-ish inspector for teaching — shows UTF-8 length and a short prefix. */
export function ByteInspector({ label, utf8Sample }: { label: string; utf8Sample: string }) {
  const enc = new TextEncoder().encode(utf8Sample);
  const hex = [...enc.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px]">
      <div className="font-medium text-slate-200">{label}</div>
      <div className="mt-1 text-slate-500">{enc.length} bytes (UTF-8)</div>
      <pre className="mt-2 overflow-x-auto rounded bg-slate-900/80 p-2 font-mono text-[10px] text-emerald-200/90">{hex}{enc.length > 16 ? " …" : ""}</pre>
    </div>
  );
}
