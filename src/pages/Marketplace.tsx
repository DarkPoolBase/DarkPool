import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Server, Zap, Timer, BarChart3, Activity, Shield, ArrowRight, TrendingUp, Clock, Users, Layers } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";

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
    featured: true,
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
    featured: true,
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
    featured: false,
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
    featured: true,
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
    featured: false,
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
    featured: false,
    icon: Clock,
  },
];

const recentSettlements = [
  { pair: "H100 / USDC", qty: "48 GPU-hrs", price: "$0.21", time: "2m ago" },
  { pair: "A100 / USDC", qty: "120 GPU-hrs", price: "$0.14", time: "4m ago" },
  { pair: "RTX 4090 / USDC", qty: "72 GPU-hrs", price: "$0.09", time: "7m ago" },
  { pair: "H100 / USDC", qty: "24 GPU-hrs", price: "$0.22", time: "11m ago" },
];

const Marketplace = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-[1440px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono text-[11px]">
          Private compute markets · Encrypted order flow · Batch auction execution
        </p>
      </div>

      {/* Top Market Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard delay={0} className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Est. Market Price</p>
              <p className="text-lg font-mono font-semibold text-foreground tabular-nums">$0.19<span className="text-xs text-muted-foreground">/hr</span></p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ▲ 3.2%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">vs last epoch</span>
          </div>
        </GlassCard>

        <AuctionTimer />

        <GlassCard delay={0.1} className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Anonymized Depth</p>
              <p className="text-lg font-mono font-semibold text-foreground tabular-nums">12,450<span className="text-xs text-muted-foreground ml-1">GPU-hrs</span></p>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50"
            />
          </div>
        </GlassCard>

        <GlassCard delay={0.15} className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Active Providers</p>
              <p className="text-lg font-mono font-semibold text-foreground tabular-nums">387</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +12 today
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Compute Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Private Compute Markets</span>
            <p className="text-[11px] text-muted-foreground/60 font-mono">Encrypted bids · Batch auctions · USDC settlement on Base</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {computeProducts.map((product, i) => (
            <GlassCard
              key={product.id}
              delay={0.2 + i * 0.06}
              className="p-0 cursor-pointer group"
              onClick={() => navigate(`/marketplace/${product.id}`)}
            >
              <div className="p-5 pb-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center group-hover:bg-primary/[0.14] transition-colors duration-500">
                      <product.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                      <span className="font-mono text-[10px] text-primary/70 tracking-wider">{product.label}</span>
                    </div>
                  </div>
                  {product.featured && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                      FEATURED
                    </span>
                  )}
                </div>

                {/* Price & Providers */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Est. Clearing Price</p>
                    <p className="font-mono text-xl font-semibold text-foreground tabular-nums">{product.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Providers</p>
                    <p className="font-mono text-sm text-foreground/70 tabular-nums">{product.providers}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                    {product.vram}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                    {product.workloads}
                  </span>
                </div>

                {/* Availability bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-muted-foreground">Liquidity</span>
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

              {/* Footer CTA */}
              <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between group-hover:bg-white/[0.02] transition-colors duration-500">
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground/70 transition-colors">View Market</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Settlements */}
      <GlassCard delay={0.6} className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Recent Settlements</span>
            <p className="text-[11px] text-muted-foreground/50 font-mono">Anonymized batch auction results</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400/70">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentSettlements.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
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
        <GlassCard delay={0.8} className="p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
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

        <GlassCard delay={0.85} className="p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
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
  );
};

export default Marketplace;
