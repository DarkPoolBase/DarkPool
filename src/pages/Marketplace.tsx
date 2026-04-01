/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Server, Zap, Timer, BarChart3, Activity, Shield, ArrowRight, TrendingUp, Clock, Users, Layers, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketPrices, useMarketStats, useMarketVolume } from "@/hooks/useMarket";
import { useSettlements } from "@/hooks/useOrders";

type MarketCategory = "spot" | "reserved" | "credits" | "clusters";

// Static product catalog — prices/providers/volume are overridden by API data
const gpuMeta: Record<string, { name: string; vram: string; subtitle: string; icon: typeof Cpu }> = {
  H100:  { name: "NVIDIA H100",  vram: "80GB HBM3",   subtitle: "Best for training",         icon: Cpu },
  A100:  { name: "NVIDIA A100",  vram: "80GB HBM2e",  subtitle: "Best for fine-tuning",      icon: Server },
  L40S:  { name: "NVIDIA L40S",  vram: "48GB GDDR6",  subtitle: "Balanced price-performance", icon: Cpu },
  H200:  { name: "NVIDIA H200",  vram: "141GB HBM3e", subtitle: "Next-gen training",         icon: Cpu },
  A10G:  { name: "NVIDIA A10G",  vram: "24GB GDDR6",  subtitle: "Budget inference",          icon: Zap },
};

// Derived product types beyond spot
const reservedProducts = [
  { id: "h100-block", name: "24h H100 Block", gpuBase: "H100", multiplier: 24, vram: "80GB HBM3", subtitle: "Guaranteed capacity", icon: Clock },
  { id: "a100-block", name: "48h A100 Block", gpuBase: "A100", multiplier: 48, vram: "80GB HBM2e", subtitle: "Extended training runs", icon: Clock },
  { id: "h100-week", name: "7-Day H100 Block", gpuBase: "H100", multiplier: 168, vram: "80GB HBM3", subtitle: "Weekly commitment discount", icon: Clock },
  { id: "h200-block", name: "24h H200 Block", gpuBase: "H200", multiplier: 24, vram: "141GB HBM3e", subtitle: "Premium reserved capacity", icon: Clock },
  { id: "l40s-block", name: "48h L40S Block", gpuBase: "L40S", multiplier: 48, vram: "48GB GDDR6", subtitle: "Balanced reserved compute", icon: Clock },
];

const creditProducts = [
  { id: "compute-credits", name: "Compute Credits", subtitle: "Any workload, flexible", vram: "Flexible", icon: Activity },
  { id: "training-credits", name: "Training Credits", subtitle: "Optimized for training", vram: "A100+ tier", icon: Activity },
  { id: "inference-credits", name: "Inference Credits", subtitle: "Low-latency inference", vram: "Consumer+ tier", icon: Activity },
  { id: "burst-credits", name: "Burst Credits", subtitle: "On-demand surge capacity", vram: "Any GPU", icon: Zap },
];

