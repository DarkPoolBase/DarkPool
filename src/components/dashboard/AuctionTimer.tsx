import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { useWebSocket } from "@/hooks/useWebSocket";

export function AuctionTimer() {
  const [seconds, setSeconds] = useState(32);
  const [phase, setPhase] = useState<string>("collecting");
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsub = subscribe("batch:phase", (data: unknown) => {
      const event = data as { batchId: number; phase: string; endsAt: number };
      if (event.phase) setPhase(event.phase);
      if (event.endsAt && Number.isFinite(event.endsAt)) {
        const remaining = Math.max(0, Math.floor((event.endsAt - Date.now()) / 1000));
        setSeconds(remaining);
      }
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const isUrgent = safeSeconds <= 10 && safeSeconds > 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const progress = safeSeconds / 60;

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const phaseLabel =
    phase === "matching" ? "Matching orders" :
    phase === "settling" ? "Settling batch" :
    isUrgent ? "Closing soon" : "Accepting orders";

  return (
    <GlassCard
      delay={0.3}
      glow={isUrgent}
      className="p-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="56" height="56" className="-rotate-90">
            <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
            <motion.circle
              cx="28" cy="28" r={radius} fill="none"
              stroke={isUrgent ? "rgb(245,158,11)" : "rgb(139,92,246)"}
              strokeWidth="2" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          <Timer className={`absolute inset-0 m-auto h-4 w-4 ${isUrgent ? "text-amber-400 animate-pulse" : "text-violet-400/60"}`} />
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Next Batch</p>
          <p className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${isUrgent ? "text-amber-400" : "text-white"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          <p className="font-mono text-[9px] text-white/20 mt-1 uppercase tracking-wider">
            {phaseLabel}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
