import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { ThroughputCharts } from "../components/network/ThroughputCharts";
import { NetworkFlow } from "../components/network/NetworkFlow";
import { LifecycleBar } from "../components/network/LifecycleBar";
import { useLab } from "../context/GlobalLabContext";
import { TermTip } from "../components/network/TermTip";

/** Chunked / SSE style streaming — charts share global lab context with Protocol lab. */
export function StreamingLabPage() {
  const lab = useLab();

  const pulseDemo = () => {
    lab.resetCharts();
    for (let i = 0; i < 12; i++) {
      lab.pushChartSample({
        msgsPerSec: 4 + Math.sin(i / 2) * 3,
        chunksPerSec: 20 + i,
        kbPerSec: 12 + i * 2,
        buffer: Math.max(0, 8 - i * 0.5),
        renderMs: 6 + (i % 4),
      });
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <LabPageHeader
        title="Streaming lab"
        kicker="Server push · backpressure"
        refs={[
          { label: "Fetch living standard", href: "https://fetch.spec.whatwg.org/" },
          { label: "MDN: ReadableStream", href: "https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream" },
        ]}
      >
        <p>
          Streaming overlaps <TermTip label="gRPC server-streaming" brief="Many messages per RPC." detail="HTTP/2 DATA frames chunk logical messages." accent="text-orange-300" />,{" "}
          <TermTip label="SSE" brief="Text/event-stream." detail="One long-lived HTTP response with periodic events." accent="text-sky-300" />, and chunked HTTP. The charts below reuse the same telemetry buffer as Protocol
          lab so you can compare runs.
        </p>
      </LabPageHeader>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl border border-slate-800/80 p-4">
            <h3 className="text-xs font-semibold text-slate-200">Narrative flow</h3>
            <NetworkFlow variant="stream" phase="data" />
            <LifecycleBar states={["TCP+H2", "Headers", "Producing", "Consuming", "Idle"]} active={3} />
          </div>
          <div className="glass rounded-2xl border border-slate-800/80 p-4">
            <h3 className="text-xs font-semibold text-slate-200">Synthetic chart pulse</h3>
            <p className="mt-1 text-[11px] text-slate-500">Illustrates how the chart reacts when chunks/sec move faster than the render loop smooths them.</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="mt-3 rounded-lg bg-orange-400 px-3 py-2 text-xs font-semibold text-slate-950"
              onClick={pulseDemo}
            >
              Push sample telemetry
            </motion.button>
          </div>
        </div>
        <ThroughputCharts data={lab.chartWindow} />
        <p className="text-center text-xs text-slate-500">
          Open a real SSE + gRPC stream in{" "}
          <Link className="text-cyan-400 underline" to="/protocol-lab">
            Protocol lab
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
