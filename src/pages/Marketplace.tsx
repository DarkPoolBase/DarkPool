import { useState } from "react";
import { Lock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { Progress } from "@/components/ui/progress";

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
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Place buy/sell orders and view market conditions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-4 rounded-lg border border-border bg-card p-5 space-y-5">
          {/* Buy/Sell Toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                side === "buy" ? "bg-success/15 text-success" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSide("buy")}
            >
              BUY
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                side === "sell" ? "bg-destructive/15 text-destructive" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSide("sell")}
            >
              SELL
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">GPU Type</label>
            <Select value={selectedGpu} onValueChange={setSelectedGpu}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {gpuTypes.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Quantity (GPU-hours): {quantity[0]}</label>
            <Slider value={quantity} onValueChange={setQuantity} min={1} max={168} step={1} />
            <div className="flex gap-1.5 mt-2">
              {[24, 48, 72, 168].map((v) => (
                <button
                  key={v}
                  onClick={() => setQuantity([v])}
                  className="text-xs px-2 py-1 rounded border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {v}hr
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {side === "buy" ? "Max Price" : "Min Price"} (USDC / GPU-hour)
            </label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
              type="number"
              step="0.01"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Est. Total</span>
            <span className="font-mono font-semibold">${estTotal} USDC</span>
          </div>

          <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
            <Lock className="h-4 w-4" />
            Submit Encrypted Order
          </Button>

          <AuctionTimer />
        </div>

        {/* Market Depth Placeholder */}
        <div className="lg:col-span-5 rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Market Depth (Anonymized)</h3>
            <span className="text-xs text-muted-foreground font-mono">H100 / USDC</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="w-full space-y-2">
              {/* Simplified depth visualization */}
              <p className="text-xs text-muted-foreground text-center mb-4">SELL ASKS ▲</p>
              {[60, 75, 90, 100].map((w, i) => (
                <div key={i} className="flex justify-center">
                  <div className="h-6 rounded-sm bg-destructive/20 transition-all" style={{ width: `${w}%` }} />
                </div>
              ))}
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-warning/50" />
                <span className="text-xs font-mono text-warning">$0.23 Clearing</span>
                <div className="flex-1 h-px bg-warning/50" />
              </div>
              {[100, 85, 70, 50].map((w, i) => (
                <div key={i} className="flex justify-center">
                  <div className="h-6 rounded-sm bg-success/20 transition-all" style={{ width: `${w}%` }} />
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center mt-4">BUY BIDS ▼</p>
              <div className="flex justify-between text-xs text-muted-foreground font-mono mt-2 px-4">
                <span>$0.15</span><span>$0.20</span><span>$0.25</span><span>$0.30</span><span>$0.35</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPU Overview */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-medium">Available GPU Types</h3>
          {gpuTypes.map((gpu) => (
            <div key={gpu.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h4 className="text-sm font-medium">{gpu.name}</h4>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Est. Price: <span className="text-foreground font-mono">{gpu.price}/hr</span></span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Providers: {gpu.providers}</span>
                <span>Utilization: {gpu.utilization}%</span>
              </div>
              <Progress value={gpu.utilization} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
