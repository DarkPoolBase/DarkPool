import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparklineChart } from "./SparklineChart";
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  sparkData?: number[];
  sparkColor?: string;
  glow?: boolean;
  delay?: number;
}

export function StatsCard({ icon: Icon, label, value, change, changeType = "neutral", sparkData, sparkColor, glow = false, delay = 0 }: StatsCardProps) {
  const numericMatch = value.match(/[\d,.]+/);
  const numericValue = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, "")) : null;
  const prefix = value.substring(0, value.indexOf(numericMatch?.[0] || ""));
  const suffix = numericMatch ? value.substring(value.indexOf(numericMatch[0]) + numericMatch[0].length) : "";
  const hasDecimals = numericMatch?.[0].includes(".");
  const decimals = hasDecimals ? numericMatch![0].split(".")[1].length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-5 transition-all duration-500 hover:border-white/10 hover:bg-white/[0.05] ${
        glow ? "shadow-[0_0_40px_rgba(139,92,246,0.12)]" : ""
      }`}
    >
      {/* Directional lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
          <div className="relative">
            <Icon className="h-4 w-4 text-white/20 group-hover:text-violet-400/60 transition-colors duration-500" />
            {glow && <div className="absolute inset-0 blur-lg bg-violet-500/20 rounded-full" />}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-end gap-2.5">
            {numericValue !== null ? (
              <AnimatedNumber
                value={numericValue}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                className="text-3xl font-semibold font-mono tracking-tight text-white tabular-nums"
              />
            ) : (
              <span className="text-3xl font-semibold font-mono tracking-tight text-white tabular-nums">{value}</span>
            )}
            {change && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border mb-1 ${
                changeType === "positive"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : changeType === "negative"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-white/5 text-white/40 border-white/10"
              }`}>
                {change}
              </span>
            )}
          </div>
          {sparkData && (
            <div className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
              <SparklineChart data={sparkData} color={sparkColor || "rgb(139, 92, 246)"} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
