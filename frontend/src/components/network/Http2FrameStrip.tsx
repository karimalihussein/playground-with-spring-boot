import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Simplified HTTP/2 frame strip: gRPC maps messages to HEADERS + DATA (+ optional trailers). */
export function Http2FrameStrip({ active, chunkCount }: { active: boolean; chunkCount: number }) {
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    if (!active) {
      setFrames([]);
      return;
    }
    const f = ["HEADERS (grpc path)"];
    const n = Math.min(Math.max(chunkCount, 4), 24);
    for (let i = 0; i < n; i++) f.push(`DATA · chunk ${i + 1}`);
    f.push("TRAILERS (status)");
    setFrames(f);
  }, [active, chunkCount]);

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-2 font-mono text-[9px]">
      <div className="mb-1 text-slate-500">HTTP/2 frames (teaching sequence)</div>
      <div className="flex max-h-24 flex-col gap-1 overflow-auto">
        <AnimatePresence>
          {frames.map((fr, i) => (
            <motion.div
              key={`${fr}-${i}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded border border-cyan-900/40 bg-cyan-950/30 px-2 py-1 text-cyan-100"
            >
              [{fr}]
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
