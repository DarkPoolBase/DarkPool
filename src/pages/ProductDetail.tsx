import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Server, Zap, Layers, Activity, Clock, Lock, Shield, BarChart3, CheckCircle, TrendingUp, Users, Loader2 } from "lucide-react";
import { useCreateOrder, useSettlements } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { usePriceHistory, useMarketPrices, useMarketStats } from "@/hooks/useMarket";
import { useWallet } from "@/contexts/WalletContext";
import { generateCommitment, generateSecret } from "@/lib/commitment";
import { toast } from "sonner";
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
    name: "24h H100 Block", label: "Reserved Compute", price: "$4.80/GPU-hour", priceNum: 4.80,
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
  l40s: {
    name: "NVIDIA L40S", label: "Balanced Compute", price: "$0.85/GPU-hour", priceNum: 0.85,
    providers: 63, vram: "48GB GDDR6", workloads: ["Inference", "Fine-tuning", "Rendering", "Batch Jobs"],
    availability: 74, icon: Cpu,
    description: "Balanced price-performance GPU for inference and fine-tuning workloads. Private batch auctions ensure competitive pricing without order book exposure.",
    benchmarks: [
      { label: "Avg. Uptime", value: "99.4%", icon: CheckCircle },
      { label: "Fill Rate", value: "89%", icon: TrendingUp },
      { label: "Avg. Latency", value: "11ms", icon: Activity },
      { label: "Verified Providers", value: "63", icon: Shield },
    ],
  },
  h200: {
    name: "NVIDIA H200", label: "Next-Gen Training", price: "$3.80/GPU-hour", priceNum: 3.80,
    providers: 18, vram: "141GB HBM3e", workloads: ["Large Model Training", "Pre-training", "Research", "Inference"],
    availability: 41, icon: Cpu,
    description: "Next-generation H200 with 141GB HBM3e memory for frontier model training. Encrypted procurement protects your infrastructure scale-up from competitors.",
    benchmarks: [
      { label: "Avg. Uptime", value: "99.6%", icon: CheckCircle },
      { label: "Fill Rate", value: "79%", icon: TrendingUp },
      { label: "Avg. Latency", value: "14ms", icon: Activity },
      { label: "Verified Providers", value: "18", icon: Shield },
    ],
  },
  a10g: {
    name: "NVIDIA A10G", label: "Budget Inference", price: "$0.35/GPU-hour", priceNum: 0.35,
    providers: 142, vram: "24GB GDDR6", workloads: ["Inference", "Dev/Test", "Fine-tuning", "Batch Jobs"],
    availability: 83, icon: Zap,
    description: "Cost-efficient GPU for inference and development workloads. High availability and budget-friendly pricing through private batch auctions.",
    benchmarks: [
      { label: "Avg. Uptime", value: "98.8%", icon: CheckCircle },
      { label: "Fill Rate", value: "92%", icon: TrendingUp },
      { label: "Avg. Latency", value: "7ms", icon: Activity },
      { label: "Verified Providers", value: "142", icon: Shield },
    ],
  },
  "a100-block": {
    name: "48h A100 Block", label: "Reserved Compute", price: "$57.60/block", priceNum: 57.60,
    providers: 44, vram: "80GB HBM2e", workloads: ["Extended Training", "Fine-tuning", "Research", "Continuous Inference"],
    availability: 52, icon: Clock,
    description: "48-hour reserved A100 compute blocks for extended training runs. Encrypted reservation ensures your infrastructure plans remain private.",
    benchmarks: [
      { label: "Guarantee", value: "99.5%", icon: CheckCircle },
      { label: "Block Size", value: "48 hrs", icon: Clock },
      { label: "Fill Rate", value: "83%", icon: TrendingUp },
      { label: "Verified Providers", value: "44", icon: Shield },
    ],
  },
  "h100-week": {
    name: "7-Day H100 Block", label: "Reserved Compute", price: "$35.28/block", priceNum: 35.28,
    providers: 22, vram: "80GB HBM3", workloads: ["Pre-training", "Long Training Runs", "Research", "Large Models"],
    availability: 38, icon: Clock,
    description: "7-day reserved H100 blocks for sustained pre-training workloads. Weekly commitments secure capacity at locked-in rates with full privacy.",
    benchmarks: [
      { label: "Guarantee", value: "99.8%", icon: CheckCircle },
      { label: "Block Size", value: "7 days", icon: Clock },
      { label: "Fill Rate", value: "80%", icon: TrendingUp },
      { label: "Verified Providers", value: "22", icon: Shield },
    ],
  },
  "h200-block": {
    name: "24h H200 Block", label: "Reserved Compute", price: "$91.20/block", priceNum: 91.20,
    providers: 9, vram: "141GB HBM3e", workloads: ["Frontier Model Training", "Large-Scale Inference", "Research", "Pre-training"],
    availability: 28, icon: Clock,
    description: "24-hour reserved H200 blocks for premium next-gen compute. Encrypted reservation flow protects your capacity requirements from market exposure.",
    benchmarks: [
      { label: "Guarantee", value: "99.7%", icon: CheckCircle },
      { label: "Block Size", value: "24 hrs", icon: Clock },
      { label: "Fill Rate", value: "74%", icon: TrendingUp },
      { label: "Verified Providers", value: "9", icon: Shield },
    ],
  },
  "l40s-block": {
    name: "48h L40S Block", label: "Reserved Compute", price: "$40.80/block", priceNum: 40.80,
    providers: 38, vram: "48GB GDDR6", workloads: ["Extended Inference", "Fine-tuning", "Rendering", "Batch Processing"],
    availability: 61, icon: Clock,
    description: "48-hour reserved L40S compute blocks for extended inference and fine-tuning. Balanced cost and capacity with private batch auction pricing.",
    benchmarks: [
      { label: "Guarantee", value: "99.3%", icon: CheckCircle },
      { label: "Block Size", value: "48 hrs", icon: Clock },
      { label: "Fill Rate", value: "85%", icon: TrendingUp },
      { label: "Verified Providers", value: "38", icon: Shield },
    ],
  },
};


