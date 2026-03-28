import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

export function AuctionTimer() {
  const [seconds, setSeconds] = useState(32);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isUrgent = seconds <= 10;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = seconds / 60;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-5 transition-all duration-500 ${
        isUrgent ? "shadow-[0_0_40px_rgba(245,158,11,0.15)] border-amber-500/20" : ""
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="56" height="56" className="-rotate-90">
            <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
            <motion.circle
              cx="28" cy="28" r={radius} fill="none"
              stroke={isUrgent ? "rgb(245,158,11)" : "rgb(139,92,246)"}
              strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          <Timer className={`absolute inset-0 m-auto h-4 w-4 ${isUrgent ? "text-amber-400 animate-pulse" : "text-violet-400/60"}`} />
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Next batch in</p>
          <p className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${isUrgent ? "text-amber-400" : "text-white"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
