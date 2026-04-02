/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { BarChart3, CheckCircle, Zap, TrendingUp, Calculator, ArrowUpDown, PieChart } from "lucide-react";
import { useOrders, useOrderStats } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useMarketStats, usePriceHistory } from "@/hooks/useMarket";
import { useEscrowBalance } from "@/hooks/useContracts";
import { useWallet } from "@/contexts/WalletContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlassCard } from "@/components/ui/glass-card";
import { SavingsCalculator } from "@/components/dashboard/SavingsCalculator";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const portfolioIntervalMap: Record<string, string> = {
  "1D": "1h", "1W": "4h", "1M": "1d", "ALL": "1w",
};

const Dashboard = () => {
  const [tab, setTab] = useState<"overview" | "savings" | "portfolio">("overview");
  const [portfolioTimeframe, setPortfolioTimeframe] = useState("1W");
  const { isAuthenticated } = useAutoAuth();
  const { data: userOrders } = useOrders({ limit: 100 }, isAuthenticated);
  const { data: stats } = useOrderStats(isAuthenticated);
  const { data: marketStats } = useMarketStats();
  const { data: priceHistory } = usePriceHistory('H100', portfolioIntervalMap[portfolioTimeframe]);
  const { fullWalletAddress } = useWallet();
  const { data: escrowBalance } = useEscrowBalance(fullWalletAddress ?? undefined);

  // Portfolio value = on-chain escrow total (available + locked)
  const portfolioValue = useMemo(() => {
    const available = Number(escrowBalance?.available ?? BigInt(0));
    const locked = Number(escrowBalance?.locked ?? BigInt(0));
    return (available + locked) / 1e6;
  }, [escrowBalance]);

  const userTotalTraded = useMemo(() => {
    if (!userOrders?.data?.length) return 0;
    return userOrders.data
      .filter((o: any) => o.status === 'FILLED')
      .reduce((sum: number, o: any) => sum + parseFloat(o.escrowAmount || '0'), 0);
  }, [userOrders]);

  const userFilledToday = useMemo(() => {
    if (!userOrders?.data?.length) return 0;
    const today = new Date().toDateString();
    return userOrders.data.filter(
      (o: any) => o.status === 'FILLED' && new Date(o.updatedAt).toDateString() === today
    ).length;
  }, [userOrders]);

  // P&L computed from filled orders
  const pnlData = useMemo(() => {
    const filled = (userOrders?.data || []).filter((o: any) => o.status === 'FILLED');
    const totalSpent = filled.reduce((sum: number, o: any) => sum + parseFloat(o.escrowAmount || '0'), 0);
    const totalGpuHours = filled.reduce((sum: number, o: any) => sum + (o.quantity || 1) * (o.duration || 0), 0);
    const avgCostPerHour = totalGpuHours > 0 ? totalSpent / totalGpuHours : 0;
    const marketAvg = parseFloat(marketStats?.avgClearingPrice || '0');
    const savingsVsMarket = marketAvg > 0 && avgCostPerHour > 0
      ? ((marketAvg - avgCostPerHour) / marketAvg * 100)
      : 0;

    // GPU type breakdown
    const gpuBreakdown: Record<string, { spent: number; hours: number; count: number }> = {};
    for (const o of filled) {
      const gpu = (o as any).gpuType || 'Unknown';
      if (!gpuBreakdown[gpu]) gpuBreakdown[gpu] = { spent: 0, hours: 0, count: 0 };
      gpuBreakdown[gpu].spent += parseFloat((o as any).escrowAmount || '0');
      gpuBreakdown[gpu].hours += ((o as any).quantity || 1) * ((o as any).duration || 0);
      gpuBreakdown[gpu].count += 1;
    }

    // Daily spend for chart (last 30 days)
    const dailySpend: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailySpend[d.toISOString().slice(0, 10)] = 0;
    }
    for (const o of filled) {
      const day = new Date((o as any).updatedAt || (o as any).createdAt).toISOString().slice(0, 10);
      if (dailySpend[day] !== undefined) {
        dailySpend[day] += parseFloat((o as any).escrowAmount || '0');
      }
    }
    const spendChart = Object.entries(dailySpend).map(([date, spent]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spent,
    }));

    return { totalSpent, totalGpuHours, avgCostPerHour, savingsVsMarket, gpuBreakdown, spendChart, orderCount: filled.length };
  }, [userOrders, marketStats]);

  // Build portfolio chart from H100 market price history
  const chartData = useMemo(() => {
    if (!priceHistory?.length) return [];
    return priceHistory.map((p: any) => {
      const d = new Date(p.timestamp);
      let label: string;
      if (portfolioTimeframe === '1D') label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      else if (portfolioTimeframe === 'ALL') label = d.toLocaleDateString('en-US', { month: 'short' });
      else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { date: label, value: parseFloat(p.close ?? p.avgPrice ?? '0') };
    });
  }, [priceHistory, portfolioTimeframe]);

  return (
    <div className="space-y-6 max-w-7xl relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-white/30 mt-2 font-mono text-[11px]">Portfolio overview · Market activity · GPU compute</p>
        </div>
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setTab("overview")}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 ${
              tab === "overview"
                ? "text-white bg-white/[0.06] border border-white/10"
                : "text-white/30 border border-transparent hover:text-white/60"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("savings")}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 flex items-center justify-center gap-1.5 ${
              tab === "savings"
                ? "text-white bg-white/[0.06] border border-white/10"
                : "text-white/30 border border-transparent hover:text-white/60"
            }`}
          >
            <Calculator className="w-3 h-3" />
            Savings
          </button>
          <button
            onClick={() => setTab("portfolio")}
            className={`flex-1 sm:flex-initial px-3 md:px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 flex items-center justify-center gap-1.5 ${
              tab === "portfolio"
                ? "text-white bg-white/[0.06] border border-white/10"
                : "text-white/30 border border-transparent hover:text-white/60"
            }`}
          >
            <PieChart className="w-3 h-3" />
            Portfolio
          </button>
        </div>
      </div>

      {tab === "portfolio" ? (
        <div className="space-y-4">
          {/* P&L Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard delay={0} className="p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Total Spent</p>
              <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-1">${pnlData.totalSpent.toFixed(2)}</p>
              <p className="font-mono text-[10px] text-white/20 mt-1">{pnlData.orderCount} filled orders</p>
            </GlassCard>
            <GlassCard delay={0.05} className="p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">GPU-Hours Purchased</p>
              <p className="font-mono text-2xl font-semibold text-violet-400 tabular-nums mt-1">{pnlData.totalGpuHours.toLocaleString()}</p>
              <p className="font-mono text-[10px] text-white/20 mt-1">across all GPU types</p>
            </GlassCard>
            <GlassCard delay={0.1} className="p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Avg Cost / Hour</p>
              <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-1">${pnlData.avgCostPerHour.toFixed(2)}</p>
              <p className="font-mono text-[10px] text-white/20 mt-1">vs market ${marketStats?.avgClearingPrice || '—'}/hr</p>
            </GlassCard>
            <GlassCard delay={0.15} className="p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Savings vs Market</p>
              <p className={`font-mono text-2xl font-semibold tabular-nums mt-1 ${pnlData.savingsVsMarket >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnlData.savingsVsMarket >= 0 ? '+' : ''}{pnlData.savingsVsMarket.toFixed(1)}%
              </p>
              <p className="font-mono text-[10px] text-white/20 mt-1">{pnlData.savingsVsMarket >= 0 ? 'below' : 'above'} avg clearing price</p>
            </GlassCard>
          </div>

          {/* Spend Over Time Chart */}
          <GlassCard delay={0.2} className="p-4 md:p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">USDC Spend — Last 30 Days</span>
            <div className="h-[200px] md:h-[240px]">
              {pnlData.spendChart.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="font-mono text-[11px] text-white/20">No filled orders yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlData.spendChart}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5,5,8,0.95)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        fontSize: 11,
                        fontFamily: "JetBrains Mono",
                        backdropFilter: "blur(16px)",
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.3)" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]}
                    />
                    <Area type="monotone" dataKey="spent" stroke="rgb(52,211,153)" strokeWidth={2} fill="url(#spendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          {/* GPU Type Breakdown */}
          <GlassCard delay={0.25} className="p-4 md:p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">Spend by GPU Type</span>
            {Object.keys(pnlData.gpuBreakdown).length === 0 ? (
              <p className="font-mono text-[11px] text-white/20 py-4">No filled orders yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(pnlData.gpuBreakdown)
                  .sort(([, a], [, b]) => b.spent - a.spent)
                  .map(([gpu, data]) => {
                    const pct = pnlData.totalSpent > 0 ? (data.spent / pnlData.totalSpent * 100) : 0;
                    return (
                      <div key={gpu}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-white/70">{gpu}</span>
                          <span className="text-xs font-mono text-white/40">${data.spent.toFixed(2)} · {data.hours} hrs · {data.count} orders</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </GlassCard>
        </div>
      ) : tab === "savings" ? (
        <SavingsCalculator />
      ) : (
        <>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={ArrowUpDown} label="Total Traded" value={`$${userTotalTraded.toFixed(2)}`}
          sparkData={[0, 0, 0, 0, 0, 0, userTotalTraded]}
          sparkColor="rgb(52, 211, 153)" glow delay={0}
        />
        <StatsCard
          icon={BarChart3} label="Active Orders" value={String(stats?.ACTIVE ?? 0)}
          sparkData={[0, 0, 0, 0, 0, 0, stats?.ACTIVE ?? 0]}
          sparkColor="rgb(139, 92, 246)" delay={0.08}
        />
        <StatsCard
          icon={CheckCircle} label="Filled Today" value={`${userFilledToday} orders`}
          change={userFilledToday > 0 ? `+${userFilledToday}` : undefined} changeType="positive"
          sparkData={[0, 0, 0, 0, 0, 0, userFilledToday]}
          sparkColor="rgb(52, 211, 153)" delay={0.16}
        />
        <AuctionTimer />
      </div>

      {/* Portfolio Value with Chart */}
      <GlassCard delay={0.15} className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Portfolio Value</span>
            <AnimatedNumber value={portfolioValue} prefix="$" decimals={2} className="text-2xl md:text-3xl font-mono font-semibold tracking-tight text-white tabular-nums" />
          </div>
          <div className="flex gap-1">
            {["1D", "1W", "1M", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => setPortfolioTimeframe(tf)}
                className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] font-mono tracking-wider rounded-full border transition-all duration-300 ${
                  portfolioTimeframe === tf
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
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-[11px] text-white/20">Loading market data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Market Price"]}
                />
                <Area type="monotone" dataKey="value" stroke="rgb(139,92,246)" strokeWidth={2} fill="url(#portfolioGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Main Content */}
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
          { label: "24h Volume", value: marketStats ? `${Number(marketStats.totalVolume24h).toLocaleString()} GPU-hrs` : '—', icon: TrendingUp },
          { label: "Active Providers", value: marketStats ? String(marketStats.totalProviders) : '—', icon: Zap },
          { label: "Avg Clearing Price", value: marketStats ? `$${marketStats.avgClearingPrice}/GPU-hour` : '—', icon: BarChart3 },
          { label: "Orders Matched", value: marketStats ? String(marketStats.totalTrades) : '—', icon: CheckCircle },
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
