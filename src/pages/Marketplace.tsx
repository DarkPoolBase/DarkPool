import { useState, useEffect, useMemo } from "react";
import { Lock, Shield, Zap, Activity, Clock, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { motion, AnimatePresence } from "framer-motion";

const gpuTypes = [
  { id: "h100", name: "H100 80GB", price: 0.21, providers: 47, demand: 89, supply: 62 },
  { id: "a100", name: "A100 80GB", price: 0.15, providers: 89, demand: 72, supply: 78 },
  { id: "rtx4090", name: "RTX 4090 24GB", price: 0.08, providers: 234, demand: 55, supply: 91 },
  { id: "rtx3090", name: "RTX 3090 24GB", price: 0.05, providers: 156, demand: 38, supply: 85 },
];

const recentSettlements = [
  { id: "B-7842", gpuHours: 1248, price: "$0.228", time: "12s ago", type: "H100" },
  { id: "B-7841", gpuHours: 864, price: "$0.231", time: "42s ago", type: "H100" },
  { id: "B-7840", gpuHours: 2156, price: "$0.149", time: "1m ago", type: "A100" },
  { id: "B-7839", gpuHours: 512, price: "$0.078", time: "2m ago", type: "4090" },
  { id: "B-7838", gpuHours: 1920, price: "$0.227", time: "3m ago", type: "H100" },
];

const activeOrders = [
  { id: "ORD-9F2A", status: "queued", gpu: "H100", qty: 48, price: "$0.24" },
  { id: "ORD-3B7C", status: "matched", gpu: "A100", qty: 120, price: "$0.15" },
  { id: "ORD-8D1E", status: "partial", gpu: "H100", qty: 24, price: "$0.22" },
  { id: "ORD-5A4F", status: "settling", gpu: "4090", qty: 72, price: "$0.08" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-white/60", bg: "bg-white/[0.06]" },
  matched: { label: "Matched", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  partial: { label: "Partial Fill", color: "text-amber-400", bg: "bg-amber-400/10" },
  settling: { label: "Settling", color: "text-violet-400", bg: "bg-violet-400/10" },
  cancelled: { label: "Cancelled", color: "text-rose-400", bg: "bg-rose-400/10" },
};

const priceHistory = [0.218, 0.222, 0.219, 0.225, 0.221, 0.228, 0.224, 0.230, 0.226, 0.231, 0.228, 0.233];

const Marketplace = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState([24]);
  const [price, setPrice] = useState("0.25");
  const [selectedGpu, setSelectedGpu] = useState("h100");
  const [seconds, setSeconds] = useState(32);
  const [duration, setDuration] = useState("24");

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 45 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const estTotal = (quantity[0] * parseFloat(price || "0")).toFixed(2);
  const isUrgent = seconds <= 10;
  const progress = seconds / 45;

  const depthBars = useMemo(() => ({
    asks: [
      { price: "$0.28", width: 45, volume: "2.1K" },
      { price: "$0.26", width: 62, volume: "3.8K" },
      { price: "$0.25", width: 78, volume: "5.2K" },
      { price: "$0.24", width: 95, volume: "7.9K" },
    ],
    bids: [
      { price: "$0.23", width: 100, volume: "8.4K" },
      { price: "$0.22", width: 82, volume: "6.1K" },
      { price: "$0.21", width: 65, volume: "4.3K" },
      { price: "$0.19", width: 40, volume: "1.8K" },
    ],
  }), []);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gradient">Marketplace</h1>
          <p className="text-sm text-white/40 mt-1">Private execution with selective visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
            {isUrgent ? 'Batch Closing' : 'Accepting Orders'}
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* ─── 1. Encrypted Order Ticket (left, dominant) ─── */}
        <div className="col-span-12 lg:col-span-4 row-span-2">
          <GlassCard gradient delay={0.05} className="p-6 space-y-5 h-full">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-3.5 w-3.5 text-primary/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Encrypted Order</span>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="flex rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02] relative">
              <motion.div
                className="absolute inset-y-0 w-1/2 rounded-xl"
                animate={{ x: side === "sell" ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  background: side === "buy"
                    ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                    : "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))",
                }}
              />
              <button
                className={`flex-1 py-2.5 text-sm font-bold tracking-wider relative z-10 transition-colors ${side === "buy" ? "text-emerald-400" : "text-white/40"}`}
                onClick={() => setSide("buy")}
              >BUY</button>
              <button
                className={`flex-1 py-2.5 text-sm font-bold tracking-wider relative z-10 transition-colors ${side === "sell" ? "text-rose-400" : "text-white/40"}`}
                onClick={() => setSide("sell")}
              >SELL</button>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>GPU Type</SectionLabel>
              <Select value={selectedGpu} onValueChange={setSelectedGpu}>
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gpuTypes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Quantity (GPU-hours): <span className="text-white/70">{quantity[0]}</span></SectionLabel>
              <Slider value={quantity} onValueChange={setQuantity} min={1} max={168} step={1} />
              <div className="flex gap-1.5 mt-2">
                {[24, 48, 72, 168].map((v) => (
                  <button key={v} onClick={() => setQuantity([v])}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all duration-300 ${
                      quantity[0] === v ? "border-primary/40 text-primary bg-primary/10" : "border-white/[0.06] text-white/40 hover:border-white/10"
                    }`}>{v}hr</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Duration (hours)</SectionLabel>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)}
                className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors" type="number" step="1" />
            </div>

            <div className="space-y-1.5">
              <SectionLabel>{side === "buy" ? "Max Price" : "Min Price"} (USDC / GPU-hr)</SectionLabel>
              <Input value={price} onChange={(e) => setPrice(e.target.value)}
                className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors" type="number" step="0.01" />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Est. Total</span>
              <span className="font-mono text-lg font-semibold">${estTotal} <span className="text-xs text-white/40">USDC</span></span>
            </div>

            <Button className="w-full gap-2 bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0 h-11">
              <Lock className="h-4 w-4" />
              Submit Encrypted Order
            </Button>

            <p className="text-[10px] text-white/25 text-center leading-relaxed font-light">
              <Shield className="inline h-3 w-3 mr-1 -mt-0.5 text-primary/40" />
              Order details remain hidden until verified settlement.
            </p>
          </GlassCard>
        </div>

        {/* ─── 2. Auction Countdown ─── */}
        <div className="col-span-6 lg:col-span-4">
          <GlassCard delay={0.1} className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Batch Auction</span>
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider ${isUrgent ? 'bg-amber-400/10 text-amber-400' : 'bg-primary/10 text-primary'}`}>
                {isUrgent ? 'CLOSING' : 'CYCLE #7843'}
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r={28} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
                  <motion.circle cx="36" cy="36" r={28} fill="none"
                    stroke={isUrgent ? "rgb(245,158,11)" : "rgb(139,92,246)"}
                    strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress) }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <Clock className={`absolute inset-0 m-auto h-4 w-4 ${isUrgent ? "text-amber-400 animate-pulse" : "text-primary/60"}`} />
              </div>
              <div>
                <p className={`font-mono text-3xl font-semibold tracking-tight tabular-nums ${isUrgent ? "text-amber-400" : "text-white"}`}>
                  0:{String(seconds).padStart(2, "0")}
                </p>
                <p className="font-mono text-[9px] text-white/30 mt-1 uppercase tracking-wider">
                  {isUrgent ? "Closing imminently" : "Next batch clears in"}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between">
              <div>
                <p className="font-mono text-[9px] text-white/25 uppercase tracking-wider">Orders Queued</p>
                <p className="font-mono text-sm text-white/70">142</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] text-white/25 uppercase tracking-wider">Est. Volume</p>
                <p className="font-mono text-sm text-white/70">$34.2K</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ─── 3. Estimated Market Price ─── */}
        <div className="col-span-6 lg:col-span-4">
          <GlassCard delay={0.15} className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Clearing Price</span>
              <span className="font-mono text-[10px] text-white/20">H100</span>
            </div>
            <div className="flex items-end gap-3 mb-1">
              <span className="font-mono text-3xl font-semibold text-white tracking-tight">$0.228</span>
              <span className="font-mono text-xs text-emerald-400 flex items-center gap-0.5 mb-1">
                <ChevronUp className="h-3 w-3" />2.1%
              </span>
            </div>
            <p className="font-mono text-[10px] text-white/25 mb-4">Last: $0.223 · High: $0.241 · Low: $0.215</p>
            <div className="mt-auto">
              <SparklineChart data={priceHistory} color="rgb(139,92,246)" width={280} height={50} />
            </div>
          </GlassCard>
        </div>

        {/* ─── 4. Anonymized Market Depth (wide) ─── */}
        <div className="col-span-12 lg:col-span-5">
          <GlassCard delay={0.2} corners className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary/50" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Anonymized Depth</span>
              </div>
              <span className="font-mono text-[10px] text-white/20">H100 / USDC</span>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[9px] text-rose-400/60 text-right mb-1 uppercase tracking-wider">Sell Pressure</p>
              {depthBars.asks.map((bar, i) => (
                <div key={`ask-${i}`} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/30 w-10 text-right">{bar.price}</span>
                  <div className="flex-1 flex justify-end">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bar.width}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                      className="h-6 rounded-md bg-gradient-to-l from-rose-500/25 to-rose-500/5 hover:from-rose-500/35 transition-colors duration-300 cursor-crosshair flex items-center justify-end pr-2">
                      <span className="font-mono text-[9px] text-white/20">{bar.volume}</span>
                    </motion.div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 py-2">
                <span className="w-10" />
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-500/40" />
                  <span className="font-mono text-xs text-amber-400 font-medium whitespace-nowrap">$0.228</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/40" />
                </div>
              </div>

              {depthBars.bids.map((bar, i) => (
                <div key={`bid-${i}`} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/30 w-10 text-right">{bar.price}</span>
                  <div className="flex-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bar.width}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.08, ease: "easeOut" }}
                      className="h-6 rounded-md bg-gradient-to-r from-emerald-500/5 to-emerald-500/25 hover:to-emerald-500/35 transition-colors duration-300 cursor-crosshair flex items-center pl-2">
                      <span className="font-mono text-[9px] text-white/20">{bar.volume}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
              <p className="font-mono text-[9px] text-emerald-400/60 mb-1 uppercase tracking-wider">Buy Pressure</p>
            </div>

            <p className="font-mono text-[9px] text-white/15 mt-4 text-center">Aggregated · Individual orders not visible</p>
          </GlassCard>
        </div>

        {/* ─── 5. GPU Liquidity ─── */}
        <div className="col-span-12 lg:col-span-3">
          <GlassCard delay={0.25} className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-3.5 w-3.5 text-primary/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">GPU Liquidity</span>
            </div>
            <div className="space-y-3">
              {gpuTypes.map((gpu, i) => (
                <motion.div key={gpu.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="space-y-2 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/70">{gpu.name}</span>
                    <span className="font-mono text-[10px] text-white/40">${gpu.price.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${gpu.demand}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" />
                    </div>
                    <span className="font-mono text-[9px] text-white/25 w-6 text-right">{gpu.demand}%</span>
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-white/20">
                    <span>{gpu.providers} providers</span>
                    <span className={gpu.demand > gpu.supply ? "text-amber-400/60" : "text-emerald-400/60"}>
                      {gpu.demand > gpu.supply ? "High Demand" : "Available"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ─── 6. Recent Batch Settlements ─── */}
        <div className="col-span-12 lg:col-span-7">
          <GlassCard delay={0.3} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400/50" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Recent Settlements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[9px] text-white/25">LIVE</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-5 gap-2 font-mono text-[9px] text-white/20 uppercase tracking-wider pb-2 border-b border-white/[0.04]">
                <span>Batch</span><span>Type</span><span>GPU-Hours</span><span>Price</span><span className="text-right">Time</span>
              </div>
              {recentSettlements.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="grid grid-cols-5 gap-2 py-2 border-b border-white/[0.02] hover:bg-white/[0.02] rounded-lg px-1 transition-colors">
                  <span className="font-mono text-xs text-primary/70">{s.id}</span>
                  <span className="font-mono text-xs text-white/50">{s.type}</span>
                  <span className="font-mono text-xs text-white/60">{s.gpuHours.toLocaleString()}</span>
                  <span className="font-mono text-xs text-emerald-400/80">{s.price}</span>
                  <span className="font-mono text-xs text-white/25 text-right">{s.time}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ─── 7. Active Order Status ─── */}
        <div className="col-span-12 lg:col-span-5">
          <GlassCard delay={0.35} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Your Active Orders</span>
              <span className="font-mono text-[10px] text-white/20">{activeOrders.length} open</span>
            </div>
            <div className="space-y-2">
              {activeOrders.map((order, i) => {
                const st = statusConfig[order.status];
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary/60">{order.id}</span>
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-white/40">{order.gpu}</span>
                      <span className="font-mono text-[10px] text-white/50">{order.qty}hr</span>
                      <span className="font-mono text-xs text-white/60">{order.price}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
