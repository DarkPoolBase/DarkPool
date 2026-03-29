import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Server, Zap, Timer, BarChart3, Activity, Shield, ArrowRight, TrendingUp, Clock, Users, Layers, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const computeProducts = [
  {
    id: "h100",
    name: "NVIDIA H100",
    label: "Private Compute",
    price: "$0.21/hr",
    providers: 47,
    vram: "80GB HBM3",
    workloads: "Training · Inference",
    availability: 92,
    badge: "Most Liquid",
    volume24h: "1,240 GPU-hrs",
    icon: Cpu,
  },
  {
    id: "a100",
    name: "NVIDIA A100",
    label: "Private Compute",
    price: "$0.15/hr",
    providers: 89,
    vram: "80GB HBM2e",
    workloads: "Training · Fine-tuning",
    availability: 78,
    badge: "Active Market",
    volume24h: "2,870 GPU-hrs",
    icon: Server,
  },
  {
    id: "rtx4090",
    name: "RTX 4090",
    label: "Private Compute",
    price: "$0.08/hr",
    providers: 234,
    vram: "24GB GDDR6X",
    workloads: "Inference · Batch Jobs",
    availability: 65,
    badge: null,
    volume24h: "4,120 GPU-hrs",
    icon: Zap,
  },
  {
    id: "multi-gpu",
    name: "Multi-GPU Cluster",
    label: "Training Cluster",
    price: "$1.40/hr",
    providers: 12,
    vram: "8×H100 (640GB)",
    workloads: "Distributed Training",
    availability: 34,
    badge: "Fast Fill",
    volume24h: "96 GPU-hrs",
    icon: Layers,
  },
  {
    id: "compute-credits",
    name: "Compute Credits",
    label: "Prepaid Compute",
    price: "$0.18/unit",
    providers: 387,
    vram: "Flexible",
    workloads: "Any Workload",
    availability: 100,
    badge: null,
    volume24h: "8,450 units",
    icon: Activity,
  },
  {
    id: "h100-block",
    name: "24h H100 Block",
    label: "Reserved Compute",
    price: "$4.80/block",
    providers: 31,
    vram: "80GB HBM3",
    workloads: "Long Training Runs",
    availability: 56,
    badge: null,
    volume24h: "18 blocks",
    icon: Clock,
  },
];

const recentSettlements = [
  { pair: "H100 / USDC", qty: "48 GPU-hrs", price: "$0.21", time: "2m ago" },
  { pair: "A100 / USDC", qty: "120 GPU-hrs", price: "$0.14", time: "4m ago" },
  { pair: "RTX 4090 / USDC", qty: "72 GPU-hrs", price: "$0.09", time: "7m ago" },
  { pair: "H100 / USDC", qty: "24 GPU-hrs", price: "$0.22", time: "11m ago" },
];

const BatchCountdown = () => {
  const [secs, setSecs] = useState(22);
  useEffect(() => {
    const iv = setInterval(() => setSecs(s => (s <= 0 ? 32 : s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono bg-primary/10 text-primary border border-primary/20">
      <Timer className="w-3 h-3" />
      Clears in {secs}s
    </span>
  );
};

const Marketplace = () => {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-[1440px]">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">
            Private compute markets · Encrypted order flow · Batch auction execution
          </p>
        </div>

        {/* Top Market Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard delay={0} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Est. Market Price</p>
                <p className="text-lg font-mono font-semibold text-foreground tabular-nums mt-1">$0.19<span className="text-xs text-muted-foreground">/hr</span></p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ▲ 3.2%
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">vs last epoch</span>
            </div>
          </GlassCard>

          <AuctionTimer />

          <GlassCard delay={0.1} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Anonymized Depth</p>
                <p className="text-lg font-mono font-semibold text-foreground tabular-nums mt-1">12,450<span className="text-xs text-muted-foreground ml-1">GPU-hrs</span></p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "72%" }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50"
              />
            </div>
          </GlassCard>

          <GlassCard delay={0.15} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Active Providers</p>
                <p className="text-lg font-mono font-semibold text-foreground tabular-nums mt-1">387</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                +12 today
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Compute Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Private Compute Markets</span>
              <p className="text-[11px] text-muted-foreground/60 font-mono">Encrypted bids · Batch auctions · USDC settlement on Base</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {computeProducts.map((product, i) => (
              <GlassCard
                key={product.id}
                delay={0.2 + i * 0.06}
                className="p-0 cursor-pointer group flex flex-col"
                onClick={() => navigate(`/marketplace/${product.id}`)}
              >
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center group-hover:bg-primary/[0.14] transition-colors duration-500">
                        <product.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                        <span className="font-mono text-[10px] text-primary/70 tracking-wider">{product.label}</span>
                      </div>
                    </div>
                    {product.badge && (
                      <span className="px-2 py-1 rounded-full text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {product.badge.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Price & Providers */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Est. Clearing Price</p>
                      <p className="font-mono text-xl font-semibold text-foreground tabular-nums">{product.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Verified Providers</p>
                      <p className="font-mono text-sm text-foreground/70 tabular-nums flex items-center justify-end gap-1">
                        <Shield className="w-3 h-3 text-emerald-400/60" />
                        {product.providers}
                      </p>
                    </div>
                  </div>

                  {/* Batch countdown + 24h volume */}
                  <div className="flex items-center justify-between mb-4">
                    <BatchCountdown />
                    <span className="font-mono text-[9px] text-muted-foreground">
                      24h vol: <span className="text-foreground/60">{product.volume24h}</span>
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                      {product.vram}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                      {product.workloads}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                      USDC on Base
                    </span>
                  </div>

                  {/* Fill Likelihood bar */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between font-mono text-[10px] items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                            Fill Likelihood
                            <Info className="w-3 h-3 text-muted-foreground/50" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-[10px]">
                          Probability your order fills in the next batch auction, based on current market depth and demand.
                        </TooltipContent>
                      </Tooltip>
                      <span className={`${product.availability >= 70 ? "text-emerald-400" : product.availability >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                        {product.availability}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${product.availability}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.08 }}
                        className={`h-full rounded-full ${
                          product.availability >= 70
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400/50"
                            : product.availability >= 40
                            ? "bg-gradient-to-r from-amber-500 to-amber-400/50"
                            : "bg-gradient-to-r from-rose-500 to-rose-400/50"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer CTA — Buy / Sell */}
                <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-2 group-hover:bg-white/[0.02] transition-colors duration-500">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${product.id}?side=buy`); }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    Buy
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${product.id}?side=sell`); }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    Sell
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-[9px] text-muted-foreground group-hover:text-foreground/70 transition-colors">Details</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Recent Settlements */}
        <GlassCard delay={0.6} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Recent Settlements</span>
              <p className="text-[11px] text-muted-foreground/50 font-mono">Anonymized batch auction results</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-400/70">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSettlements.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-medium text-foreground/80">{s.pair}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{s.time}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{s.qty}</span>
                  <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">{s.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Future Products Teaser */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard delay={0.8} className="p-6 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Compute Futures</h3>
                <span className="font-mono text-[10px] text-muted-foreground/50">Coming Soon</span>
              </div>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed">
              Lock in future compute at today's prices. Hedging for AI infrastructure spend.
            </p>
          </GlassCard>

          <GlassCard delay={0.85} className="p-6 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Institutional Block Orders</h3>
                <span className="font-mono text-[10px] text-muted-foreground/50">Coming Soon</span>
              </div>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed">
              Large-scale private compute procurement with dedicated settlement and SLA guarantees.
            </p>
          </GlassCard>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Marketplace;
