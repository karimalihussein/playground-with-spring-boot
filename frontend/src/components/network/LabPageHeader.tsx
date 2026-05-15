import type { ReactNode } from "react";

export function LabPageHeader({
  kicker,
  title,
  children,
  refs,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
  refs?: { label: string; href: string }[];
}) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 py-5">
        {kicker && (
          <p className="mb-2 inline-block rounded-lg bg-cyan-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-500/30">
            {kicker}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">{title}</h1>
        {children && <div className="mt-2 max-w-3xl text-sm text-slate-400">{children}</div>}
        {refs && refs.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {refs.map((r) => (
              <li key={r.href}>
                <a className="text-sky-400 hover:underline" href={r.href} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
