import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Server, Zap, Layers, Activity, Clock, Lock, Shield, BarChart3, CheckCircle, TrendingUp, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLabel } from "@/components/ui/section-label";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const productData: Record<string, {
  name: string; label: string; price: string; priceNum: number; providers: number;
  vram: string; workloads: string[]; availability: number; description: string;
  icon: typeof Cpu; benchmarks: { label: string; value: string; icon: typeof CheckCircle }[];
}> = {
  h100: {
    name: "NVIDIA H100", label: "Private Compute", price: "$0.21/GPU-hour", priceNum: 0.21,
    providers: 47, vram: "80GB HBM3", workloads: ["Training", "Inference", "Fine-tuning", "Batch Jobs"],
    availability: 92, icon: Cpu,
    description: "Enterprise-grade GPU compute with encrypted order flow. Submit private bids through batch auctions with provable fairness and USDC settlement on Base.",
    benchmarks: [
      { label: "Avg. Uptime", value: "99.7%", icon: CheckCircle },
      { label: "Fill Rate", value: "94%", icon: TrendingUp },
      { label: "Avg. Latency", value: "12ms", icon: Activity },
      { label: "Verified Providers", value: "47", icon: Shield },
    ],
  },
  a100: {
    name: "NVIDIA A100", label: "Private Compute", price: "$0.15/GPU-hour", priceNum: 0.15,
    providers: 89, vram: "80GB HBM2e", workloads: ["Training", "Fine-tuning", "Inference", "Research"],
    availability: 78, icon: Server,
    description: "High-performance compute for AI training workloads. Privacy-preserving batch auctions ensure fair pricing without exposing your demand.",
    benchmarks: [
      { label: "Avg. Uptime", value: "99.5%", icon: CheckCircle },
      { label: "Fill Rate", value: "91%", icon: TrendingUp },
      { label: "Avg. Latency", value: "15ms", icon: Activity },
      { label: "Verified Providers", value: "89", icon: Shield },
    ],
  },
  rtx4090: {
    name: "RTX 4090", label: "Private Compute", price: "$0.08/GPU-hour", priceNum: 0.08,
    providers: 234, vram: "24GB GDDR6X", workloads: ["Inference", "Batch Jobs", "Fine-tuning", "Dev/Test"],
    availability: 65, icon: Zap,
    description: "Cost-efficient GPU compute for inference and development workloads. Ideal for teams scaling with privacy-preserving compute procurement.",
    benchmarks: [
      { label: "Avg. Uptime", value: "98.9%", icon: CheckCircle },
      { label: "Fill Rate", value: "88%", icon: TrendingUp },
      { label: "Avg. Latency", value: "8ms", icon: Activity },
      { label: "Verified Providers", value: "234", icon: Shield },
    ],
  },
  "multi-gpu": {
    name: "Multi-GPU Cluster", label: "Training Cluster", price: "$1.40/GPU-hour", priceNum: 1.40,
    providers: 12, vram: "8×H100 (640GB)", workloads: ["Distributed Training", "Large Models", "Research", "Pre-training"],
    availability: 34, icon: Layers,
    description: "8×H100 clusters for distributed training at scale. Encrypted procurement ensures competitors cannot observe your infrastructure build-out.",
    benchmarks: [
      { label: "Avg. Uptime", value: "99.2%", icon: CheckCircle },
      { label: "Fill Rate", value: "82%", icon: TrendingUp },
      { label: "Interconnect", value: "NVLink", icon: Activity },
      { label: "Verified Providers", value: "12", icon: Shield },
    ],
  },
  "compute-credits": {
    name: "Compute Credits", label: "Prepaid Compute", price: "$0.18/GPU-hour", priceNum: 0.18,
    providers: 387, vram: "Flexible", workloads: ["Any Workload", "Multi-GPU", "Burst Scaling", "Reserved"],
    availability: 100, icon: Activity,
    description: "Flexible compute credits redeemable across all GPU types. Pre-purchase at auction-determined rates with full privacy.",
    benchmarks: [
      { label: "Redeemable", value: "All GPUs", icon: CheckCircle },
      { label: "Expiry", value: "90 days", icon: Clock },
      { label: "Min. Purchase", value: "100 units", icon: TrendingUp },
      { label: "Providers", value: "387", icon: Shield },
    ],
  },
  "h100-block": {
    name: "24h H100 Block", label: "Reserved Compute", price: "$4.80/block", priceNum: 4.80,
    providers: 31, vram: "80GB HBM3", workloads: ["Long Training Runs", "Pre-training", "Research", "Continuous Inference"],
    availability: 56, icon: Clock,
    description: "24-hour reserved H100 compute blocks for uninterrupted workloads. Guaranteed availability with encrypted reservation flow.",
    benchmarks: [
      { label: "Guarantee", value: "99.9%", icon: CheckCircle },
      { label: "Block Size", value: "24 hrs", icon: Clock },
      { label: "Fill Rate", value: "86%", icon: TrendingUp },
      { label: "Verified Providers", value: "31", icon: Shield },
    ],
  },
};

