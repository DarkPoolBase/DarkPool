import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion } from "framer-motion";
import { ease, pageHeader } from "@/lib/animations";

const gpuTypes = [
  { id: "h100", name: "H100 NVIDIA 80GB", price: "$0.21", providers: 47, utilization: 72 },
  { id: "a100", name: "A100 NVIDIA 80GB", price: "$0.15", providers: 89, utilization: 58 },
  { id: "rtx4090", name: "RTX 4090 24GB", price: "$0.08", providers: 234, utilization: 41 },
  { id: "rtx3090", name: "RTX 3090 24GB", price: "$0.05", providers: 156, utilization: 33 },
];

const Marketplace = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState([24]);
  const [price, setPrice] = useState("0.25");
  const [selectedGpu, setSelectedGpu] = useState("h100");

  const estTotal = (quantity[0] * parseFloat(price)).toFixed(2);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <motion.div {...pageHeader}>
        <h1 className="text-2xl font-semibold text-gradient">Marketplace</h1>
        <p className="text-sm text-white/40 mt-1">Place buy/sell orders and view market conditions</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-4">
          <GlassCard gradient delay={0.08} className="p-6 space-y-5">
            {/* Buy/Sell Toggle */}
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
                className={`flex-1 py-2.5 text-sm font-bold tracking-wider relative z-10 transition-colors ${
                  side === "buy" ? "text-success" : "text-white/40"
                }`}
                onClick={() => setSide("buy")}
              >
                BUY
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-bold tracking-wider relative z-10 transition-colors ${
                  side === "sell" ? "text-destructive" : "text-white/40"
                }`}
                onClick={() => setSide("sell")}
              >
                SELL
              </button>
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
                  <button
                    key={v}
                    onClick={() => setQuantity([v])}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all duration-300 ${
                      quantity[0] === v
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60"
                    }`}
                  >
                    {v}hr
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>{side === "buy" ? "Max Price" : "Min Price"} (USDC / GPU-hour)</SectionLabel>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
                type="number"
                step="0.01"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Est. Total</span>
              <span className="font-mono text-lg font-semibold">${estTotal} <span className="text-xs text-white/40">USDC</span></span>
            </div>

            <Button className="w-full gap-2 bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0 h-11">
              <Lock className="h-4 w-4" />
              Submit Encrypted Order
            </Button>

            <AuctionTimer />
          </GlassCard>
        </div>

        {/* Market Depth */}
        <div className="lg:col-span-5">
          <GlassCard delay={0.16} corners className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Market Depth (Anonymized)</SectionLabel>
              <span className="font-mono text-[10px] text-white/30 tracking-wider">H100 / USDC</span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <div className="w-full space-y-2">
                <p className="font-mono text-[10px] text-white/30 text-center mb-4 uppercase tracking-[0.2em]">Sell Asks ▲</p>
                {[60, 75, 90, 100].map((w, i) => (
                  <div key={i} className="flex justify-center">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${w}%` }}
                      transition={{ duration: 0.8, delay: 0.24 + i * 0.08, ease }}
                      className="h-7 rounded-md bg-gradient-to-r from-destructive/30 to-destructive/10 hover:from-destructive/40 hover:to-destructive/20 transition-colors duration-300 cursor-crosshair"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-warning/50" />
                  <span className="font-mono text-xs text-warning font-medium">$0.23 Clearing</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-warning/50" />
                </div>
                {[100, 85, 70, 50].map((w, i) => (
                  <div key={i} className="flex justify-center">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${w}%` }}
                      transition={{ duration: 0.8, delay: 0.56 + i * 0.08, ease }}
                      className="h-7 rounded-md bg-gradient-to-r from-success/30 to-success/10 hover:from-success/40 hover:to-success/20 transition-colors duration-300 cursor-crosshair"
                    />
                  </div>
                ))}
                <p className="font-mono text-[10px] text-white/30 text-center mt-4 uppercase tracking-[0.2em]">Buy Bids ▼</p>
                <div className="flex justify-between font-mono text-[10px] text-white/20 mt-2 px-4">
                  <span>$0.15</span><span>$0.20</span><span>$0.25</span><span>$0.30</span><span>$0.35</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* GPU Overview */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease }}
          >
            <SectionLabel className="mb-2">Available GPU Types</SectionLabel>
          </motion.div>
          {gpuTypes.map((gpu, i) => (
            <GlassCard key={gpu.id} delay={0.32 + i * 0.08} className="p-4 space-y-3 hover:border-white/[0.12] transition-all duration-300 group">
              <h4 className="text-sm font-medium text-white/80">{gpu.name}</h4>
              <div className="flex justify-between font-mono text-[10px] text-white/40">
                <span>Est: <span className="text-white/70">{gpu.price}/hr</span></span>
                <span>{gpu.providers} providers</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-white/30">
                  <span>Utilization</span>
                  <span>{gpu.utilization}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gpu.utilization}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(258,78%,70%)]"
                  />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
