import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const priceData = [
  { date: "Mar 20", price: 0.22 },
  { date: "Mar 21", price: 0.25 },
  { date: "Mar 22", price: 0.23 },
  { date: "Mar 23", price: 0.19 },
  { date: "Mar 24", price: 0.18 },
  { date: "Mar 25", price: 0.20 },
  { date: "Mar 26", price: 0.21 },
  { date: "Mar 27", price: 0.24 },
  { date: "Mar 28", price: 0.22 },
];

const utilizationData = [
  { name: "H100", value: 78 },
  { name: "A100", value: 52 },
  { name: "RTX 4090", value: 41 },
  { name: "RTX 3090", value: 33 },
];

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("1W");

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Market intelligence and price trends</p>
      </div>

      {/* Price Chart */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">H100 Price History</h3>
          <div className="flex gap-1">
            {["1D", "1W", "1M", "ALL"].map((tf) => (
              <Button key={tf} variant={timeframe === tf ? "default" : "ghost"} size="sm" className="text-xs h-7 px-2.5" onClick={() => setTimeframe(tf)}>
                {tf}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(258, 78%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(240, 4%, 66%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(240, 4%, 66%)" }} axisLine={false} tickLine={false} domain={[0.1, 0.3]} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(231, 29%, 12%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(240, 4%, 66%)" }}
                formatter={(value: number) => [`$${value}/hr`, "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke="hsl(258, 78%, 56%)" strokeWidth={2} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Stats */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium">Market Statistics</h3>
          <div className="space-y-2 text-sm">
            {[
              ["24h Volume", "12,450 GPU-hours ($2,487.50)"],
              ["Active Providers", "387"],
              ["Total GPUs Available", "1,240"],
              ["Avg Clearing Price", "$0.19/GPU-hr"],
              ["Price Range (24h)", "$0.15 - $0.28"],
              ["Orders Matched", "892"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Utilization */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium">GPU Utilization by Type</h3>
          {utilizationData.map((gpu) => (
            <div key={gpu.name} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{gpu.name}</span>
                <span className="font-mono text-muted-foreground">{gpu.value}%</span>
              </div>
              <Progress value={gpu.value} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
