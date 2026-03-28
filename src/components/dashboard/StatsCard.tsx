import { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  glow?: boolean;
  delay?: number;
}

export function StatsCard({ icon: Icon, label, value, change, changeType = "neutral", glow = false, delay = 0 }: StatsCardProps) {
  // Parse numeric value for animation
  const numericMatch = value.match(/[\d,.]+/);
  const numericValue = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, "")) : null;
  const prefix = value.substring(0, value.indexOf(numericMatch?.[0] || ""));
  const suffix = numericMatch ? value.substring(value.indexOf(numericMatch[0]) + numericMatch[0].length) : "";
  const hasDecimals = numericMatch?.[0].includes(".");
  const decimals = hasDecimals ? numericMatch![0].split(".")[1].length : 0;

  return (
    <GlassCard glow={glow} corners delay={delay} className="p-5 group hover:border-white/[0.12] transition-all duration-500">
      {/* Gradient accent line at top */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
        <div className="relative">
          <Icon className="h-4 w-4 text-white/30 group-hover:text-primary/60 transition-colors duration-300" />
          {glow && <div className="absolute inset-0 blur-md bg-primary/20 rounded-full" />}
        </div>
      </div>
      <div className="flex items-end gap-2">
        {numericValue !== null ? (
          <AnimatedNumber
            value={numericValue}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className="text-2xl font-semibold font-mono"
          />
        ) : (
          <span className="text-2xl font-semibold font-mono">{value}</span>
        )}
        {change && (
          <span
            className={`text-xs font-medium mb-0.5 ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                ? "text-destructive"
                : "text-white/40"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
