import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PanelCard({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass flex flex-col gap-2 rounded-2xl border p-4 ${accent}`}
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
      {children}
    </motion.article>
  );
}
