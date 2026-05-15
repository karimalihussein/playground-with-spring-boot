import { Link } from "react-router-dom";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { ProtocolTimeline } from "../components/network/ProtocolTimeline";
import { TcpHandshakeDemo } from "../components/network/TcpHandshakeVisual";
import { ByteInspector } from "../components/network/ByteInspector";
import { TermTip } from "../components/network/TermTip";

const TLS_STEPS = [
  { id: "tcp", label: "TCP established", detail: "TLS sits on top of the reliable byte stream (or datagram QUIC in other stacks)." },
  { id: "ch", label: "ClientHello", detail: "Cipher suites, key shares, SNI — server hints which certificate to pick." },
  { id: "sh", label: "ServerHello + encrypted extensions", detail: "TLS 1.3 short handshake — fewer RTTs vs older versions." },
  { id: "fin", label: "Finished + application data", detail: "HTTP/2 SETTINGS + streams begin once keys are derived." },
];

export function TlsLabPage() {
  return (
    <div className="min-h-screen pb-16">
      <LabPageHeader
        title="TLS lab"
        kicker="Records · handshakes · trust"
        refs={[{ label: "RFC 8446 (TLS 1.3)", href: "https://www.rfc-editor.org/rfc/rfc8446" }]}
      >
        <p>
          TLS provides confidentiality and integrity for anything above it — including HTTP/2 and gRPC.{" "}
          <TermTip label="ALPN" brief="Application-Layer Protocol Negotiation." detail="Lets the server choose h2 vs http/1.1 during the handshake." accent="text-emerald-300" /> is why your browser and server agree on HTTP/2 before sending
          application requests.
        </p>
      </LabPageHeader>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 lg:grid-cols-2">
        <TcpHandshakeDemo />
        <ProtocolTimeline steps={TLS_STEPS} activeIndex={3} />
        <ByteInspector label="Fake certificate subject (UTF-8 teaching snippet)" utf8Sample="CN=api.example.invalid,O=Playground Lab,L=Internet" />
        <p className="lg:col-span-2 text-center text-xs text-slate-500">
          TLS animation with HTTP toggles lives in{" "}
          <Link className="text-cyan-400 underline" to="/osi-lab">
            OSI journey
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
