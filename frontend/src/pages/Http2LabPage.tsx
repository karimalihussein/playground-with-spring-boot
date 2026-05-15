import { Link } from "react-router-dom";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { MultiplexSection } from "../components/network/MultiplexSection";
import { HolBlockingDemo } from "../components/network/HolBlockingDemo";
import { Http2FrameStrip } from "../components/network/Http2FrameStrip";

export function Http2LabPage() {
  return (
    <div className="bg-grid min-h-screen pb-16">
      <LabPageHeader
        title="HTTP/2 lab"
        kicker="Streams · multiplexing · flow control"
        refs={[{ label: "RFC 9113", href: "https://www.rfc-editor.org/rfc/rfc9113" }]}
      >
        <p>
          HTTP/2 collapses many logical transactions onto <strong>one TLS connection</strong> using frames and stream IDs. That unlocks multiplexing — but misbehaving streams can still cause <em>head-of-line blocking</em> at
          different layers (HTTP/3 / QUIC addresses some of this with UDP datagrams).
        </p>
      </LabPageHeader>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <MultiplexSection />
          <HolBlockingDemo />
        </div>
        <Http2FrameStrip active chunkCount={10} />
        <p className="text-center text-xs text-slate-500">
          Multiplexed panels also appear on{" "}
          <Link className="text-cyan-400 underline" to="/protocol-lab">
            Protocol lab
          </Link>{" "}
          and inform <Link className="text-cyan-400 underline" to="/grpc-lab">gRPC lab</Link>.
        </p>
      </div>
    </div>
  );
}
