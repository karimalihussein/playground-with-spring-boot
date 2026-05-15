import { Link } from "react-router-dom";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { ProtocolTimeline } from "../components/network/ProtocolTimeline";
import { BrowserBridgeExplainer } from "../components/network/BrowserBridgeExplainer";
import { SerializationWall } from "../components/network/SerializationWall";
import { Http2FrameStrip } from "../components/network/Http2FrameStrip";
import { TcpHandshakeDemo } from "../components/network/TcpHandshakeVisual";
import { TermTip } from "../components/network/TermTip";

const STEPS = [
  { id: "dns", label: "Optional: DNS for authority", detail: "Resolver finds A/AAAA for the host (gRPC still uses HTTP/2 to that IP)." },
  { id: "tcp", label: "TCP connection", detail: "gRPC rides on a TCP connection to port 443 (or h2c in some labs)." },
  { id: "tls", label: "TLS + ALPN", detail: "ALPN negotiates h2 so the stack knows frames are HTTP/2, not HTTP/1.1." },
  { id: "h2", label: "HTTP/2 streams", detail: "Unary and streaming calls map to HEADERS + DATA (+ trailers) on a stream ID." },
  { id: "grpc", label: "gRPC semantics", detail: "Protobuf payloads, status in trailers — see core concepts." },
] as const;

/** Concept page — hands-on unary/stream panels live on Protocol lab. */
export function GrpcLabPage() {
  return (
    <div className="min-h-screen pb-16">
      <LabPageHeader
        title="gRPC lab"
        kicker="HTTP/2 · Protobuf"
        refs={[
          { label: "gRPC concepts (grpc.io)", href: "https://grpc.io/docs/what-is-grpc/core-concepts/" },
          { label: "HTTP/2 RFC 9113", href: "https://www.rfc-editor.org/rfc/rfc9113" },
        ]}
      >
        <p>
          gRPC is <strong>not</strong> a separate wire on the public internet — it is application RPC over{" "}
          <TermTip label="HTTP/2" brief="Frames, streams, multiplexing." detail="One connection carries many requests without head-of-line blocking at the connection level." accent="text-cyan-300" /> with
          length-prefixed Protobuf messages. This playground exposes JSON bridges from the browser; native gRPC-Web would look similar at the frame layer.
        </p>
      </LabPageHeader>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 lg:grid-cols-2">
        <ProtocolTimeline steps={[...STEPS]} activeIndex={4} />
        <div className="flex flex-col gap-4">
          <TcpHandshakeDemo />
          <Http2FrameStrip active chunkCount={6} />
        </div>
        <div className="lg:col-span-2">
          <BrowserBridgeExplainer />
        </div>
        <div className="lg:col-span-2">
          <SerializationWall square={768} />
        </div>
        <p className="lg:col-span-2 text-center text-xs text-slate-500">
          Run live unary and server-stream calls in{" "}
          <Link className="text-cyan-400 underline" to="/protocol-lab">
            Protocol lab
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
