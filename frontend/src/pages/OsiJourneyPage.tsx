/**
 * OSI / TCP-IP educational journey — visual simulation only (not wire-accurate).
 * Teaching references: ITU-T X.200 (OSI), TCP (RFC 9293), TLS 1.3 (RFC 8446), DNS (RFC 1035).
 */
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const OSI_LAYERS = [
  {
    n: 7,
    name: "Application",
    brief: "HTTP, gRPC, DNS, WebSocket handshakes — what users call “the API”.",
    deep: "Browser or app builds requests; no guarantee this maps 1:1 to “the OSI application layer” in real stacks (mostly conceptual).",
    tcpIp: "App data toward sockets / TLS / HTTP.",
  },
  {
    n: 6,
    name: "Presentation",
    brief: "Encoding: JSON UTF-8, Protobuf, compression (gzip), TLS record framing.",
    deep: "Modern stacks fold this into libraries; TLS encrypts at record layer while still carrying HTTP inside.",
    tcpIp: "Handled in libraries + TLS; not a separate kernel layer on most hosts.",
  },
  {
    n: 5,
    name: "Session",
    brief: "Session state: TCP connection reuse, HTTP cookies, gRPC channel, WS persistent dialog.",
    deep: "TCP’s “connection” is transport; HTTP keep-alive and TLS tickets feel like session semantics.",
    tcpIp: "TCP socket + TLS session tickets + app cookies.",
  },
  {
    n: 4,
    name: "Transport",
    brief: "TCP segments: ports, handshake, reliability, flow control; UDP datagrams for contrast.",
    deep: "RFC 9293 — SYN/SYN-ACK/ACK, sequence numbers, congestion control (simplified in UI).",
    tcpIp: "TCP or UDP headers + payload.",
  },
  {
    n: 3,
    name: "Network",
    brief: "IP packets: source/dest addresses, routing, TTL, NAT on edge.",
    deep: "“Across the internet” really means hop-by-hop forwarding decisions at L3.",
    tcpIp: "IPv4/IPv6 packet.",
  },
  {
    n: 2,
    name: "Data Link",
    brief: "Ethernet frames, MAC addresses, switches; ARP resolves next hop.",
    deep: "One hop at a time; Wi-Fi has its own L2 nuances.",
    tcpIp: "Frame on a single link segment.",
  },
  {
    n: 1,
    name: "Physical",
    brief: "Electrical/optical/radio symbols on the medium — bits physically leave the NIC.",
    deep: "Encoding (PAM4 on fiber, OFDM on Wi-Fi) is invisible to apps but real on the wire.",
    tcpIp: "Symbols on copper / fiber / air.",
  },
] as const;

export type AppProtocol = "rest" | "grpc-unary" | "grpc-stream" | "websocket" | "sse";

export type InspectorState = {
  pdu: string;
  proto: string;
  src: string;
  dest: string;
  sport: string;
  dport: string;
  payload: string;
  extra: string;
};

const PROTO_PRESETS: Record<
  AppProtocol,
  { label: string; appLine: string; sessionNote: string; dport: string; streamId?: string }
> = {
  rest: {
    label: "REST / HTTP/1.1",
    appLine: "GET /api/users HTTP/1.1\\nHost: example.com\\nAccept: application/json",
    sessionNote: "One request/response per logical document (classic fetch).",
    dport: "443",
  },
  "grpc-unary": {
    label: "gRPC Unary",
    appLine: 'POST /package.Service/Method (HTTP/2) + protobuf body + grpc-timeout',
    sessionNote: "One RPC, one HTTP/2 stream carrying request + response.",
    dport: "443",
    streamId: "5",
  },
  "grpc-stream": {
    label: "gRPC server stream",
    appLine: "Length-prefixed protobuf chunks on one HTTP/2 stream until half-close.",
    sessionNote: "Many DATA frames, flow-controlled — backpressure is real.",
    dport: "443",
    streamId: "9",
  },
  websocket: {
    label: "WebSocket",
    appLine: "HTTP Upgrade: websocket → framing (masked client → server)",
    sessionNote: "Full-duplex over one long-lived TCP/TLS connection.",
    dport: "443 (wss)",
    streamId: "—",
  },
  sse: {
    label: "SSE (browser view)",
    appLine: "GET … Accept: text/event-stream (one HTTP response, many data: lines)",
    sessionNote: "Server→client push over HTTP; gRPC-stream often relayed this way to browsers.",
    dport: "443",
  },
};

