import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";

const feedItems = [
  {
    title: "Batch #4521 settled",
    detail: "340 GPU-hrs @ $0.21/hr — 23 orders matched",
    time: "Just now",
    highlight: false,
  },
  {
    title: "Your order #4521 filled!",
    detail: "24 H100-hours @ $0.22/hr",
    time: "2 min ago",
    highlight: true,
  },
  {
    title: "Batch #4520 settled",
    detail: "520 GPU-hrs @ $0.19/hr — 41 orders matched",
    time: "5 min ago",
    highlight: false,
  },
  {
    title: "Batch #4519 settled",
    detail: "180 GPU-hrs @ $0.24/hr — 12 orders matched",
    time: "10 min ago",
    highlight: false,
  },
  {
    title: "Your order #4517 filled!",
    detail: "168 A100-hours @ $0.16/hr",
    time: "32 min ago",
    highlight: true,
  },
];

export function LiveFeed() {
  return (
    <GlassCard delay={0.4} corners className="overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Live Batch Settlements</span>
      </div>
      <div className="divide-y divide-white/[0.04] max-h-[360px] overflow-y-auto">
        <AnimatePresence>
          {feedItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`px-5 py-3 text-sm transition-colors duration-300 hover:bg-white/[0.02] ${
                item.highlight
                  ? "border-l-2 border-l-primary bg-primary/[0.03] shadow-[inset_0_0_20px_rgba(108,60,233,0.05)]"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium text-xs ${item.highlight ? "text-primary" : "text-white/70"}`}>
                  {item.title}
                </span>
                <span className="font-mono text-[10px] text-white/30">{item.time}</span>
              </div>
              <p className="text-[11px] text-white/40 font-mono">{item.detail}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
