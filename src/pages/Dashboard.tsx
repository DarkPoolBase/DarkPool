import { useState, useMemo } from "react";
import { BarChart3, CheckCircle, Zap, TrendingUp, Calculator, ArrowUpDown } from "lucide-react";
import { useOrders, useOrderStats } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useMarketStats } from "@/hooks/useMarket";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlassCard } from "@/components/ui/glass-card";
import { SavingsCalculator } from "@/components/dashboard/SavingsCalculator";

const Dashboard = () => {
  const [tab, setTab] = useState<"overview" | "savings">("overview");
  const { isAuthenticated } = useAutoAuth();
  const { data: userOrders } = useOrders({ limit: 100 }, isAuthenticated);
  const { data: stats } = useOrderStats(isAuthenticated);
  const { data: marketStats } = useMarketStats();

  // Derive user-specific metrics from their orders
  const userEscrowBalance = useMemo(() => {
    if (!userOrders?.data?.length) return 0;
    return userOrders.data
      .filter((o: any) => o.status === 'ACTIVE' || o.status === 'PENDING')
      .reduce((sum: number, o: any) => sum + parseFloat(o.escrowAmount || '0'), 0);
  }, [userOrders]);

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
        </div>
      </div>

      {tab === "savings" ? (
        <SavingsCalculator />
      ) : (
        <>

      {/* Stats Row — 8pt gap */}
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

      {/* Portfolio Value */}
      <GlassCard delay={0.15} className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Portfolio Value</span>
            <AnimatedNumber value={userEscrowBalance} prefix="$" decimals={2} className="text-2xl md:text-3xl font-mono font-semibold tracking-tight text-white tabular-nums" />
          </div>
        </div>

        {userEscrowBalance === 0 && userTotalTraded === 0 ? (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] border border-primary/[0.1] flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary/40" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-white/30 mb-1">No activity yet</p>
              <p className="font-mono text-[11px] text-white/15">Place an order on the Marketplace to start building your portfolio</p>
            </div>
            <button
              onClick={() => window.location.href = '/marketplace'}
              className="font-mono text-[11px] text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded-lg px-4 py-2 hover:bg-primary/5"
            >
              Browse Marketplace →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Locked in Orders</p>
              <p className="font-mono text-lg font-semibold text-white tabular-nums mt-1">${userEscrowBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Total Traded</p>
              <p className="font-mono text-lg font-semibold text-white tabular-nums mt-1">${userTotalTraded.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Orders Placed</p>
              <p className="font-mono text-lg font-semibold text-white tabular-nums mt-1">{userOrders?.data?.length ?? 0}</p>
            </div>
          </div>
        )}
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