function initialInsp(p: AppProtocol): InspectorState {
  const pr = PROTO_PRESETS[p];
  return {
    pdu: "—",
    proto: pr.label,
    src: "10.0.0.12",
    dest: "—",
    sport: "52431",
    dport: pr.dport,
    payload: pr.appLine.slice(0, 80) + "…",
    extra: "Select “Send HTTP Request” to begin the journey.",
  };
}

export function OsiJourneyPage({ variant = "embedded" }: { variant?: "embedded" | "standalone" }) {
  const [protocol, setProtocol] = useState<AppProtocol>("rest");
  const [https, setHttps] = useState(true);
  const [udpCompare, setUdpCompare] = useState(false);
  const [speed, setSpeed] = useState(1);
  /* Advanced knobs — scale delays; packet loss toggles a retransmit narrative */
  const [packetLoss, setPacketLoss] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const [congestion, setCongestion] = useState(false);
  const [http2Mode, setHttp2Mode] = useState(false);

  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  const [clientLayer, setClientLayer] = useState<number | null>(null);
  const [serverLayer, setServerLayer] = useState<number | null>(null);
  const [encapPhase, setEncapPhase] = useState<"idle" | "down" | "up" | "return-down" | "return-up">("idle");

  const [dnsStep, setDnsStep] = useState(0);
  const [tcpStep, setTcpStep] = useState(0);
  const [tlsStep, setTlsStep] = useState(0);
  const [wireProgress, setWireProgress] = useState(0);
  const [hopIndex, setHopIndex] = useState(0);
  const [ttl, setTtl] = useState(64);
  const [insp, setInsp] = useState<InspectorState>(() => initialInsp("rest"));

  const [timeline, setTimeline] = useState<{ ms: number; tag: string; text: string }[]>([]);
  const [logs, setLogs] = useState("");

  const t0 = useRef(0);
  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (abortRef.current) reject(new Error("abort"));
          else resolve();
        }, ms / speed);
      }),
    [speed],
  );

  const log = useCallback((line: string) => {
    setLogs((l) => l + `\n${new Date().toISOString().slice(11, 23)}  ${line}`);
  }, []);

  const pushTimeline = useCallback((tag: string, text: string) => {
    const ms = Math.round(performance.now() - t0.current);
    setTimeline((x) => [...x, { ms, tag, text }].slice(-40));
  }, []);

  const resetVisuals = useCallback(() => {
    setClientLayer(null);
    setServerLayer(null);
    setEncapPhase("idle");
    setDnsStep(0);
    setTcpStep(0);
    setTlsStep(0);
    setWireProgress(0);
    setHopIndex(0);
    setTtl(64);
    setTimeline([]);
    setInsp(initialInsp(protocol));
  }, [protocol]);

  const runJourney = async () => {
    abortRef.current = false;
    setRunning(true);
    resetVisuals();
    t0.current = performance.now();
    log("=== New simulated journey (educational, not a packet capture) ===");
    pushTimeline("start", `${PROTO_PRESETS[protocol].label} · ${https ? "HTTPS" : "HTTP"} · ${udpCompare ? "UDP story" : "TCP"}`);

    const pr = PROTO_PRESETS[protocol];

    try {
      /* -------- DNS -------- */
      for (let i = 1; i <= 5; i++) {
        setDnsStep(i);
        const labels = ["Stub resolver", "Recursive resolver", "Root hint", "TLD (.com)", "Authoritative → A/AAAA"];
        log(`DNS → ${labels[i - 1]}`);
        setInsp((s) => ({
          ...s,
          pdu: "DNS QUERY",
          proto: "UDP/TCP 53 (diagram uses UDP first)",
          dest: "9.9.9.9",
          dport: "53",
          payload: "QNAME api.example.com",
          extra: labels[i - 1],
        }));
        await wait(380);
      }
      setInsp((s) => ({ ...s, pdu: "DNS RESPONSE", payload: "A 203.0.113.50", extra: "Browser cache may skip some hops on repeat visits." }));
      log("DNS cached answer: 203.0.113.50");
      pushTimeline("dns", "Resolved A record");
      await wait(400);

      /* -------- Client encapsulation 7→1 -------- */
      setEncapPhase("down");
      for (let L = 0; L < 7; L++) {
        setClientLayer(L);
        const layer = OSI_LAYERS[L];
        log(`Client stack · encapsulate · L${7 - L} ${layer.name}`);
        setInsp((s) => ({
          ...s,
          pdu: `PDU @ ${layer.name}`,
          proto: pr.label,
          payload:
            L === 0
              ? pr.appLine.slice(0, 90)
              : L === 1
                ? https
                  ? "TLS plaintext records ready (compression optional, mostly off for HTTPS)"
                  : "UTF-8 / JSON bytes as prepared by library"
                : L === 2
                  ? pr.sessionNote
                  : L === 3
                    ? udpCompare
                      ? "UDP header: sport/dport/length — no handshake in this story"
                      : `TCP: ports · seq/ack · flags — handshake next`
                    : L === 4
                      ? `IPv4 · src 10.0.0.12 → dst 203.0.113.50 · TTL=${ttl}`
                      : L === 5
                        ? "Ethernet · dst MAC = default gateway · EtherType 0x0800"
                        : "Physical: symbols on the medium (Wi-Fi / fiber / copper)",
          extra: layer.brief,
        }));
        await wait(420);
      }
      pushTimeline("encap", "Full frame on the wire (L2+L3+L4+payload)");

      /* -------- TCP handshake -------- */
      if (!udpCompare) {
        setClientLayer(3);
        setTcpStep(1);
        log("TCP · SYN (client → server via path)");
        setInsp((s) => ({ ...s, pdu: "TCP SYN", extra: "seq=x, SYN=1" }));
        await wait(500);
        setTcpStep(2);
        log("TCP · SYN-ACK");
        setInsp((s) => ({ ...s, pdu: "TCP SYN-ACK", extra: "seq=y, ack=x+1" }));
        await wait(packetLoss ? 900 : 500);
        if (packetLoss) {
          log("Simulated loss → retransmit SYN-ACK (educational)");
          pushTimeline("retry", "Retransmission");
        }
        setTcpStep(3);
        log("TCP · ACK — connection ESTABLISHED");
        setInsp((s) => ({ ...s, pdu: "TCP ACK", extra: "Reliable bidirectional byte stream ready." }));
        await wait(450);
      } else {
        log("UDP mode: no handshake — datagrams may reorder or drop; app must cope.");
        pushTimeline("udp", "Connectionless transport");
      }

      /* -------- TLS -------- */
      if (https) {
        for (let k = 1; k <= 4; k++) {
          setTlsStep(k);
          const tlsMsgs = ["ClientHello (ciphers, SNI)", "ServerHello + cert chain", "Key share → shared secret", "Encrypted Finished + HTTP inside"];
          log(`TLS 1.3 · ${tlsMsgs[k - 1]}`);
          setInsp((s) => ({
            ...s,
            pdu: "TLS record",
            proto: "TLS 1.3",
            payload: tlsMsgs[k - 1],
            extra: "Symmetric keys protect app bytes on the wire.",
          }));
          await wait(520);
        }
        pushTimeline("tls", "Handshake complete — HTTP sits inside TLS");
      }

      /* -------- Across internet -------- */
      setClientLayer(null);
      setEncapPhase("idle");
      for (let h = 1; h <= 4; h++) {
        setHopIndex(h);
        setTtl((t) => Math.max(1, t - 3));
        log(`Router hop ${h} · forwarding decision · TTL now ~${ttl - h * 3}`);
        setWireProgress((h / 4) * 100);
        setInsp((s) => ({
          ...s,
          pdu: "IPv4 forwarded",
          dest: "203.0.113.50",
          extra: `Hop ${h} · NAT may rewrite src at edge · congestion ${congestion ? "high (UI flag)" : "normal"}`,
        }));
        await wait(congestion ? 700 : 450);
      }
      if (congestion) log("Congestion window shrinks (simplified) — fewer segments in flight.");
      pushTimeline("inet", "Arrived at server edge");

      /* -------- Server stack up 1→7 -------- */
      setEncapPhase("up");
      for (let L = 6; L >= 0; L--) {
        setServerLayer(L);
        const layer = OSI_LAYERS[L];
        log(`Server · decapsulate · L${7 - L} ${layer.name}`);
        setInsp((s) => ({
          ...s,
          pdu: `Stripping ${layer.name}`,
          src: "203.0.113.50",
          dest: "10.0.0.12 (original client, via reverse path)",
          extra: layer.deep.slice(0, 120),
        }));
        await wait(380);
      }

      /* -------- “Processing” -------- */
      setServerLayer(0);
      log("Reverse proxy / TLS terminator (if any) → application server");
      if (slowServer) await wait(1200);
      else await wait(600);
      setInsp((s) => ({
        ...s,
        pdu: "Application",
        payload:
          protocol === "grpc-stream" || protocol === "sse"
            ? "Handler opens long response / stream iterator"
            : "Handler builds response body",
        extra: "May touch DB — omitted in wire story.",
      }));
      log("Business logic + serialization (JSON / protobuf / WS frames)");
      pushTimeline("server", "Response crafted");

      /* -------- Response path -------- */
      setEncapPhase("return-down");
      for (let L = 0; L < 7; L++) {
        setServerLayer(L);
        const layer = OSI_LAYERS[L];
        log(`Server · encapsulate response · ${layer.name}`);
        await wait(320);
      }
      setServerLayer(null);
      setWireProgress(50);
      await wait(400);
      setWireProgress(100);
      pushTimeline("return", "Response crosses network to client");

      setEncapPhase("return-up");
      for (let L = 6; L >= 0; L--) {
        setClientLayer(L);
        log(`Client · decapsulate response · ${OSI_LAYERS[L].name}`);
        await wait(300);
      }
      log("Browser parses TLS → HTTP → renders (or feeds stream callbacks)");
      pushTimeline("done", "First byte / full body (depends on protocol)");
      setInsp((s) => ({
        ...s,
        pdu: protocol.includes("stream") || protocol === "sse" ? "Chunked / streamed PDUs" : "HTTP response",
        payload: "200 OK + body…",
        extra: http2Mode ? "HTTP/2: many streams multiplexed on one TCP (compare to parallel TCP in HTTP/1.1 demos)." : "",
      }));
    } catch {
      log("Journey aborted.");
    } finally {
      setRunning(false);
      setClientLayer(null);
      setServerLayer(null);
      setEncapPhase("idle");
      setTcpStep(0);
      setTlsStep(0);
      setDnsStep(0);
    }
  };

  const stop = () => {
    abortRef.current = true;
    setRunning(false);
  };

  const topPad = variant === "embedded" ? "pt-2" : "pt-6";

  return (
    <div className={`min-h-screen bg-[radial-gradient(ellipse_at_top,_#152238,_#0a0d12)] pb-24 ${topPad} text-slate-100`}>
      <header className="border-b border-cyan-950/50 bg-slate-950/50 px-4 py-6 backdrop-blur">
        {variant === "standalone" && (
          <p className="mb-2 inline-block rounded-lg bg-cyan-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-500/30">
            Full-page OSI lab · bookmark: <code className="text-cyan-100">/osi-lab</code>
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          OSI journey · live packet storyboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          A <strong>visual syllabus</strong>: watch a synthetic request move down the client stack, across simplified routers, up the server
          stack, then return. This is pedagogy — real laptops collapse layers; use Wireshark/tcpdump for ground truth. OSI reference: ITU-T
          X.200; TCP:{" "}
          <a className="text-cyan-400 underline" href="https://www.rfc-editor.org/rfc/rfc9293">
            RFC 9293
          </a>
          ; TLS:{" "}
          <a className="text-cyan-400 underline" href="https://www.rfc-editor.org/rfc/rfc8446">
            RFC 8446
          </a>
          .
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            This page:{" "}
            <a className="text-cyan-400 underline" href="/osi-lab">
              /osi-lab
            </a>
          </span>
          <span>
            Protocol hands-on:{" "}
            <a className="text-cyan-400 underline" href="/protocol-lab">
              /protocol-lab
            </a>
          </span>
        </p>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-4 px-3 py-4 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="flex flex-col gap-4">
          <section className="glass rounded-2xl border border-slate-700/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-400">
                Application
                <select
                  value={protocol}
                  onChange={(e) => {
                    const p = e.target.value as AppProtocol;
                    setProtocol(p);
                    setInsp(initialInsp(p));
                  }}
                  className="ml-2 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
                >
                  <option value="rest">REST / HTTP/1.1</option>
                  <option value="grpc-unary">gRPC unary</option>
                  <option value="grpc-stream">gRPC streaming</option>
                  <option value="websocket">WebSocket</option>
                  <option value="sse">SSE</option>
                </select>
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={https} onChange={(e) => setHttps(e.target.checked)} />
                HTTPS (TLS)
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={udpCompare} onChange={(e) => setUdpCompare(e.target.checked)} />
                UDP narrative (skip TCP handshake)
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={http2Mode} onChange={(e) => setHttp2Mode(e.target.checked)} />
                Show HTTP/2 multiplex note
              </label>
              <label className="text-xs text-slate-400">
                Speed
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="ml-2 w-24 align-middle"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={packetLoss} onChange={(e) => setPacketLoss(e.target.checked)} />
                Packet loss story
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={slowServer} onChange={(e) => setSlowServer(e.target.checked)} />
                Slow server
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={congestion} onChange={(e) => setCongestion(e.target.checked)} />
                Congestion (longer hops)
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                type="button"
                disabled={running}
                whileTap={{ scale: 0.97 }}
                onClick={() => void runJourney()}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
              >
                Send HTTP request (simulate full journey)
              </motion.button>
              <button type="button" onClick={stop} className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-300">
                Stop
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogs("");
                  resetVisuals();
                }}
                className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-300"
              >
                Clear
              </button>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <OsiStackColumn title="Client" side="client" activeIndex={clientLayer} encap={encapPhase} />
            <InternetColumn
              dnsStep={dnsStep}
              tcpStep={tcpStep}
              tlsStep={tlsStep}
              https={https}
              udp={udpCompare}
              wireProgress={wireProgress}
              hopIndex={hopIndex}
              ttl={ttl}
              http2Note={http2Mode}
            />
            <OsiStackColumn title="Server" side="server" activeIndex={serverLayer} encap={encapPhase} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TimelinePanel items={timeline} />
            <LogPanel text={logs} />
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <InspectorPanel insp={insp} protocol={protocol} />
          <HttpCompareCard />
          <StreamingCompareCard protocol={protocol} />
        </aside>
      </div>
    </div>
  );
}

