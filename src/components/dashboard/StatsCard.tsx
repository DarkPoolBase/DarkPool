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
      className={`glass-card group p-5 transition-all duration-500 hover:border-white/20 ${
        glow ? "shadow-[0_0_40px_rgba(139,92,246,0.12),0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.05),inset_0_0_18px_4px_rgba(255,255,255,0.03)]" : ""
      }`}
    >
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
