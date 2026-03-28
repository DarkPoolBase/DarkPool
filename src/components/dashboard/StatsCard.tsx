import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparklineChart } from "./SparklineChart";
import { GlassCard } from "@/components/ui/glass-card";

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
    <GlassCard glow={glow} delay={delay} className="p-0">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Icon className={`h-3.5 w-3.5 ${glow ? "text-violet-400" : "text-white/30"}`} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
          </div>
          {change && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
              changeType === "positive"
                ? "bg-emerald-500/10 text-emerald-400"
                : changeType === "negative"
                ? "bg-rose-500/10 text-rose-400"
                : "bg-white/5 text-white/40"
            }`}>
              {change}
            </span>
          )}
        </div>

        {numericValue !== null ? (
          <AnimatedNumber
            value={numericValue}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums"
          />
        ) : (
          <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">{value}</span>
        )}
      </div>

      {/* Sparkline fills the bottom of the card */}
      {sparkData && (
        <div className="mt-3 px-1 -mb-px">
          <SparklineChart data={sparkData} color={sparkColor || "rgb(139, 92, 246)"} width={280} height={48} />
        </div>
      )}
    </GlassCard>
  );
}