function OsiStackColumn({
  title,
  side,
  activeIndex,
  encap,
}: {
  title: string;
  side: "client" | "server";
  activeIndex: number | null;
  encap: "idle" | "down" | "up" | "return-down" | "return-up";
}) {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cyan-200">{title}</h3>
        <span className="text-[10px] uppercase text-slate-500">{encap}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {OSI_LAYERS.map((layer, idx) => {
          const isActive = activeIndex === idx;
          return (
            <motion.div
              key={layer.n}
              layout
              className={`relative rounded-lg border px-2 py-2 text-[11px] transition-shadow ${
                isActive
                  ? "border-cyan-400/70 bg-cyan-950/40 shadow-[0_0_18px_rgba(34,211,238,0.2)]"
                  : "border-slate-700/60 bg-slate-900/40 text-slate-500"
              }`}
            >
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-slate-400">
                  L{7 - idx} · {layer.name}
                </span>
                {isActive && (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-cyan-300">
                    {side === "client" && encap === "down"
                      ? "encapsulate ▼"
                      : encap === "up" || encap === "return-up"
                        ? "decapsulate ▲"
                        : encap === "return-down"
                          ? "encapsulate ▼"
                          : "active"}
                  </motion.span>
                )}
              </div>
              <p className="mt-0.5 leading-snug text-slate-400">{layer.brief}</p>
              <details className="mt-1 text-[10px] text-slate-500">
                <summary className="cursor-pointer text-slate-400">Advanced</summary>
                {layer.deep}
              </details>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function InternetColumn({
  dnsStep,
  tcpStep,
  tlsStep,
  https,
  udp,
  wireProgress,
  hopIndex,
  ttl,
  http2Note,
}: {
  dnsStep: number;
  tcpStep: number;
  tlsStep: number;
  https: boolean;
  udp: boolean;
  wireProgress: number;
  hopIndex: number;
  ttl: number;
  http2Note: boolean;
}) {
  const dnsLabels = ["Browser", "Stub", "Recursive", "Root", "TLD", "Auth → IP"];
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-amber-200">Internet & hops</h3>
      <div className="mb-3">
        <div className="text-[10px] uppercase text-slate-500">DNS chain (simplified)</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {dnsLabels.map((l, i) => (
            <span
              key={l}
              className={`rounded px-1.5 py-0.5 text-[9px] ${i === dnsStep ? "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40" : "bg-slate-800 text-slate-500"}`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
      {!udp && (
        <div className="mb-3">
          <div className="text-[10px] uppercase text-slate-500">TCP handshake</div>
          <div className="mt-1 flex justify-between gap-1 font-mono text-[9px]">
            {["SYN", "SYN-ACK", "ACK"].map((p, i) => (
              <motion.div
                key={p}
                animate={{ scale: tcpStep > i ? 1.05 : 1, opacity: tcpStep > i ? 1 : 0.35 }}
                className={`flex-1 rounded border px-1 py-2 text-center ${tcpStep > i ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200" : "border-slate-700"}`}
              >
                {p}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {https && (
        <div className="mb-3">
          <div className="text-[10px] uppercase text-slate-500">TLS 1.3 (iconic)</div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div className="h-full bg-violet-500/80" animate={{ width: `${(tlsStep / 4) * 100}%` }} transition={{ duration: 0.35 }} />
          </div>
          <div className="mt-1 text-[9px] text-slate-500">🔒 App data encrypted after handshake.</div>
        </div>
      )}
      <div className="mb-2 text-[10px] text-slate-500">
        Routing · TTL ≈ {ttl} · hop {hopIndex}/4
      </div>
      <div className="relative h-10 rounded-lg bg-slate-900/80">
        <motion.div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
          style={{ left: `${wireProgress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[9px] text-slate-600">
          <span>NIC</span>
          <span>☁︎</span>
          <span>DC edge</span>
        </div>
      </div>
      {http2Note && (
        <p className="mt-2 text-[10px] text-slate-400">
          HTTP/2: one TCP connection carries many streams (IDs). Compare to several parallel TCP connections in some HTTP/1.1 workloads — see{" "}
          <a className="text-cyan-400 underline" href="https://www.rfc-editor.org/rfc/rfc9113">
            RFC 9113
          </a>
          .
        </p>
      )}
    </div>
  );
}

function InspectorPanel({ insp, protocol }: { insp: InspectorState; protocol: AppProtocol }) {
  const pr = PROTO_PRESETS[protocol];
  return (
    <div className="glass sticky top-16 rounded-2xl border border-slate-600/50 p-4 font-mono text-[11px]">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">Live PDU inspector (toy)</h3>
      <dl className="space-y-1.5 text-slate-300">
        <Row k="PDU" v={insp.pdu} />
        <Row k="Proto" v={insp.proto} />
        <Row k="Src" v={insp.src} />
        <Row k="Dst" v={insp.dest} />
        <Row k="Ports" v={`${insp.sport} → ${insp.dport}`} />
        {pr.streamId && <Row k="H2 stream" v={pr.streamId} />}
        <dt className="text-slate-500">Payload / notes</dt>
        <dd className="whitespace-pre-wrap break-all rounded bg-slate-950/80 p-2 text-[10px] text-cyan-100/90">{insp.payload}</dd>
        <dd className="text-[10px] text-slate-500">{insp.extra}</dd>
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-cyan-100/90">{v}</dd>
    </>
  );
}

function TimelinePanel({ items }: { items: { ms: number; tag: string; text: string }[] }) {
  return (
    <div className="glass max-h-64 overflow-auto rounded-2xl border border-slate-700/50 p-3">
      <h3 className="mb-2 text-sm font-semibold">Protocol timeline</h3>
      <ul className="space-y-2 text-[11px]">
        <AnimatePresence>
          {items.map((it) => (
            <motion.li
              key={`${it.ms}-${it.tag}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 border-l-2 border-cyan-500/40 pl-2"
            >
              <span className="shrink-0 tabular-nums text-slate-500">+{it.ms}ms</span>
              <span className="shrink-0 rounded bg-slate-800 px-1 text-[9px] uppercase text-amber-200">{it.tag}</span>
              <span className="text-slate-400">{it.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function LogPanel({ text }: { text: string }) {
  return (
    <div className="glass max-h-64 overflow-auto rounded-2xl border border-slate-700/50 p-3">
      <h3 className="mb-2 text-sm font-semibold">Logs</h3>
      <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-400">{text || "…"}</pre>
    </div>
  );
}

function HttpCompareCard() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-3 text-[11px] text-slate-400">
      <h4 className="font-semibold text-slate-200">HTTP/1.1 vs HTTP/2 (teaching)</h4>
      <p className="mt-1">
        <strong className="text-amber-200/90">HTTP/1.1</strong> often used parallel TCP connections or pipelining (limited) — head-of-line at the
        connection level.
      </p>
      <p className="mt-1">
        <strong className="text-emerald-200/90">HTTP/2</strong> multiplexes streams on <em>one</em> TCP connection with per-stream flow control —{" "}
        <a className="text-cyan-400 underline" href="https://www.rfc-editor.org/rfc/rfc9113">
          RFC 9113
        </a>
        .
      </p>
    </div>
  );
}

function StreamingCompareCard({ protocol }: { protocol: AppProtocol }) {
  const txt =
    protocol === "rest"
      ? "Unary request/response: one HTTP exchange delivers the full document (classic)."
      : protocol === "grpc-unary"
        ? "gRPC unary: still one logical response, but binary framing on HTTP/2."
        : protocol === "grpc-stream" || protocol === "sse"
          ? "Streaming: many PDUs over time — you can process incrementally; backpressure matters."
          : "WebSocket: upgrade from HTTP, then symmetric framed messages on the same socket.";
  return (
    <div className="rounded-2xl border border-fuchsia-900/40 bg-fuchsia-950/20 p-3 text-[11px] text-fuchsia-100/80">
      <h4 className="font-semibold text-fuchsia-200">Streaming vs unary</h4>
      <p className="mt-1">{txt}</p>
    </div>
  );
}
