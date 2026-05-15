import { Routes, Route } from "react-router-dom";
import { EduLayout } from "./layouts/EduLayout";
import { HomePage } from "./pages/HomePage";
import { ProtocolLabPage } from "./pages/ProtocolLabPage";
import { OsiJourneyPage } from "./pages/OsiJourneyPage";
import { GrpcLabPage } from "./pages/GrpcLabPage";
import { StreamingLabPage } from "./pages/StreamingLabPage";
import { WebsocketLabPage } from "./pages/WebsocketLabPage";
import { Http2LabPage } from "./pages/Http2LabPage";
import { DnsLabPage } from "./pages/DnsLabPage";
import { TlsLabPage } from "./pages/TlsLabPage";

export default function App() {
  return (
    <Routes>
      <Route element={<EduLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/protocol-lab" element={<ProtocolLabPage />} />
        <Route path="/osi-lab" element={<OsiJourneyPage variant="embedded" />} />
        <Route path="/grpc-lab" element={<GrpcLabPage />} />
        <Route path="/streaming-lab" element={<StreamingLabPage />} />
        <Route path="/websocket-lab" element={<WebsocketLabPage />} />
        <Route path="/http2-lab" element={<Http2LabPage />} />
        <Route path="/dns-lab" element={<DnsLabPage />} />
        <Route path="/tls-lab" element={<TlsLabPage />} />
      </Route>
    </Routes>
  );
}