const clusterProducts = [
  { id: "multi-gpu", name: "Multi-GPU Cluster", gpuBase: "H100", gpuCount: 8, vram: "8×H100 (640GB)", subtitle: "Distributed training", icon: Layers },
  { id: "a100-cluster", name: "A100 Cluster", gpuBase: "A100", gpuCount: 4, vram: "4×A100 (320GB)", subtitle: "Cost-efficient scale", icon: Layers },
  { id: "h100-mega", name: "H100 Mega Cluster", gpuBase: "H100", gpuCount: 16, vram: "16×H100 (1.28TB)", subtitle: "Large-scale LLM training", icon: Layers },
  { id: "h200-cluster", name: "H200 Cluster", gpuBase: "H200", gpuCount: 4, vram: "4×H200 (564GB)", subtitle: "Next-gen distributed", icon: Layers },
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
  const { data: marketPrices } = useMarketPrices();
  const { data: marketStats } = useMarketStats();
  const { data: volumeData } = useMarketVolume();
  const { data: settlements } = useSettlements(6);

  // Build spot products from real market prices
  const priceMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (marketPrices) {
      for (const p of marketPrices) map[p.gpuType] = p;
    }
    return map;
  }, [marketPrices]);

  const spotProducts = useMemo(() => {
    if (!marketPrices?.length) return [];
    return marketPrices.map((p: any) => {
      const meta = gpuMeta[p.gpuType] || { name: p.gpuType, vram: '—', subtitle: 'GPU Compute', icon: Cpu };
      const vol = volumeData?.[p.gpuType];
      const vol24h = vol ? Number(vol.volume24h).toLocaleString() : Number(p.volume24h).toLocaleString();
      const volUsd = (parseFloat(p.volume24h) * parseFloat(p.price)).toFixed(0);
      return {
        id: p.gpuType.toLowerCase(),
        name: meta.name,
        category: "spot" as MarketCategory,
        price: `$${parseFloat(p.price).toFixed(2)}/GPU-hour`,
        subtitle: meta.subtitle,
        providers: marketStats?.totalProviders ?? 0,
        vram: meta.vram,
        availability: Math.min(100, Math.max(10, 50 + Math.round(p.change24h * 10))),
        badge: p.change24h > 3 ? "High Demand" : p.change24h < -1 ? "Low Price" : parseFloat(p.volume24h) > 20000 ? "Most Liquid" : null,
        volume24h: `${vol24h} GPU-hrs`,
        volumeUsd: `$${volUsd}`,
        icon: meta.icon,
      };
    });
  }, [marketPrices, marketStats, volumeData]);

  const allReserved = useMemo(() => {
    return reservedProducts.map(rp => {
      const basePrice = priceMap[rp.gpuBase]?.price ? parseFloat(priceMap[rp.gpuBase].price) : 0;
      return {
        id: rp.id, name: rp.name, category: "reserved" as MarketCategory,
        price: `$${(basePrice * rp.multiplier).toFixed(2)}/block`,
        subtitle: rp.subtitle, providers: marketStats?.totalProviders ?? 0,
        vram: rp.vram, availability: 50, badge: null,
        volume24h: '—', volumeUsd: '—', icon: rp.icon,
      };
    });
  }, [priceMap, marketStats]);

  const allCredits = useMemo(() => {
    const avgPrice = marketPrices?.length
      ? marketPrices.reduce((s: number, p: any) => s + parseFloat(p.price), 0) / marketPrices.length
      : 0;
    return creditProducts.map(cp => ({
      id: cp.id, name: cp.name, category: "credits" as MarketCategory,
      price: `$${avgPrice.toFixed(2)}/GPU-hour`,
      subtitle: cp.subtitle, providers: marketStats?.totalProviders ?? 0,
      vram: cp.vram, availability: 95, badge: null,
      volume24h: '—', volumeUsd: '—', icon: cp.icon,
    }));
  }, [marketPrices, marketStats]);

  const allClusters = useMemo(() => {
    return clusterProducts.map(cl => {
      const basePrice = priceMap[cl.gpuBase]?.price ? parseFloat(priceMap[cl.gpuBase].price) : 0;
      return {
        id: cl.id, name: cl.name, category: "clusters" as MarketCategory,
        price: `$${(basePrice * cl.gpuCount).toFixed(2)}/GPU-hour`,
        subtitle: cl.subtitle, providers: marketStats?.totalProviders ?? 0,
        vram: cl.vram, availability: 30, badge: null,
        volume24h: '—', volumeUsd: '—', icon: cl.icon,
      };
    });
  }, [priceMap, marketStats]);

  const computeProducts = useMemo(() => {
    return [...spotProducts, ...allReserved, ...allCredits, ...allClusters];
  }, [spotProducts, allReserved, allCredits, allClusters]);

  // Build settlement feed from real data
  const recentSettlements = useMemo(() => {
    if (!settlements?.length) return [];
    return settlements.slice(0, 6).map((s: any) => {
      const elapsed = Math.round((Date.now() - new Date(s.settledAt || s.createdAt).getTime()) / 60000);
      const timeAgo = elapsed < 1 ? 'Just now' : `${elapsed}m ago`;
      return {
        name: `Batch #${s.batchId ?? s.batch_id ?? '—'}`,
        price: `$${parseFloat(s.clearingPrice || s.clearing_price || '0').toFixed(2)}`,
        unit: "GPU-hr",
        qty: `${parseFloat(s.totalVolume || s.total_volume || '0').toFixed(0)} GPU-hrs`,
        time: timeAgo,
      };
    });
  }, [settlements]);

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
                <span className="ml-2 text-[9px] opacity-60">{computeProducts.filter((p: any) => p.category === cat.key).length}</span>
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
