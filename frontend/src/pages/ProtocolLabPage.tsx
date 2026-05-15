import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLab } from "../context/GlobalLabContext";
import { MultiplexSection } from "../components/network/MultiplexSection";
import { HolBlockingDemo } from "../components/network/HolBlockingDemo";
import { BrowserBridgeExplainer } from "../components/network/BrowserBridgeExplainer";
import { SerializationWall } from "../components/network/SerializationWall";
import { ThroughputCharts } from "../components/network/ThroughputCharts";
import { Http2FrameStrip } from "../components/network/Http2FrameStrip";
import { LatencyBars, TcpHud, MemoryHud } from "../components/network/MetricsHud";
import { LifecycleBar } from "../components/network/LifecycleBar";
import { NetworkFlow } from "../components/network/NetworkFlow";
import { PanelCard } from "../components/network/PanelCard";
import { ProtocolBadgeRow } from "../components/network/ProtocolBadgeRow";
import { TermTip } from "../components/network/TermTip";
import { fetchGrpcUnary, fetchRestUnary } from "../lib/api";
import type { LatencyBreakdown } from "../lib/types";
import { wsUrl } from "../lib/types";

type Flow = "idle" | "request" | "wait" | "data" | "done";

export function ProtocolLabPage() {
  const lab = useLab();
  const [logRest, setLogRest] = useState("");
  const [logUnary, setLogUnary] = useState("");
  const [logStream, setLogStream] = useState("");
  const [logWs, setLogWs] = useState("");

  const [phaseRest, setPhaseRest] = useState<Flow>("idle");
  const [phaseUnary, setPhaseUnary] = useState<Flow>("idle");
  const [phaseStream, setPhaseStream] = useState<Flow>("idle");
  const [phaseWs, setPhaseWs] = useState<Flow>("idle");

  const [latRest, setLatRest] = useState<LatencyBreakdown | null>(null);
  const [latUnary, setLatUnary] = useState<LatencyBreakdown | null>(null);

  const [bytesRest, setBytesRest] = useState(0);
  const [bytesUnary, setBytesUnary] = useState(0);
  const [chunks, setChunks] = useState(0);
  const [bufChars, setBufChars] = useState(0);
  const [wsChunks, setWsChunks] = useState(0);
  const [frameStripOn, setFrameStripOn] = useState(false);
  const [stripCount, setStripCount] = useState(8);

  const esRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [tcpHud, setTcpHud] = useState({ tcp: 1, streams: 0, ws: 0, reused: 0 });

  const push = useCallback((which: "rest" | "u" | "s" | "w", line: string) => {
    const stamp = new Date().toISOString().slice(11, 23);
    const row = `${stamp}  ${line}`;
    if (which === "rest") setLogRest((l) => l + "\n" + row);
    if (which === "u") setLogUnary((l) => l + "\n" + row);
    if (which === "s") setLogStream((l) => l + "\n" + row);
    if (which === "w") setLogWs((l) => l + "\n" + row);
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runRest = async () => {
    push("rest", "GET /rest/unary/" + lab.count);
    setPhaseRest("request");
    setTcpHud((h) => ({ ...h, reused: h.reused + 1 }));

    await sleep(lab.artificialLatencyMs);
    try {
      setPhaseRest("wait");
      const { body, latency } = await fetchRestUnary(lab.count);
      const txt = new TextDecoder().decode(body);
      setBytesRest(body.byteLength);
      setBufChars(txt.length);
      setLatRest(latency);
      setPhaseRest("data");
      await sleep(40);
      setPhaseRest("done");
      push("rest", `done · ${body.byteLength} B JSON`);
      lab.pushChartSample({
        msgsPerSec: 1,
        chunksPerSec: 0,
        kbPerSec: body.byteLength / 1024,
        buffer: lab.queueDepth,
        renderMs: 8,
      });
    } catch (e) {
      push("rest", "ERROR " + (e as Error).message);
      setPhaseRest("idle");
    }
  };

  const runUnary = async () => {
    push("u", "GET /demo/grpc/unary/" + lab.count + " (real gRPC behind JSON)");
    setPhaseUnary("request");
    setTcpHud((h) => ({ ...h, streams: h.streams + 1 }));

    await sleep(lab.artificialLatencyMs);
    try {
      setPhaseUnary("wait");
      const { json, latency } = await fetchGrpcUnary(lab.count);
      const pb = Number((json as { grpcUnaryMessageOnWireBytesApprox?: number }).grpcUnaryMessageOnWireBytesApprox ?? 0);
      setBytesUnary(pb);
      setBufChars(JSON.stringify(json).length);
      setLatUnary(latency);
      setPhaseUnary("data");
      await sleep(30);
      setPhaseUnary("done");
      push("u", `done · on-wire approx ${pb} B protobuf path`);
      setFrameStripOn(true);
      setStripCount(Math.min(lab.count, 12));
      lab.pushChartSample({
        msgsPerSec: 1,
        chunksPerSec: 0,
        kbPerSec: pb / 1024,
        buffer: lab.queueDepth,
        renderMs: 6,
      });
    } catch (e) {
      push("u", "ERROR " + (e as Error).message);
      setPhaseUnary("idle");
    }
  };

  const runStream = () => {
    esRef.current?.close();
    setChunks(0);
    setLogStream("");
    push("s", "EventSource → SSE relay → gRPC GenerateNumbersStream");
    setPhaseStream("request");
    setFrameStripOn(true);
    setStripCount(Math.min(lab.count, 16));
    setTcpHud((h) => ({ ...h, streams: h.streams + 2 }));

    const url = `/demo/grpc/stream/${lab.count}?emitDelayMs=${lab.streamEmitDelayMs}`;
    const es = new EventSource(url);
    esRef.current = es;
    let t0 = performance.now();
    let lastBurst = performance.now();
    let burst = 0;

    es.addEventListener("open", () => {
      setPhaseStream("wait");
      push("s", "stream open (browser sees SSE)");
      t0 = performance.now();
    });

    const onChunk = async (ev: MessageEvent) => {
      burst++;
      const now = performance.now();
      if (lab.slowConsumerOn) lab.addQueue(1);
      const delay = lab.slowConsumerOn ? lab.slowConsumerMs : 0;
      await sleep(delay);
      const row = JSON.parse(ev.data as string) as { index: number; square: number; protobufChunkBytes: number };
      setChunks((c) => c + 1);
      push("s", `chunk #${row.index} proto ~${row.protobufChunkBytes} B`);
      if (lab.slowConsumerOn) lab.addQueue(-1);
      if (now - lastBurst > 200) {
        const dt = (now - lastBurst) / 1000;
        lab.pushChartSample({
          msgsPerSec: 0,
          chunksPerSec: burst / dt,
          kbPerSec: ev.data.length / 1024 / dt,
          buffer: lab.queueDepth * 4,
          renderMs: delay,
        });
        burst = 0;
        lastBurst = now;
      }
      setPhaseStream("data");
    };

    es.addEventListener("chunk", (ev) => {
      void onChunk(ev);
    });

    es.addEventListener("complete", () => {
      push("s", "complete · gRPC side closed RPC");
      setPhaseStream("done");
      es.close();
      lab.pushChartSample({
        msgsPerSec: 0,
        chunksPerSec: 0,
        kbPerSec: 0,
        buffer: 0,
        renderMs: performance.now() - t0,
      });
    });

    es.addEventListener("fail", (ev) => {
      push("s", "fail · " + (ev as MessageEvent).data);
      setPhaseStream("idle");
      es.close();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      push("s", "EventSource error");
      setPhaseStream("idle");
      es.close();
    };
  };

  const runWs = () => {
    wsRef.current?.close();
    setWsChunks(0);
    setLogWs("");
    push("w", "WebSocket /demo/ws/numbers");
    setPhaseWs("request");

    const ws = new WebSocket(wsUrl("/demo/ws/numbers"));
    wsRef.current = ws;
    setTcpHud((h) => ({ ...h, ws: 1 }));

    ws.onopen = () => {
      setPhaseWs("data");
      push("w", "socket open · duplex path ready");
      ws.send(
        JSON.stringify({
          cmd: "stream",
          count: lab.count,
          frameDelayMs: lab.wsFrameDelayMs,
        }),
      );
    };

    ws.onmessage = (ev) => {
      void (async () => {
        const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
        if (lab.slowConsumerOn) lab.addQueue(1);
        await sleep(lab.slowConsumerOn ? lab.slowConsumerMs : 0);
        if (msg.type === "chunk") setWsChunks((c) => c + 1);
        push("w", (msg.type as string) + " · " + JSON.stringify(msg).slice(0, 120));
        if (lab.slowConsumerOn) lab.addQueue(-1);
      })();
    };

    ws.onerror = () => push("w", "ws error");
    ws.onclose = () => {
      setPhaseWs("done");
      setTcpHud((h) => ({ ...h, ws: 0 }));
      push("w", "socket closed");
    };
  };

  const runConcurrent = async () => {
    lab.resetCharts();
    const n = lab.concurrentUsers;
    push("rest", `Concurrent load · ${n} parallel GET /rest/unary/${Math.min(lab.count, 400)}`);
    setTcpHud((h) => ({ ...h, tcp: h.tcp + n }));
    const c = Math.min(lab.count, 400);
    await Promise.all(Array.from({ length: n }, () => fetch(`/rest/unary/${c}`).then((r) => r.arrayBuffer())));
    push("rest", "burst finished — compare with HTTP/2 animation above");
  };

  return (
    <div className="bg-grid min-h-screen pb-16">
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">Protocol Lab · interactive networking</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Feel request/response, unary RPC, server streaming, and WebSocket push. Numbers are toys — the goal is to <em>see</em>{" "}
            framing, streaming, multiplexing, and backpressure. References:{" "}
            <a className="text-sky-400 hover:underline" href="https://www.rfc-editor.org/rfc/rfc9113">
              HTTP/2 (RFC 9113)
            </a>
            ,{" "}
            <a className="text-sky-400 hover:underline" href="https://grpc.io/docs/what-is-grpc/core-concepts/">
              gRPC concepts
            </a>
            ,{" "}
            <a className="text-sky-400 hover:underline" href="https://fetch.spec.whatwg.org/">
              Fetch
            </a>
            .
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 pt-4">
        <section className="glass flex flex-wrap items-end gap-3 rounded-2xl p-4">
          <label className="text-xs text-slate-400">
            Count
            <input
              type="number"
              min={1}
              max={500000}
              value={lab.count}
              onChange={(e) => lab.setCount(Number(e.target.value))}
              className="ml-2 w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            SSE emit delay (ms)
            <input
              type="number"
              min={0}
              max={500}
              value={lab.streamEmitDelayMs}
              onChange={(e) => lab.setStreamEmitDelayMs(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <label className="text-xs text-slate-400">
            WS frame delay (ms)
            <input
              type="number"
              min={0}
              max={500}
              value={lab.wsFrameDelayMs}
              onChange={(e) => lab.setWsFrameDelayMs(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={lab.slowConsumerOn} onChange={(e) => lab.setSlowConsumerOn(e.target.checked)} />
            Slow consumer (backpressure demo)
            <TermTip
              label="Backpressure"
              brief="If you process slower than production, buffers grow — flow control propagates."
              detail="HTTP/2 uses WINDOW_UPDATE; gRPC surfaces this via blocking writes. Here the UI simulates a slow sink."
              accent="text-fuchsia-300"
            />
          </label>
          <label className="text-xs text-slate-400">
            Sink delay (ms)
            <input
              type="number"
              min={0}
              max={2000}
              value={lab.slowConsumerMs}
              onChange={(e) => lab.setSlowConsumerMs(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <label className="text-xs text-slate-400">
            Simulated RTT (ms)
            <input
              type="number"
              min={0}
              max={3000}
              value={lab.artificialLatencyMs}
              onChange={(e) => lab.setArtificialLatencyMs(Number(e.target.value))}
              className="ml-2 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <label className="text-xs text-slate-400">
            Concurrent users{" "}
            <TermTip
              label="Load"
              brief="Fires parallel REST calls — dramatizes connection fan-out on HTTP/1.1-style clients."
              detail="Reality is nuanced (keep-alive, pools, HTTP/2) — this is a teaching exaggeration."
              accent="text-amber-300"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={lab.concurrentUsers}
              onChange={(e) => lab.setConcurrentUsers(Number(e.target.value))}
              className="ml-2 w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-slate-950"
            onClick={runConcurrent}
          >
            Run concurrent REST burst
          </motion.button>
        </section>

        <TcpHud tcp={tcpHud.tcp} streams={tcpHud.streams} ws={tcpHud.ws} reused={tcpHud.reused} />
        <MemoryHud bufferedChars={bufChars} incrementalChunks={chunks + wsChunks} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MultiplexSection />
          <HolBlockingDemo />
        </div>
        <BrowserBridgeExplainer />
        <SerializationWall square={1024} />
        <ThroughputCharts data={lab.chartWindow} />

        <div className="grid gap-4 xl:grid-cols-4">
          <PanelCard title="REST" subtitle="HTTP/1.1 · JSON · request → full body" accent="border-blue-500/40 shadow-[0_0_30px_rgba(91,140,255,0.08)]">
            <ProtocolBadgeRow labels={["HTTP/1.1", "JSON", "Tomcat/MVC", "Duplex: simplex response"]} highlight={0} />
            <NetworkFlow variant="rest" phase={phaseRest === "idle" ? "idle" : phaseRest} />
            <LifecycleBar
              states={["TCP", "HTTP request", "Waiting", "Full buffer", "Idle"]}
              active={["idle", "request", "wait", "data", "done"].indexOf(phaseRest)}
            />
            <LatencyBars lat={latRest} />
            <div className="text-[10px] text-slate-500">Payload: {bytesRest || "—"} B</div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-slate-950"
              onClick={runRest}
            >
              Send REST request
            </motion.button>
            <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950/80 p-2 text-[10px] text-slate-300">{logRest || "…"}</pre>
          </PanelCard>

          <PanelCard title="gRPC Unary" subtitle="HTTP/2 · Protobuf · one framed message" accent="border-emerald-500/40 shadow-[0_0_30px_rgba(0,200,150,0.08)]">
            <ProtocolBadgeRow labels={["HTTP/2", "Protobuf", "Unary RPC", "Multiplexed"]} highlight={1} />
            <NetworkFlow variant="unary" phase={phaseUnary === "idle" ? "idle" : phaseUnary} />
            <Http2FrameStrip active={frameStripOn || phaseUnary === "done"} chunkCount={stripCount} />
            <LifecycleBar
              states={["TCP+H2", "RPC call", "Serialize", "One message", "Idle"]}
              active={["idle", "request", "wait", "data", "done"].indexOf(phaseUnary)}
            />
            <LatencyBars lat={latUnary} />
            <div className="text-[10px] text-slate-500">Wire ~ {bytesUnary || "—"} B (incl. gRPC prefix in bridge metadata)</div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950"
              onClick={runUnary}
            >
              Run unary (HTTP JSON façade)
            </motion.button>
            <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950/80 p-2 text-[10px] text-slate-300">{logUnary || "…"}</pre>
          </PanelCard>

          <PanelCard title="gRPC streaming" subtitle="Server stream · SSE in the browser" accent="border-orange-500/40 shadow-[0_0_30px_rgba(255,140,66,0.1)]">
            <ProtocolBadgeRow labels={["HTTP/2", "Server stream", "SSE relay", "Flow control"]} highlight={2} />
            <NetworkFlow variant="stream" phase={phaseStream === "idle" ? "idle" : phaseStream} />
            <Http2FrameStrip active={phaseStream === "data" || phaseStream === "done"} chunkCount={Math.max(chunks, 4)} />
            <div className="text-[10px] text-orange-200/90">Queue depth (UI): {lab.queueDepth}</div>
            <LifecycleBar
              states={["TCP+H2", "RPC headers", "Chunking", "Receiving", "Closed"]}
              active={["idle", "request", "wait", "data", "done"].indexOf(phaseStream)}
            />
            <div className="text-[10px] text-slate-500">Chunks seen: {chunks}</div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-orange-400 px-3 py-2 text-xs font-semibold text-slate-950"
              onClick={runStream}
            >
              Open SSE + gRPC stream
            </motion.button>
            <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950/80 p-2 text-[10px] text-slate-300">{logStream || "…"}</pre>
          </PanelCard>

          <PanelCard title="WebSocket" subtitle="Duplex · persistent socket" accent="border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.08)]">
            <ProtocolBadgeRow labels={["WebSocket", "Full-duplex", "Frames", "Not gRPC"]} highlight={0} />
            <NetworkFlow variant="ws" phase={phaseWs === "idle" ? "idle" : phaseWs === "done" ? "done" : "data"} />
            <LifecycleBar
              states={["TCP", "Upgrade", "WS OPEN", "Bi-di", "Closed"]}
              active={phaseWs === "idle" ? 0 : phaseWs === "request" ? 1 : phaseWs === "data" ? 3 : 4}
            />
            <div className="text-[10px] text-slate-500">Frames handled: {wsChunks}</div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-fuchsia-400 px-3 py-2 text-xs font-semibold text-slate-950"
              onClick={runWs}
            >
              Open WebSocket stream
            </motion.button>
            <pre className="max-h-36 overflow-auto rounded-lg bg-slate-950/80 p-2 text-[10px] text-slate-300">{logWs || "…"}</pre>
            <p className="text-[9px] text-slate-500">
              Ping the socket from devtools: send <code className="text-slate-400">{"{\"cmd\":\"ping\"}"}</code> — server answers with{" "}
              <code className="text-slate-400">pong</code>.
            </p>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
