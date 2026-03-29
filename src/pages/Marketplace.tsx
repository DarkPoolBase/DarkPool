import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Server, Zap, Timer, BarChart3, Activity, Shield, ArrowRight, TrendingUp, Clock, Users, Layers, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MarketCategory = "spot" | "reserved" | "credits" | "clusters";

const computeProducts = [
  // === SPOT (6) ===
  {
    id: "h100", name: "NVIDIA H100", category: "spot" as MarketCategory,
    price: "$0.21/GPU-hour", subtitle: "Best for training",
    providers: 47, vram: "80GB HBM3", availability: 92, badge: "Most Liquid",
    volume24h: "1,240 GPU-hrs", volumeUsd: "$260", icon: Cpu,
  },
  {
    id: "a100", name: "NVIDIA A100", category: "spot" as MarketCategory,
    price: "$0.15/GPU-hour", subtitle: "Best for fine-tuning",
    providers: 89, vram: "80GB HBM2e", availability: 78, badge: "Low Price",
    volume24h: "2,870 GPU-hrs", volumeUsd: "$430", icon: Server,
  },
  {
    id: "rtx4090", name: "RTX 4090", category: "spot" as MarketCategory,
    price: "$0.08/GPU-hour", subtitle: "Lowest cost inference",
    providers: 234, vram: "24GB GDDR6X", availability: 65, badge: "High Demand",
    volume24h: "4,120 GPU-hrs", volumeUsd: "$330", icon: Zap,
  },
  {
    id: "l40s", name: "NVIDIA L40S", category: "spot" as MarketCategory,
    price: "$0.12/GPU-hour", subtitle: "Balanced price-performance",
    providers: 62, vram: "48GB GDDR6", availability: 71, badge: null,
    volume24h: "1,890 GPU-hrs", volumeUsd: "$227", icon: Cpu,
  },
  {
    id: "rtx3090", name: "RTX 3090", category: "spot" as MarketCategory,
    price: "$0.05/GPU-hour", subtitle: "Budget inference",
    providers: 312, vram: "24GB GDDR6X", availability: 88, badge: "Low Price",
    volume24h: "5,640 GPU-hrs", volumeUsd: "$282", icon: Zap,
  },
  {
    id: "h200", name: "NVIDIA H200", category: "spot" as MarketCategory,
    price: "$0.32/GPU-hour", subtitle: "Next-gen training",
    providers: 14, vram: "141GB HBM3e", availability: 38, badge: "Fast Fill",
    volume24h: "420 GPU-hrs", volumeUsd: "$134", icon: Cpu,
  },

  // === RESERVED (6) ===
  {
    id: "h100-block", name: "24h H100 Block", category: "reserved" as MarketCategory,
    price: "$4.80/GPU-hour", subtitle: "Guaranteed capacity",
    providers: 31, vram: "80GB HBM3", availability: 56, badge: "Fast Fill",
    volume24h: "18 blocks", volumeUsd: "$86", icon: Clock,
  },
  {
    id: "a100-block", name: "48h A100 Block", category: "reserved" as MarketCategory,
    price: "$3.20/GPU-hour", subtitle: "Extended training runs",
    providers: 24, vram: "80GB HBM2e", availability: 42, badge: null,
    volume24h: "12 blocks", volumeUsd: "$61", icon: Clock,
  },
  {
    id: "h100-week", name: "7-Day H100 Block", category: "reserved" as MarketCategory,
    price: "$4.20/GPU-hour", subtitle: "Weekly commitment discount",
    providers: 19, vram: "80GB HBM3", availability: 31, badge: "Low Price",
    volume24h: "6 blocks", volumeUsd: "$201", icon: Clock,
  },
  {
    id: "a100-week", name: "7-Day A100 Block", category: "reserved" as MarketCategory,
    price: "$2.80/GPU-hour", subtitle: "Cost-efficient reservation",
    providers: 28, vram: "80GB HBM2e", availability: 64, badge: null,
    volume24h: "9 blocks", volumeUsd: "$176", icon: Clock,
  },
  {
    id: "h200-block", name: "24h H200 Block", category: "reserved" as MarketCategory,
    price: "$7.20/GPU-hour", subtitle: "Premium reserved capacity",
    providers: 8, vram: "141GB HBM3e", availability: 22, badge: "Most Liquid",
    volume24h: "4 blocks", volumeUsd: "$115", icon: Clock,
  },
  {
    id: "l40s-block", name: "48h L40S Block", category: "reserved" as MarketCategory,
    price: "$2.40/GPU-hour", subtitle: "Balanced reserved compute",
    providers: 35, vram: "48GB GDDR6", availability: 73, badge: "High Demand",
    volume24h: "22 blocks", volumeUsd: "$106", icon: Clock,
  },

  // === CREDITS (6) ===
  {
    id: "compute-credits", name: "Compute Credits", category: "credits" as MarketCategory,
    price: "$0.18/GPU-hour", subtitle: "Any workload, flexible",
    providers: 387, vram: "Flexible", availability: 100, badge: "Most Liquid",
    volume24h: "8,450 units", volumeUsd: "$1,521", icon: Activity,
  },
  {
    id: "training-credits", name: "Training Credits", category: "credits" as MarketCategory,
    price: "$0.20/GPU-hour", subtitle: "Optimized for training",
    providers: 142, vram: "A100+ tier", availability: 94, badge: null,
    volume24h: "3,200 units", volumeUsd: "$640", icon: Activity,
  },
  {
    id: "inference-credits", name: "Inference Credits", category: "credits" as MarketCategory,
    price: "$0.09/GPU-hour", subtitle: "Low-latency inference",
    providers: 298, vram: "Consumer+ tier", availability: 97, badge: "Low Price",
    volume24h: "11,200 units", volumeUsd: "$1,008", icon: Activity,
  },
  {
    id: "burst-credits", name: "Burst Credits", category: "credits" as MarketCategory,
    price: "$0.25/GPU-hour", subtitle: "On-demand surge capacity",
    providers: 89, vram: "Any GPU", availability: 85, badge: "Fast Fill",
    volume24h: "1,840 units", volumeUsd: "$460", icon: Zap,
  },
  {
    id: "prepaid-1000", name: "1,000-hr Credit Pack", category: "credits" as MarketCategory,
    price: "$0.16/GPU-hour", subtitle: "Bulk discount pricing",
    providers: 387, vram: "Flexible", availability: 100, badge: "Low Price",
    volume24h: "14 packs", volumeUsd: "$2,240", icon: Activity,
  },
  {
    id: "enterprise-credits", name: "Enterprise Credits", category: "credits" as MarketCategory,
    price: "$0.14/GPU-hour", subtitle: "Volume-tiered pricing",
    providers: 52, vram: "H100/A100 tier", availability: 88, badge: "High Demand",
    volume24h: "4,600 units", volumeUsd: "$644", icon: Shield,
  },

  // === CLUSTERS (6) ===
  {
    id: "multi-gpu", name: "Multi-GPU Cluster", category: "clusters" as MarketCategory,
    price: "$1.40/GPU-hour", subtitle: "Distributed training",
    providers: 12, vram: "8×H100 (640GB)", availability: 34, badge: "Fast Fill",
    volume24h: "96 GPU-hrs", volumeUsd: "$134", icon: Layers,
  },
  {
    id: "a100-cluster", name: "A100 Cluster", category: "clusters" as MarketCategory,
    price: "$0.95/GPU-hour", subtitle: "Cost-efficient scale",
    providers: 18, vram: "4×A100 (320GB)", availability: 48, badge: null,
    volume24h: "144 GPU-hrs", volumeUsd: "$137", icon: Layers,
  },
  {
    id: "h100-mega", name: "H100 Mega Cluster", category: "clusters" as MarketCategory,
    price: "$2.10/GPU-hour", subtitle: "Large-scale LLM training",
    providers: 6, vram: "16×H100 (1.28TB)", availability: 18, badge: "Most Liquid",
    volume24h: "48 GPU-hrs", volumeUsd: "$101", icon: Layers,
  },
  {
    id: "inference-cluster", name: "Inference Cluster", category: "clusters" as MarketCategory,
    price: "$0.52/GPU-hour", subtitle: "High-throughput serving",
    providers: 28, vram: "4×L40S (192GB)", availability: 62, badge: "High Demand",
    volume24h: "312 GPU-hrs", volumeUsd: "$162", icon: Layers,
  },
  {
    id: "hybrid-cluster", name: "Hybrid GPU Cluster", category: "clusters" as MarketCategory,
    price: "$0.78/GPU-hour", subtitle: "Mixed GPU training",
    providers: 15, vram: "Mixed (256GB+)", availability: 41, badge: null,
    volume24h: "168 GPU-hrs", volumeUsd: "$131", icon: Layers,
  },
  {
    id: "h200-cluster", name: "H200 Cluster", category: "clusters" as MarketCategory,
    price: "$2.80/GPU-hour", subtitle: "Next-gen distributed",
    providers: 4, vram: "4×H200 (564GB)", availability: 15, badge: "Fast Fill",
    volume24h: "24 GPU-hrs", volumeUsd: "$67", icon: Layers,
  },
];

