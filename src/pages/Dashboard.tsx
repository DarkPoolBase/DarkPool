import { DollarSign, BarChart3, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ease, pageHeader } from "@/lib/animations";

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
  return (
    <div className="space-y-6 max-w-[1440px] relative">
      {/* Header */}
      <motion.div {...pageHeader}>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-white/30 mt-1 font-mono text-[11px]">Portfolio overview · Market activity · GPU compute</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign} label="Escrow Balance" value="$2,450.00"
          change="+12.5%" changeType="positive"
          sparkData={[1800, 2100, 1950, 2300, 2150, 2400, 2450]}
          sparkColor="rgb(52, 211, 153)" glow delay={0.08}
        />
        <StatsCard
          icon={BarChart3} label="Active Orders" value="3"
          sparkData={[1, 3, 2, 4, 3, 2, 3]}
          sparkColor="rgb(139, 92, 246)" delay={0.16}
        />
        <StatsCard
          icon={CheckCircle} label="Filled Today" value="156 GPU-hrs"
          change="+24%" changeType="positive"
          sparkData={[80, 110, 95, 130, 140, 150, 156]}
          sparkColor="rgb(52, 211, 153)" delay={0.24}
        />
        <AuctionTimer />
      </div>

      {/* Portfolio Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease }}
        className="glass-card p-6"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-1">Portfolio Value</span>
              <div className="flex items-end gap-3">
                <AnimatedNumber value={2450} prefix="$" decimals={2} className="text-3xl font-mono font-semibold tracking-tight text-white tabular-nums" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-1">
                  +8.2% (7d)
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {["1D", "1W", "1M", "ALL"].map((tf, i) => (
                <button
                  key={tf}
                  className={`px-3 py-1.5 text-[10px] font-mono tracking-wider rounded-full border transition-all duration-300 ${
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

          <div className="h-[220px]">
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
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <OrderTable />
          <QuickActions />
        </div>
        <div>
          <LiveFeed />
        </div>
      </div>

      {/* Bottom Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "24h Volume", value: "12,450 GPU-hrs", icon: TrendingUp },
          { label: "Active Providers", value: "387", icon: Zap },
          { label: "Avg Clearing Price", value: "$0.19/hr", icon: BarChart3 },
          { label: "Orders Matched", value: "892", icon: CheckCircle },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-4 flex items-center gap-3 hover:border-white/20 transition-all duration-300"
          >
            <div className="relative z-10 flex items-center gap-3">
              <stat.icon className="h-4 w-4 text-white/15 shrink-0" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">{stat.label}</p>
                <p className="font-mono text-sm text-white/70 tabular-nums tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Dashboard;
