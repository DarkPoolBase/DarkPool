import { useState } from "react";
import { DollarSign, BarChart3, CheckCircle, Zap, TrendingUp, Calculator } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlassCard } from "@/components/ui/glass-card";
import { SavingsCalculator } from "@/components/dashboard/SavingsCalculator";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const portfolioData = [
  { date: "Mar 20", value: 1800 },
  { date: "Mar 21", value: 2100 },
  { date: "Mar 22", value: 1950 },
  { date: "Mar 23", value: 2300 },
  { date: "Mar 24", value: 2150 },
  { date: "Mar 25", value: 2400 },
  { date: "Mar 26", value: 2250 },
  { date: "Mar 27", value: 2650 },
  { date: "Mar 28", value: 2450 },
];

const Dashboard = () => {
  const [tab, setTab] = useState<"overview" | "savings">("overview");

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1440px] relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-white/30 mt-2 font-mono text-[11px]">Portfolio overview · Market activity · GPU compute</p>
        </div>
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
          <button
            onClick={() => setTab("overview")}
            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 ${
              tab === "overview"
                ? "text-white bg-white/[0.06] border border-white/10"
                : "text-white/30 border border-transparent hover:text-white/60"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("savings")}
            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 flex items-center gap-1.5 ${
              tab === "savings"
                ? "text-white bg-white/[0.06] border border-white/10"
                : "text-white/30 border border-transparent hover:text-white/60"
            }`}
          >
            <Calculator className="w-3 h-3" />
            Savings Calculator
          </button>
        </div>
      </div>

      {tab === "savings" ? (
        <SavingsCalculator />
      ) : (
        <>

      {/* Stats Row — 8pt gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign} label="Escrow Balance" value="$2,450.00"
          change="+12.5%" changeType="positive"
          sparkData={[1800, 2100, 1950, 2300, 2150, 2400, 2450]}
          sparkColor="rgb(52, 211, 153)" glow delay={0}
        />
        <StatsCard
          icon={BarChart3} label="Active Orders" value="3"
          sparkData={[1, 3, 2, 4, 3, 2, 3]}
          sparkColor="rgb(139, 92, 246)" delay={0.08}
        />
        <StatsCard
          icon={CheckCircle} label="Filled Today" value="156 GPU-hrs"
          change="+24%" changeType="positive"
          sparkData={[80, 110, 95, 130, 140, 150, 156]}
          sparkColor="rgb(52, 211, 153)" delay={0.16}
        />
        <AuctionTimer />
      </div>

      {/* Portfolio Chart — 24px padding */}
      <GlassCard delay={0.15} className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Portfolio Value</span>
            <div className="flex items-end gap-3">
              <AnimatedNumber value={2450} prefix="$" decimals={2} className="text-2xl md:text-3xl font-mono font-semibold tracking-tight text-white tabular-nums" />
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-mono font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-0.5">
                +8.2% (7d)
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {["1D", "1W", "1M", "ALL"].map((tf, i) => (
              <button
                key={tf}
                className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] font-mono tracking-wider rounded-full border transition-all duration-300 ${
                  i === 1
                    ? "text-white bg-white/[0.06] border-white/10"
                    : "text-white/30 border-transparent hover:text-white/60 hover:bg-white/[0.03]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[180px] md:h-[224px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(5,5,8,0.95)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 0 30px rgba(139,92,246,0.15)",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.3)" }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="rgb(139,92,246)" strokeWidth={2} fill="url(#portfolioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Main Content — 8pt-aligned gap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <OrderTable />
          <QuickActions />
        </div>
        <div>
          <LiveFeed />
        </div>
      </div>

      {/* Bottom Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "24h Volume", value: "12,450 GPU-hrs", icon: TrendingUp },
          { label: "Active Providers", value: "387", icon: Zap },
          { label: "Avg Clearing Price", value: "$0.19/GPU-hour", icon: BarChart3 },
          { label: "Orders Matched", value: "892", icon: CheckCircle },
        ].map((stat, i) => (
          <GlassCard key={stat.label} delay={0.5 + i * 0.05} className="p-4">
            <div className="flex items-center gap-4">
              <stat.icon className="h-4 w-4 text-white/15 shrink-0" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">{stat.label}</p>
                <p className="font-mono text-sm text-white/70 tabular-nums tracking-tight mt-1">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;
