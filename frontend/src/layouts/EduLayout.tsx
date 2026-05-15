import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const NAV: readonly { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Overview", end: true },
  { to: "/protocol-lab", label: "Protocol lab" },
  { to: "/osi-lab", label: "OSI journey" },
  { to: "/grpc-lab", label: "gRPC" },
  { to: "/streaming-lab", label: "Streaming" },
  { to: "/websocket-lab", label: "WebSocket" },
  { to: "/http2-lab", label: "HTTP/2" },
  { to: "/dns-lab", label: "DNS" },
  { to: "/tls-lab", label: "TLS" },
];

export function EduLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen text-slate-100">
      <header className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center border-b border-slate-800/90 bg-slate-950/95 px-4 backdrop-blur">
        <span className="text-sm font-semibold tracking-tight text-cyan-200/95">Playground · networking education</span>
        <span className="ml-4 hidden text-[10px] text-slate-500 md:inline">One UI · React Router · Spring APIs under /rest and /demo</span>
      </header>
      <aside className="fixed bottom-0 left-0 top-12 z-40 w-56 overflow-y-auto border-r border-slate-800/80 bg-slate-950/90 p-3 backdrop-blur">
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/35" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Static</p>
          <a href="/bench-guide.html" className="block rounded px-2 py-1 text-[11px] text-slate-500 hover:text-cyan-400">
            Bench guide
          </a>
        </div>
      </aside>
      <main className="min-h-screen pl-56 pt-12">
        <motion.div key={pathname} initial={{ opacity: 0.88, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
