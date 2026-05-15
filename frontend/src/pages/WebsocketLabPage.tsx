import { Link } from "react-router-dom";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { NetworkFlow } from "../components/network/NetworkFlow";
import { LifecycleBar } from "../components/network/LifecycleBar";
import { ProtocolTimeline } from "../components/network/ProtocolTimeline";
import { LogsViewer } from "../components/network/LogsViewer";

const STEPS = [
  { id: "tcp", label: "TCP connect", detail: "Reliable byte pipe; WebSocket starts life as HTTP." },
  { id: "upgrade", label: "HTTP Upgrade: websocket", detail: "101 Switching Protocols — key hashing per RFC 6455." },
  { id: "frames", label: "Bi-directional frames", detail: "Text/binary/control frames multiplexed on the socket." },
  { id: "app", label: "Application messages", detail: "Your JSON or binary payloads ride inside WS frames." },
];

export function WebsocketLabPage() {
  return (
    <div className="min-h-screen pb-16">
      <LabPageHeader
        title="WebSocket lab"
        kicker="Duplex · framed messages"
        refs={[
          { label: "RFC 6455", href: "https://www.rfc-editor.org/rfc/rfc6455" },
          { label: "MDN WebSocket API", href: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket" },
        ]}
      >
        <p>
          WebSockets give you a <strong>full-duplex</strong> channel after an HTTP-friendly handshake — unlike unary HTTP/1.1 or even many gRPC calls from the browser (which use fetch/stream abstractions or gRPC-Web).
        </p>
      </LabPageHeader>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 lg:grid-cols-2">
        <ProtocolTimeline steps={STEPS} activeIndex={3} />
        <div className="glass flex flex-col gap-3 rounded-2xl border border-slate-800/80 p-4">
          <h3 className="text-xs font-semibold text-slate-200">Lifecycle (simplified)</h3>
          <NetworkFlow variant="ws" phase="data" />
          <LifecycleBar states={["TCP", "Upgrade", "WS OPEN", "Bi-di", "Closed"]} active={3} />
        </div>
        <LogsViewer
          className="lg:col-span-2"
          title="Example client log"
          text={`${new Date().toISOString().slice(11, 23)}  connecting ws://host/demo/ws/numbers\n${new Date().toISOString().slice(11, 23)}  → {"cmd":"stream","count":32}\n${new Date().toISOString().slice(11, 23)}  ← chunk {"type":"chunk","n":1} ...`}
        />
        <p className="lg:col-span-2 text-center text-xs text-slate-500">
          Live socket demo:{" "}
          <Link className="text-cyan-400 underline" to="/protocol-lab">
            Protocol lab → WebSocket panel
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