const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState([24]);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("1h");

  const { connected, setShowModal } = useWallet();
  const { isAuthenticated, authenticate } = useAutoAuth();
  const createOrder = useCreateOrder();

  // Map productId to valid GPU type for the API
  const gpuTypeMap: Record<string, string> = {
    h100: 'H100', a100: 'A100', rtx4090: 'RTX4090', l40s: 'L40S', h200: 'H200', a10g: 'A10G',
    'multi-gpu': 'H100', 'compute-credits': 'H100', 'h100-block': 'H100', 'a100-48h': 'A100',
    'h100-7d': 'H100', 'training-credits': 'H100', 'burst-credits': 'A100',
    'inference-credits': 'RTX4090', '8xh100': 'H100', 'a100-cluster': 'A100',
    'h100-mega': 'H100',
  };

  const resolvedGpu = gpuTypeMap[productId || 'h100'] || 'H100';

  // Fetch real data from API
  const { data: marketPrices } = useMarketPrices();
  const { data: marketStats } = useMarketStats();
  const { data: apiPriceHistory } = usePriceHistory(resolvedGpu, '1h');
  const { data: apiSettlements } = useSettlements(5);

  // Override product data with real market prices
  const product = useMemo(() => {
    const base = productData[productId || "h100"] || productData.h100;
    const livePrice = marketPrices?.find((p: any) => p.gpuType === resolvedGpu);
    if (livePrice) {
      return {
        ...base,
        price: `$${parseFloat(livePrice.price).toFixed(2)}/GPU-hour`,
        priceNum: parseFloat(livePrice.price),
        providers: marketStats?.totalProviders ?? base.providers,
      };
    }
    return base;
  }, [productId, marketPrices, marketStats, resolvedGpu]);

  const defaultPrice = product.priceNum.toFixed(2);
  const currentPrice = price || defaultPrice;

  // Build price chart from API history
  const priceHistory = useMemo(() => {
    if (!apiPriceHistory?.length) return [];
    return apiPriceHistory.map((p: any) => ({
      time: new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(p.close),
    }));
  }, [apiPriceHistory]);

  // Build supply/demand from price history variance
  const supplyDemand = useMemo(() => {
    if (!apiPriceHistory?.length) return [];
    const prices = apiPriceHistory.map((p: any) => parseFloat(p.close));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const step = (max - min) / 5 || 0.01;
    return Array.from({ length: 6 }, (_, i) => {
      const rangePrice = min + step * i;
      return {
        range: `$${rangePrice.toFixed(2)}`,
        supply: Math.round(120 - i * 20 + Math.random() * 10),
        demand: Math.round(30 + i * 18 + Math.random() * 10),
      };
    });
  }, [apiPriceHistory]);

  // Build settlements from real data
  const settlements = useMemo(() => {
    if (!apiSettlements?.length) return [];
    return apiSettlements.map((s: any) => {
      const elapsed = Math.round((Date.now() - new Date(s.settledAt || s.createdAt).getTime()) / 60000);
      const txHash = s.txHash || s.tx_hash || '0x—';
      const short = txHash.length > 10 ? `${txHash.slice(0, 4)}…${txHash.slice(-4)}` : txHash;
      return {
        id: short,
        qty: `${parseFloat(s.totalVolume || s.total_volume || '0').toFixed(0)} GPU-hrs`,
        price: `$${parseFloat(s.clearingPrice || s.clearing_price || '0').toFixed(2)}`,
        time: elapsed < 1 ? 'Just now' : `${elapsed}m ago`,
      };
    });
  }, [apiSettlements]);

  // Map duration string to hours
  const durationMap: Record<string, number> = {
    '1h': 1, '4h': 4, '24h': 24, '7d': 168, '30d': 720,
  };

  const durationHours = durationMap[duration] || 1;
  const estTotal = (quantity[0] * parseFloat(currentPrice || "0") * durationHours).toFixed(2);

  const handleSubmitOrder = async () => {
    if (!connected) { setShowModal(true); return; }

    // Authenticate with SIWE if not already (will prompt wallet signature)
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) { toast.error('Authentication failed or was rejected.'); return; }
    }

    try {
      const gpuType = gpuTypeMap[productId || 'h100'] || 'H100';
      const secret = generateSecret();
      const commitmentHash = generateCommitment({
        gpuType,
        quantity: quantity[0],
        pricePerHour: BigInt(Math.round(parseFloat(currentPrice) * 1e6)),
        duration: durationHours,
        isBuy: side === 'buy',
        secret,
      });

      // Save secret locally so user can prove their order later
      localStorage.setItem(`adp_secret_${commitmentHash}`, secret);

      await createOrder.mutateAsync({
        side: side.toUpperCase(),
        gpuType,
        quantity: quantity[0],
        pricePerHour: parseFloat(currentPrice),
        duration: durationHours,
        commitmentHash,
        encryptedDetails: JSON.stringify({ productId, side, secret: '(stored locally)' }),
      });

      toast.success('Order submitted! View it on the Orders page.');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit order');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back nav */}
      <button
        onClick={() => navigate("/marketplace")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px] group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Marketplace
      </button>

      {/* Hero */}
      <GlassCard delay={0} glow className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center">
            <product.icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">{product.name}</h1>
            <span className="font-mono text-xs text-primary/70 tracking-wider">{product.label}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-6">{product.description}</p>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.03]">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Est. Clearing</p>
            <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.price}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03]">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Verified Providers</p>
            <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.providers}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03]">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">VRAM</p>
            <p className="font-mono text-lg font-semibold text-foreground tabular-nums mt-1">{product.vram}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03]">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Liquidity</p>
            <p className={`font-mono text-lg font-semibold tabular-nums mt-1 ${
              product.availability >= 70 ? "text-emerald-400" : product.availability >= 40 ? "text-amber-400" : "text-rose-400"
            }`}>{product.availability}%</p>
          </div>
        </div>
      </GlassCard>

      {/* Price History — full width */}
      <GlassCard delay={0.1} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Price History (24h)</span>
          <span className="font-mono text-[10px] text-muted-foreground/50">USDC / GPU-hr</span>
        </div>
        <div className="h-[280px]">
          {priceHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-[11px] text-white/20">Loading price history...</p>
            </div>
          ) : (
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
          )}
        </div>
      </GlassCard>

      {/* Order Ticket — redesigned */}
      <GlassCard delay={0.15} glow className="p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Private Order</span>

          {/* Full-width Buy/Sell toggle */}
          <div className="flex rounded-xl overflow-hidden bg-white/[0.03] relative h-12">
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
              className={`flex-1 text-base font-bold tracking-wider relative z-10 transition-colors ${side === "buy" ? "text-emerald-400" : "text-muted-foreground"}`}
              onClick={() => setSide("buy")}
            >BUY</button>
            <button
              className={`flex-1 text-base font-bold tracking-wider relative z-10 transition-colors ${side === "sell" ? "text-rose-400" : "text-muted-foreground"}`}
              onClick={() => setSide("sell")}
            >SELL</button>
          </div>

          {/* 3-column form grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: GPU Type */}
            <div className="flex flex-col gap-3">
              <SectionLabel>GPU Type</SectionLabel>
              <div className="p-4 rounded-xl bg-white/[0.03] flex-1 flex flex-col justify-center">
                <p className="font-mono text-sm font-medium text-foreground">{product.name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-2">{product.vram} · Spot Market</p>
              </div>
            </div>

            {/* Col 2: Quantity */}
            <div className="flex flex-col gap-4">
              <SectionLabel>Quantity (GPU-hours): <span className="text-foreground/70">{quantity[0]}</span></SectionLabel>
              <div className="flex-1 flex flex-col justify-center gap-4">
                <Slider value={quantity} onValueChange={setQuantity} min={1} max={168} step={1} />
                <div className="flex gap-2">
                  {[24, 48, 72, 168].map((v) => (
                    <button
                      key={v}
                      onClick={() => setQuantity([v])}
                      className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                        quantity[0] === v
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-white/[0.06] text-muted-foreground hover:border-white/10 hover:text-foreground/60"
                      }`}
                    >{v}hr</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 3: Price + Duration */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <SectionLabel>{side === "buy" ? "Max Price" : "Min Price"} (USDC / GPU-hr)</SectionLabel>
                <Input
                  value={currentPrice}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-11"
                  type="number"
                  step="0.01"
                  placeholder={defaultPrice}
                />
              </div>
              <div className="flex flex-col gap-3">
                <SectionLabel>Duration</SectionLabel>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-11">
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
            </div>
          </div>

          {/* Summary + Submit bar */}
          <div className="rounded-xl bg-white/[0.03] p-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="font-mono text-xs text-muted-foreground">
                {quantity[0]} GPU-hrs × ${currentPrice}/hr
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Est. Total</span>
                <span className="font-mono text-xl font-semibold text-foreground">${estTotal} <span className="text-xs text-muted-foreground">USDC</span></span>
              </div>
              <Button
                onClick={handleSubmitOrder}
                disabled={createOrder.isPending}
                className="gap-2 bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0 h-12 px-8 disabled:opacity-50"
              >
                {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {!connected ? 'Connect Wallet' : createOrder.isPending ? 'Submitting...' : 'Submit Encrypted Order'}
              </Button>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed text-center mt-4">
              Orders remain encrypted until verified settlement.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Supply vs Demand — full width */}
      <GlassCard delay={0.2} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anonymized Supply vs Demand</span>
        </div>
        <div className="h-[280px]">
          {supplyDemand.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-[11px] text-white/20">Loading market depth...</p>
            </div>
          ) : (
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
          )}
        </div>
      </GlassCard>

      {/* Provider Quality + Recent Settlements — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.3} className="p-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">Provider Quality</span>
          <div className="grid grid-cols-2 gap-3">
            {product.benchmarks.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="p-4 rounded-xl bg-white/[0.03] text-center"
              >
                <b.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                <p className="font-mono text-sm font-semibold text-foreground tabular-nums">{b.value}</p>
                <p className="font-mono text-[9px] text-muted-foreground mt-1">{b.label}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.35} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent Settlements</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-400/70">Live</span>
            </div>
          </div>
          <div className="space-y-2">
            {settlements.length === 0 ? (
              <p className="font-mono text-[11px] text-white/20 text-center py-6">No recent settlements</p>
            ) : settlements.map((s: any, i: number) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.04] transition-all"
              >
                <span className="font-mono text-[11px] text-primary/60">{s.id}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{s.qty}</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-400 tabular-nums">{s.price}</span>
                <span className="font-mono text-[10px] text-muted-foreground/50">{s.time}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Privacy & Fair Execution — full width */}
      <GlassCard delay={0.4} className="p-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">Privacy & Fair Execution</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              className="p-4 rounded-xl bg-white/[0.03]"
            >
              <item.icon className="w-5 h-5 text-primary mb-4" />
              <h4 className="text-sm font-medium text-foreground mb-2">{item.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProductDetail;