const recentSettlements = [
  { name: "NVIDIA H100", price: "$0.21", unit: "GPU-hr", qty: "48 GPU-hrs", time: "2m ago" },
  { name: "NVIDIA A100", price: "$0.14", unit: "GPU-hr", qty: "120 GPU-hrs", time: "4m ago" },
  { name: "RTX 4090", price: "$0.09", unit: "GPU-hr", qty: "72 GPU-hrs", time: "7m ago" },
  { name: "NVIDIA H100", price: "$0.22", unit: "GPU-hr", qty: "24 GPU-hrs", time: "5m ago" },
  { name: "NVIDIA L40S", price: "$0.11", unit: "GPU-hr", qty: "96 GPU-hrs", time: "9m ago" },
  { name: "RTX 3090", price: "$0.04", unit: "GPU-hr", qty: "210 GPU-hrs", time: "12m ago" },
];

const categories: { key: MarketCategory; label: string }[] = [
  { key: "spot", label: "Spot Markets" },
  { key: "reserved", label: "Reserved Blocks" },
  { key: "credits", label: "Credits" },
  { key: "clusters", label: "Clusters" },
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

const badgeColor = (badge: string) => {
  switch (badge) {
    case "Most Liquid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Low Price": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "High Demand": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Fast Fill": return "bg-primary/10 text-primary border-primary/20";
    default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
};

const Marketplace = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("spot");

  const filteredProducts = computeProducts.filter(p => p.category === activeCategory);

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Private Compute Markets</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">
            Buy and sell GPU compute through private batch auctions
          </p>
        </div>

        {/* Category Tabs + Products */}
        <div>
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-lg font-mono text-[11px] transition-all duration-200 ${
                  activeCategory === cat.key
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground/70 border border-transparent"
                }`}
              >
                {cat.label}
                <span className="ml-2 text-[9px] opacity-60">{computeProducts.filter(p => p.category === cat.key).length}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, i) => (
              <GlassCard
                key={product.id}
                delay={0.1 + i * 0.06}
                className="p-0 cursor-pointer group flex flex-col"
                onClick={() => navigate(`/marketplace/${product.id}`)}
              >
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header: Name + Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center group-hover:bg-primary/[0.14] transition-colors duration-500">
                        <product.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                        <span className="font-mono text-[10px] text-muted-foreground/60">{product.vram}</span>
                      </div>
                    </div>
                    {product.badge && (
                      <span className={`px-2 py-1 rounded-full text-[9px] font-mono font-medium border ${badgeColor(product.badge)}`}>
                        {product.badge.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Price + Subtitle */}
                  <div className="mb-3">
                    <p className="font-mono text-xl font-semibold text-foreground tabular-nums">{product.price}</p>
                    <p className="font-mono text-[10px] text-primary/60 mt-0.5">{product.subtitle}</p>
                  </div>

                  {/* Fill Likelihood */}
                  <div className="space-y-1.5 mb-3">
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
                      <span className={`font-semibold ${product.availability >= 70 ? "text-emerald-400" : product.availability >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                        {product.availability}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${product.availability}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.08 }}
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

                  {/* Providers + Batch timer */}
                  <div className="flex items-center justify-between mb-3 mt-auto">
                    <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400/60" />
                      {product.providers} verified
                    </span>
                    <BatchCountdown />
                  </div>

                  {/* 24h Volume */}
                  <div className="font-mono text-[9px] text-muted-foreground/60">
                    24h vol: <span className="text-foreground/50">{product.volume24h}</span> <span className="text-muted-foreground/40">({product.volumeUsd})</span>
                  </div>
                </div>

                {/* Footer: Buy (primary) / Sell (secondary) / View Market (tertiary) */}
                <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-2 group-hover:bg-white/[0.02] transition-colors duration-500">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${product.id}?side=buy`); }}
                    className="flex-[2] py-2 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
                  >
                    Buy
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${product.id}?side=sell`); }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    Sell
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${product.id}`); }}
                    className="ml-auto flex items-center gap-1.5 px-2 py-2 text-[9px] font-mono text-muted-foreground hover:text-foreground/70 transition-colors"
                  >
                    View Market
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Live Activity Strip */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live Settlements</span>
          </div>
          <div className="flex flex-col gap-0 rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
            {recentSettlements.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.06 }}
                className="flex items-center gap-4 px-4 py-2.5 font-mono text-[11px] border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-200"
              >
                <span className="text-foreground/60 w-28 shrink-0 truncate">{s.name}</span>
                <span className="text-emerald-400 font-semibold text-sm tabular-nums">{s.price}</span>
                <span className="text-muted-foreground/40 text-[10px]">/ {s.unit}</span>
                <span className="text-muted-foreground/50 hidden sm:inline">—</span>
                <span className="text-foreground/40 tabular-nums hidden sm:inline">{s.qty} traded</span>
                <span className="ml-auto text-muted-foreground/30 text-[10px] tabular-nums shrink-0">{s.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Future Products Teaser */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard delay={0.8} className="p-6 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
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
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
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
