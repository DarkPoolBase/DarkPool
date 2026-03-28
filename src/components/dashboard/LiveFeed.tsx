import { motion, AnimatePresence } from "framer-motion";

const feedItems = [
  { title: "Batch #4521 settled", detail: "340 GPU-hrs @ $0.21/hr — 23 orders matched", time: "Just now", highlight: false },
  { title: "Your order #4521 filled!", detail: "24 H100-hours @ $0.22/hr", time: "2 min ago", highlight: true },
  { title: "Batch #4520 settled", detail: "520 GPU-hrs @ $0.19/hr — 41 orders matched", time: "5 min ago", highlight: false },
  { title: "Batch #4519 settled", detail: "180 GPU-hrs @ $0.24/hr — 12 orders matched", time: "10 min ago", highlight: false },
  { title: "Your order #4517 filled!", detail: "168 A100-hours @ $0.16/hr", time: "32 min ago", highlight: true },
  { title: "Batch #4518 settled", detail: "290 GPU-hrs @ $0.20/hr — 18 orders matched", time: "45 min ago", highlight: false },
];

export function LiveFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card h-full"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 p-5 pb-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Live Batch Settlements</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[440px] overflow-y-auto">
          <AnimatePresence>
            {feedItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                className={`px-5 py-3.5 transition-all duration-300 ease-out hover:bg-white/[0.02] ${
                  item.highlight
                    ? "border-l-2 border-l-violet-500/60 bg-violet-500/[0.03]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium text-xs ${item.highlight ? "text-violet-400" : "text-white/60"}`}>
                    {item.title}
                  </span>
                  <span className="font-mono text-[10px] text-white/20 tabular-nums">{item.time}</span>
                </div>
                <p className="text-[11px] text-white/30 font-mono tabular-nums">{item.detail}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
