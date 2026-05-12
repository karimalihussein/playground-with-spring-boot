import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import type { ChartPoint } from "../types";

export function ThroughputCharts({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="glass flex h-40 items-center justify-center rounded-xl text-xs text-slate-500">
        Run panels to populate live charts…
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="glass h-44 rounded-xl p-2">
        <div className="mb-1 text-[10px] text-slate-500">Chunks/sec · msgs/sec</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 9 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 11 }} />
            <Line type="monotone" dataKey="chunksPerSec" stroke="#ff8c42" dot={false} strokeWidth={2} name="chunks/s" />
            <Line type="monotone" dataKey="msgsPerSec" stroke="#5b8cff" dot={false} strokeWidth={2} name="msgs/s" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="glass h-44 rounded-xl p-2">
        <div className="mb-1 text-[10px] text-slate-500">Backpressure proxy · buffered KB (UI model)</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 9 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 11 }} />
            <Area type="monotone" dataKey="buffer" stroke="#f472b6" fill="#f472b633" name="buffer KB" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
