import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
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

  // SVG progress ring
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <GlassCard
      delay={0.3}
      corners
      className={`p-5 transition-all duration-500 ${
        isUrgent ? "shadow-[0_0_30px_rgba(245,158,11,0.2)] border-warning/20" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <div className="relative shrink-0">
          <svg width="52" height="52" className="-rotate-90">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
            />
            <motion.circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              stroke={isUrgent ? "hsl(38,92%,50%)" : "hsl(258,78%,56%)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          <Timer className={`absolute inset-0 m-auto h-4 w-4 ${isUrgent ? "text-warning animate-pulse-glow" : "text-primary/60"}`} />
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Next batch in</p>
          <p className={`font-mono text-2xl font-semibold tracking-wider ${isUrgent ? "text-warning" : ""}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
