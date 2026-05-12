import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchSerialization } from "../lib/api";
import type { SerializationEdu } from "../types";
import { TermTip } from "./EduPrimitives";

/** Fetches real Jackson JSON bytes vs Java protobuf wire for the same logical field (`square`). */
export function SerializationWall({ square }: { square: number }) {
  const [data, setData] = useState<SerializationEdu | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSerialization(square)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setErr(e.message);
      });
    return () => {
      alive = false;
    };
  }, [square]);

  if (err) return <div className="text-rose-300 text-xs">{err}</div>;
  if (!data) return <div className="text-slate-500 text-xs">Loading serialization lab…</div>;

  const max = Math.max(data.jsonUtf8Bytes, data.protobufChunkBytes, 1);
  const jPct = (data.jsonUtf8Bytes / max) * 100;
  const pPct = (data.protobufChunkBytes / max) * 100;

  return (
    <div className="glass rounded-xl p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-200">
        JSON vs Protobuf (one tiny message)
        <TermTip
          label="Protobuf"
          brief="Field tags + length-delimited values; varints use variable width."
          detail="Compare with JSON’s repeated punctuation and UTF-8 field names — see protobuf encoding guides."
          accent="text-emerald-300"
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] text-slate-500">
            JSON UTF-8 · {data.jsonUtf8Bytes} B
          </div>
          <code className="block min-h-[2rem] rounded bg-slate-950/80 p-2 text-[10px] text-blue-200">{data.jsonSample}</code>
          <div className="mt-1 h-2 rounded bg-slate-800">
            <motion.div className="h-2 rounded bg-blue-500/70" initial={{ width: 0 }} animate={{ width: `${jPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] text-slate-500">
            Protobuf wire · {data.protobufChunkBytes} B
          </div>
          <code className="block min-h-[2rem] rounded bg-slate-950/80 p-2 text-[10px] text-emerald-200">{data.protobufChunkHex}</code>
          <div className="mt-1 h-2 rounded bg-slate-800">
            <motion.div className="h-2 rounded bg-emerald-500/70" initial={{ width: 0 }} animate={{ width: `${pPct}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">{data.note}</p>
    </div>
  );
}