const priceHistory = [
  { time: "00:00", price: 0.19 }, { time: "04:00", price: 0.20 }, { time: "08:00", price: 0.22 },
  { time: "12:00", price: 0.21 }, { time: "16:00", price: 0.19 }, { time: "20:00", price: 0.20 },
  { time: "Now", price: 0.21 },
];

const supplyDemand = [
  { range: "$0.15", supply: 120, demand: 40 }, { range: "$0.18", supply: 95, demand: 70 },
  { range: "$0.20", supply: 60, demand: 90 }, { range: "$0.22", supply: 40, demand: 110 },
  { range: "$0.25", supply: 25, demand: 80 }, { range: "$0.28", supply: 15, demand: 50 },
];

const settlements = [
  { id: "0x3f…a91c", qty: "48 GPU-hrs", price: "$0.21", time: "2m ago" },
  { id: "0x7b…e4d2", qty: "120 GPU-hrs", price: "$0.20", time: "8m ago" },
  { id: "0xa1…c7f8", qty: "24 GPU-hrs", price: "$0.22", time: "14m ago" },
  { id: "0xd9…1b3e", qty: "72 GPU-hrs", price: "$0.21", time: "22m ago" },
  { id: "0x5c…f092", qty: "96 GPU-hrs", price: "$0.19", time: "31m ago" },
];

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState([24]);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("1h");

  const product = productData[productId || "h100"] || productData.h100;
  const defaultPrice = product.priceNum.toFixed(2);
  const currentPrice = price || defaultPrice;
  const estTotal = (quantity[0] * parseFloat(currentPrice || "0")).toFixed(2);

  return (
    <div className="space-y-8 max-w-[1440px]">
      {/* Back nav */}
      <button
        onClick={() => navigate("/marketplace")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px] group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Marketplace
      </button>

      {/* Hero */}
      <GlassCard delay={0} glow className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center">
                <product.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">{product.name}</h1>
                <span className="font-mono text-xs text-primary/70 tracking-wider">{product.label}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">{product.description}</p>

            {/* Key stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Est. Clearing</p>
                <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.price}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Providers</p>
                <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.providers}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">VRAM</p>
                <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.vram}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Liquidity</p>
                <p className={`font-mono text-lg font-semibold tabular-nums mt-1 ${
                  product.availability >= 70 ? "text-emerald-400" : product.availability >= 40 ? "text-amber-400" : "text-rose-400"
                }`}>{product.availability}%</p>
              </div>
            </div>
          </div>

          {/* Workloads */}
          <div className="lg:w-48 shrink-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Use Cases</p>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {product.workloads.map((w) => (
                <span key={w} className="px-4 py-2 rounded-lg text-[11px] font-mono bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price History */}
          <GlassCard delay={0.1} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Price History (24h)</span>
              <span className="font-mono text-[10px] text-muted-foreground/50">USDC / GPU-hr</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(263,70%,58%)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(263,70%,58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(5,5,8,0.95)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12, fontSize: 11, fontFamily: "JetBrains Mono",
                      backdropFilter: "blur(16px)", boxShadow: "0 0 30px rgba(108,60,233,0.15)",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.3)" }}
                    formatter={(value: number) => [`$${value.toFixed(3)}`, "Price"]}
                  />
                  <Area type="monotone" dataKey="price" stroke="hsl(263,70%,58%)" strokeWidth={2} fill="url(#priceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Supply vs Demand */}
          <GlassCard delay={0.2} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anonymized Supply vs Demand</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyDemand} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(5,5,8,0.95)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12, fontSize: 11, fontFamily: "JetBrains Mono",
                      backdropFilter: "blur(16px)",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <Bar dataKey="supply" fill="hsl(152,82%,45%)" radius={[4, 4, 0, 0]} opacity={0.7} name="Supply (GPU-hrs)" />
                  <Bar dataKey="demand" fill="hsl(263,70%,58%)" radius={[4, 4, 0, 0]} opacity={0.7} name="Demand (GPU-hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Provider Quality */}
          <GlassCard delay={0.3} className="p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">Provider Quality</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.benchmarks.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"
                >
                  <b.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                  <p className="font-mono text-sm font-semibold text-foreground tabular-nums">{b.value}</p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-1">{b.label}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Settlements */}
          <GlassCard delay={0.35} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent Settlements</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-400/70">Live</span>
              </div>
            </div>
            <div className="space-y-2">
              {settlements.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                >
                  <span className="font-mono text-[11px] text-primary/60">{s.id}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{s.qty}</span>
                  <span className="font-mono text-[11px] font-semibold text-emerald-400 tabular-nums">{s.price}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">{s.time}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Privacy section */}
          <GlassCard delay={0.4} className="p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">Privacy & Fair Execution</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Lock, title: "Encrypted Order Flow", desc: "All bids and asks are encrypted. No participant — including the platform — can see raw order data before settlement." },
                { icon: Shield, title: "Provable Fairness", desc: "ZK proofs verify that batch auctions produce fair clearing prices without revealing individual orders." },
                { icon: CheckCircle, title: "USDC Settlement", desc: "All settlements execute on Base in USDC. Transparent on-chain finality with private order details." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <item.icon className="w-5 h-5 text-primary mb-4" />
                  <h4 className="text-sm font-medium text-foreground mb-2">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right column: Order ticket */}
        <div className="space-y-4">
          <GlassCard delay={0.15} glow className="p-6 space-y-4 sticky top-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">Private Order</span>

            {/* Buy/Sell toggle */}
            <div className="flex rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02] relative">
              <motion.div
                className="absolute inset-y-0 w-1/2 rounded-xl"
                animate={{ x: side === "sell" ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  background: side === "buy"
                    ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                    : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                }}
              />
              <button
                className={`flex-1 py-2 text-sm font-bold tracking-wider relative z-10 transition-colors ${side === "buy" ? "text-emerald-400" : "text-muted-foreground"}`}
                onClick={() => setSide("buy")}
              >BUY</button>
              <button
                className={`flex-1 py-2 text-sm font-bold tracking-wider relative z-10 transition-colors ${side === "sell" ? "text-rose-400" : "text-muted-foreground"}`}
                onClick={() => setSide("sell")}
              >SELL</button>
            </div>

            <div className="space-y-2">
              <SectionLabel>GPU Type</SectionLabel>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono text-sm text-foreground/80">
                {product.name} · {product.vram}
              </div>
            </div>

            <div className="space-y-2">
              <SectionLabel>Quantity (GPU-hours): <span className="text-foreground/70">{quantity[0]}</span></SectionLabel>
              <Slider value={quantity} onValueChange={setQuantity} min={1} max={168} step={1} />
              <div className="flex gap-2 mt-2">
                {[24, 48, 72, 168].map((v) => (
                  <button
                    key={v}
                    onClick={() => setQuantity([v])}
                    className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all duration-300 ${
                      quantity[0] === v
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-white/[0.06] text-muted-foreground hover:border-white/10 hover:text-foreground/60"
                    }`}
                  >{v}hr</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <SectionLabel>Duration</SectionLabel>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <SectionLabel>{side === "buy" ? "Max Price" : "Min Price"} (USDC / GPU-hr)</SectionLabel>
              <Input
                value={currentPrice}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
                type="number"
                step="0.01"
                placeholder={defaultPrice}
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Est. Total</span>
              <span className="font-mono text-lg font-semibold text-foreground">${estTotal} <span className="text-xs text-muted-foreground">USDC</span></span>
            </div>

            <Button className="w-full gap-2 bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0 h-12">
              <Lock className="h-4 w-4" />
              Submit Encrypted Order
            </Button>

            <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed text-center">
              Order details remain encrypted until verified settlement. No participant — including the platform — can see raw order data.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
