/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { BarChart3, CheckCircle, Zap, TrendingUp, Calculator, ArrowUpDown, Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { useOrders, useOrderStats } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useMarketStats } from "@/hooks/useMarket";
import { useEscrowBalance, useUSDCBalance, useDepositUSDC, useWithdrawUSDC } from "@/hooks/useContracts";
import { useWallet } from "@/contexts/WalletContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GlassCard } from "@/components/ui/glass-card";
import { SavingsCalculator } from "@/components/dashboard/SavingsCalculator";
import { formatUSDC } from "@/lib/chain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const [tab, setTab] = useState<"overview" | "savings">("overview");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { isAuthenticated } = useAutoAuth();
  const { connected, fullWalletAddress } = useWallet();
  const { data: userOrders } = useOrders({ limit: 100 }, isAuthenticated);
  const { data: stats } = useOrderStats(isAuthenticated);
  const { data: marketStats } = useMarketStats();
  const { data: escrowBalance, refetch: refetchEscrow } = useEscrowBalance(fullWalletAddress ?? undefined);
  const { refetch: refetchUSDC, formatted: usdcFormatted } = useUSDCBalance(fullWalletAddress ?? undefined);
  const { deposit, isLoading: depositing } = useDepositUSDC();
  const { withdraw, isLoading: withdrawing } = useWithdrawUSDC();

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await deposit(amt);
      toast.success(`Deposited $${amt.toFixed(2)} USDC into escrow`);
      setDepositAmount("");
      refetchEscrow();
      refetchUSDC();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await withdraw(amt);
      toast.success(`Withdrew $${amt.toFixed(2)} USDC from escrow`);
      setWithdrawAmount("");
      refetchEscrow();
      refetchUSDC();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Withdrawal failed");
    }
  };

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

      {/* Escrow & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* On-chain Escrow Balance */}
        <GlassCard delay={0.15} glow className="p-4 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Escrow Balance</span>
            </div>

            {connected ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03]">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Available</p>
                    <p className="font-mono text-lg font-semibold text-emerald-400 tabular-nums mt-1">${formatUSDC(escrowBalance.available)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03]">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Locked</p>
                    <p className="font-mono text-lg font-semibold text-amber-400 tabular-nums mt-1">${formatUSDC(escrowBalance.locked)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Wallet USDC</p>
                  <p className="font-mono text-sm font-semibold text-white tabular-nums mt-1">${usdcFormatted}</p>
                </div>

                {/* Deposit */}
                <div className="flex gap-2">
                  <Input
                    type="number" step="0.01" min="0.01" placeholder="Amount"
                    value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                    className="font-mono text-xs h-9 border-white/[0.06] bg-white/[0.02]"
                  />
                  <Button onClick={handleDeposit} disabled={depositing} size="sm"
                    className="gap-1.5 h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 border-0 shrink-0">
                    {depositing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDownToLine className="h-3 w-3" />}
                    Deposit
                  </Button>
                </div>

                {/* Withdraw */}
                <div className="flex gap-2">
                  <Input
                    type="number" step="0.01" min="0.01" placeholder="Amount"
                    value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="font-mono text-xs h-9 border-white/[0.06] bg-white/[0.02]"
                  />
                  <Button onClick={handleWithdraw} disabled={withdrawing} size="sm"
                    className="gap-1.5 h-9 px-3 text-xs bg-white/[0.06] hover:bg-white/[0.1] border-0 shrink-0">
                    {withdrawing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpFromLine className="h-3 w-3" />}
                    Withdraw
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center gap-3">
                <Wallet className="h-8 w-8 text-white/10" />
                <p className="font-mono text-[11px] text-white/20 text-center">Connect wallet to view escrow balance</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Portfolio Value */}
        <GlassCard delay={0.2} className="p-4 md:p-6 lg:col-span-2">
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
      </div>

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


