import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlowBlob } from "@/components/ui/glow-blob";
import { motion } from "framer-motion";
import { useOrderMetrics, useSettlements } from "@/hooks/useOrders";
import { usePriceHistory, useMarketPrices } from "@/hooks/useMarket";

const intervalMap: Record<string, string> = {
  "1D": "1h",
  "1W": "4h",
  "1M": "1d",
  "ALL": "1w",
};

const gpuColors: Record<string, string> = {
  H100: "from-primary to-[hsl(258,78%,70%)]",
  A100: "from-blue-500 to-blue-400",
  L40S: "from-emerald-500 to-emerald-400",
  H200: "from-amber-500 to-amber-400",
  A10G: "from-rose-500 to-rose-400",
};

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("1W");
  const { data: metrics } = useOrderMetrics();
  const { data: settlements } = useSettlements(20);
  const { data: priceHistory } = usePriceHistory('H100', intervalMap[timeframe]);
  const { data: marketPrices } = useMarketPrices();

  // Transform API price history into chart data
  const chartData = useMemo(() => {
    if (!priceHistory?.length) return [];
    return priceHistory.map((p: any) => {
      const d = new Date(p.timestamp);
      let label: string;
      if (timeframe === '1D') label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      else if (timeframe === '1W') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      else if (timeframe === '1M') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      else label = d.toLocaleDateString('en-US', { month: 'short' });
      return { date: label, price: parseFloat(p.close) };
    });
  }, [priceHistory, timeframe]);

  // Build utilization data from market prices (volume-based)
  const utilizationData = useMemo(() => {
    if (!marketPrices?.length) return [];
    const maxVol = Math.max(...marketPrices.map((p: any) => parseFloat(p.volume24h) || 0), 1);
    return marketPrices.map((p: any) => ({
      name: p.gpuType,
      value: Math.round((parseFloat(p.volume24h) / maxVol) * 100),
      color: gpuColors[p.gpuType] || "from-gray-500 to-gray-400",
    }));
  }, [marketPrices]);

  const stats = metrics ? [
    { label: "24h Volume", value: `${metrics.totalVolume24h.toFixed(0)} GPU-hours ($${metrics.totalVolume24h.toFixed(2)})` },
    { label: "Active Orders", value: String(metrics.activeOrders) },
    { label: "Total Orders", value: String(metrics.totalOrders) },
    { label: "Avg Clearing Price", value: `$${metrics.avgClearingPrice.toFixed(2)}/GPU-hour` },
    { label: "Filled Today", value: String(metrics.filledOrders24h) },
    { label: "GPU Types Active", value: String(Object.keys(metrics.ordersByGpuType).length) },
  ] : [
    { label: "24h Volume", value: "—" },
    { label: "Active Orders", value: "—" },
    { label: "Total Orders", value: "—" },
    { label: "Avg Clearing Price", value: "—" },
    { label: "Filled Today", value: "—" },
    { label: "GPU Types Active", value: "—" },
  ];

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
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-[11px] text-white/20">Loading price data...</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
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
          )}
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
          <SectionLabel>GPU Volume by Type</SectionLabel>
          <div className="mt-4 space-y-6">
            {utilizationData.length === 0 ? (
              <p className="font-mono text-[11px] text-white/20 text-center py-8">Loading GPU data...</p>
            ) : utilizationData.map((gpu: any, i: number) => (
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


