import { Link } from "react-router-dom";
import { LabPageHeader } from "../components/network/LabPageHeader";
import { ProtocolTimeline } from "../components/network/ProtocolTimeline";
import { ByteInspector } from "../components/network/ByteInspector";

const DNS_STEPS = [
  { id: "stub", label: "Stub resolver (OS/browser)", detail: "Your app asks the OS resolver for getaddrinfo-style answers." },
  { id: "recursive", label: "Recursive resolver (ISP/DoH)", detail: "If cache miss, resolver walks the tree (simplified)." },
  { id: "auth", label: "Authority / glue", detail: "NS + A/AAAA for nameservers; eventual A/AAAA RR for the service." },
  { id: "cached", label: "Cached answer", detail: "TTL governs how long the positive/negative answer can be reused." },
];

/** Static DNS syllabus — interactive story lives under OSI journey (“DNS” segment during simulation). */
export function DnsLabPage() {
  return (
    <div className="min-h-screen pb-16">
      <LabPageHeader
        title="DNS lab"
        kicker="Names → addresses"
        refs={[
          { label: "RFC 1035", href: "https://www.rfc-editor.org/rfc/rfc1035" },
          { label: "IANA DNS parameters", href: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml" },
        ]}
      >
        <p>DNS is the distributed database that turns hostnames into resource records. This page stays conceptual; the OSI journey animates a resolver path alongside TCP/TLS.</p>
      </LabPageHeader>
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 lg:grid-cols-2">
        <ProtocolTimeline steps={DNS_STEPS} activeIndex={3} />
        <ByteInspector label="Example A record payload (UTF-8 illustration only)" utf8Sample='{"name":"api.example","type":"A","ttl":42,"data":"203.0.113.10"}' />
        <p className="lg:col-span-2 text-center text-xs text-slate-500">
          Run the animated DNS segment inside{" "}
          <Link className="text-cyan-400 underline" to="/osi-lab">
            OSI journey
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
