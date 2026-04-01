import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlowBlob } from "@/components/ui/glow-blob";
import { motion } from "framer-motion";
import { useOrderMetrics, useSettlements } from "@/hooks/useOrders";

const priceDataByTimeframe: Record<string, { date: string; price: number }[]> = {
  "1D": [
    { date: "00:00", price: 0.21 }, { date: "03:00", price: 0.20 },
    { date: "06:00", price: 0.19 }, { date: "09:00", price: 0.20 },
    { date: "12:00", price: 0.22 }, { date: "15:00", price: 0.23 },
    { date: "18:00", price: 0.22 }, { date: "21:00", price: 0.21 },
    { date: "Now", price: 0.21 },
  ],
  "1W": [
    { date: "Mar 25", price: 0.20 }, { date: "Mar 26", price: 0.21 },
    { date: "Mar 27", price: 0.24 }, { date: "Mar 28", price: 0.22 },
    { date: "Mar 29", price: 0.19 }, { date: "Mar 30", price: 0.20 },
    { date: "Mar 31", price: 0.21 },
  ],
  "1M": [
    { date: "Mar 1", price: 0.18 }, { date: "Mar 5", price: 0.16 },
    { date: "Mar 9", price: 0.17 }, { date: "Mar 13", price: 0.19 },
    { date: "Mar 17", price: 0.22 }, { date: "Mar 21", price: 0.25 },
    { date: "Mar 25", price: 0.23 }, { date: "Mar 28", price: 0.20 },
    { date: "Mar 31", price: 0.21 },
  ],
  "ALL": [
    { date: "Oct", price: 0.32 }, { date: "Nov", price: 0.28 },
    { date: "Dec", price: 0.25 }, { date: "Jan", price: 0.22 },
    { date: "Feb", price: 0.19 }, { date: "Mar", price: 0.21 },
  ],
};

const utilizationData = [
  { name: "H100", value: 78, color: "from-primary to-[hsl(258,78%,70%)]" },
  { name: "A100", value: 52, color: "from-blue-500 to-blue-400" },
  { name: "RTX 4090", value: 41, color: "from-emerald-500 to-emerald-400" },
  { name: "RTX 3090", value: 33, color: "from-amber-500 to-amber-400" },
];

const mockStats = [
  { label: "24h Volume", value: "12,450 GPU-hours ($2,487.50)" },
  { label: "Active Providers", value: "387" },
  { label: "Total GPUs Available", value: "1,240" },
  { label: "Avg Clearing Price", value: "$0.19/GPU-hour" },
  { label: "Price Range (24h)", value: "$0.15 - $0.28" },
  { label: "Orders Matched", value: "892" },
];

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("1W");
  const { data: metrics } = useOrderMetrics();
  const { data: settlements } = useSettlements(20);

  const stats = metrics ? [
    { label: "24h Volume", value: `${metrics.totalVolume24h.toFixed(0)} GPU-hours ($${metrics.totalVolume24h.toFixed(2)})` },
    { label: "Active Orders", value: String(metrics.activeOrders) },
    { label: "Total Orders", value: String(metrics.totalOrders) },
    { label: "Avg Clearing Price", value: `$${metrics.avgClearingPrice.toFixed(2)}/GPU-hour` },
    { label: "Filled Today", value: String(metrics.filledOrders24h) },
    { label: "GPU Types Active", value: String(Object.keys(metrics.ordersByGpuType).length) },
  ] : mockStats;

  return (
    <div className="space-y-6 max-w-7xl relative">
      <GlowBlob className="-top-20 right-0 opacity-30" color="purple" size="lg" />

      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Market intelligence and price trends</p>
      </div>

      {/* Price Chart */}
      <GlassCard delay={0.1} gradient className="p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionLabel>H100 Price History</SectionLabel>
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            {["1D", "1W", "1M", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`relative px-4 py-2 text-[10px] font-mono tracking-wider rounded-md transition-all duration-300 ${
                  timeframe === tf ? "text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {timeframe === tf && (
                  <motion.div
                    layoutId="timeframe"
                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tf}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-[296px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceDataByTimeframe[timeframe]}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={[0.1, 0.3]} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "rgba(11,12,14,0.95)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 20px rgba(108,60,233,0.15)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.4)" }}
                formatter={(value: number) => [`$${value}/hr`, "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke="hsl(258, 78%, 56%)" strokeWidth={2} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Stats */}
        <GlassCard delay={0.2} className="p-6">
          <SectionLabel pulse>Market Statistics</SectionLabel>
          <div className="mt-4 space-y-0">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex justify-between py-4 border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.01] -mx-2 px-2 rounded-lg transition-colors">
                <span className="text-xs text-white/40">{label}</span>
                <span className="font-mono text-xs text-white/70">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Utilization */}
        <GlassCard delay={0.3} className="p-6">
          <SectionLabel>GPU Utilization by Type</SectionLabel>
          <div className="mt-4 space-y-6">
            {utilizationData.map((gpu, i) => (
              <div key={gpu.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">{gpu.name}</span>
                  <AnimatedNumber value={gpu.value} suffix="%" className="font-mono text-xs text-white/40" />
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gpu.value}%` }}
                    transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${gpu.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Analytics;
