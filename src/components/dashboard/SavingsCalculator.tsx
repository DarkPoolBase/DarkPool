import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";

const PRICES = {
  H100:    { market: 6.00, dp: 0.85, sell: 0.70 },
  A100:    { market: 3.50, dp: 0.45, sell: 0.35 },
  RTX4090: { market: 1.50, dp: 0.20, sell: 0.15 },
} as const;

type GPU = keyof typeof PRICES;

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function SavingsCalculator() {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [gpu, setGpu] = useState<GPU>("H100");
  const [hours, setHours] = useState(500);

  const p = PRICES[gpu];

  const stats = useMemo(() => {
    if (mode === "buy") {
      const awsCost = hours * p.market;
      const dpCost = hours * p.dp;
      const saved = awsCost - dpCost;
      const pct = Math.round((saved / awsCost) * 100);
      return { awsCost, dpCost, saved, pct, barMarketH: 80, barDpH: Math.round((dpCost / awsCost) * 80) };
    } else {
      const revenue = hours * p.sell;
      const annual = revenue * 12;
      return { revenue, annual, barMarketH: 30, barDpH: 80 };
    }
  }, [mode, gpu, hours, p]);

  return (
    <GlassCard delay={0.1} className="p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">
            Compute Savings
          </span>
          <h3 className="text-xl font-thin tracking-tight text-white">See What You'd Save</h3>
          <p className="text-xs text-white/30 mt-1 font-mono">
            Compare your current GPU costs against dark pool batch auction pricing.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          {/* Buy/Sell toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg shrink-0 h-10 items-center">
            <button
              onClick={() => setMode("buy")}
              className={`px-3 h-8 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 ${
                mode === "buy"
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-white/30 hover:text-white/50 border border-transparent"
              }`}
            >
              I Buy Compute
            </button>
            <button
              onClick={() => setMode("sell")}
              className={`px-3 h-8 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all duration-300 ${
                mode === "sell"
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-white/30 hover:text-white/50 border border-transparent"
              }`}
            >
              I Sell Compute
            </button>
          </div>

          {/* GPU Type */}
          <div className="flex flex-col gap-1 shrink-0">
            <label className="font-mono text-[9px] text-white/30 uppercase tracking-widest">GPU Type</label>
            <select
              value={gpu}
              onChange={(e) => setGpu(e.target.value as GPU)}
              className="bg-black/30 border border-white/[0.08] rounded-lg px-3 h-10 text-xs text-white/80 font-mono focus:border-violet-500/50 focus:outline-none transition-colors appearance-none cursor-pointer pr-8"
              style={{
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>')`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              <option value="H100">H100</option>
              <option value="A100">A100</option>
              <option value="RTX4090">RTX 4090</option>
            </select>
          </div>

          {/* Hours slider */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <label className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Monthly GPU Hours</label>
              <span className="font-mono text-[10px] text-violet-400">{hours.toLocaleString()}</span>
            </div>
            <div className="flex items-center h-10">
              <input
                type="range"
                min={100}
                max={10000}
                step={50}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-violet-500"
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-white/15">
              <span>100</span>
              <span>10,000</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mode === "buy" ? (
            <>
              <Stat label="AWS Cost" value={fmt(stats.awsCost!)} color="text-white/70" />
              <Stat label="Dark Pool Est." value={fmt(stats.dpCost!)} color="text-emerald-400" />
              <Stat label="You Save" value={`${fmt(stats.saved!)} (${stats.pct}%)`} color="text-emerald-400" bold />
              <Stat label="Cost Per Hour" value={`$${p.dp.toFixed(2)}`} color="text-violet-400" />
            </>
          ) : (
            <>
              <Stat label="Idle GPU Revenue" value={fmt(stats.revenue!)} color="text-emerald-400" />
              <Stat label="Monthly Earnings" value={fmt(stats.revenue!)} color="text-emerald-400" />
              <Stat label="Annual Projection" value={fmt(stats.annual!)} color="text-violet-400" />
              <Stat label="Network Demand" value="HIGH" color="text-emerald-400" pulse />
            </>
          )}
        </div>

        {/* Bar chart */}
        <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/[0.04] bg-black/40">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center px-12 pb-12 pt-6">
            <div className="flex items-end justify-center gap-10 w-full max-w-[260px] h-full">
              {/* Market bar */}
              <div className="flex flex-col items-center w-20 h-full">
                <span className="font-mono text-[10px] text-white/40 mb-2">
                  {mode === "buy" ? fmt(stats.awsCost!) : "Idle"}
                </span>
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-700 ease-out"
                    style={{
                      height: `${stats.barMarketH}%`,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider mt-2">
                  {mode === "buy" ? "AWS / Market" : "Without DP"}
                </span>
              </div>
              {/* DP bar */}
              <div className="flex flex-col items-center w-20 h-full">
                <span className="font-mono text-[10px] text-violet-400 mb-2">
                  {mode === "buy" ? fmt(stats.dpCost!) : `${fmt(stats.revenue!)}/mo`}
                </span>
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-700 ease-out"
                    style={{
                      height: `${stats.barDpH}%`,
                      background: "linear-gradient(180deg, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0.2) 100%)",
                      border: "1px solid rgba(139,92,246,0.3)",
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] text-violet-400/60 uppercase tracking-wider mt-2">Dark Pool</span>
              </div>
            </div>
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 font-mono text-[8px] text-white/10 uppercase tracking-widest whitespace-nowrap">
            Monthly Cost (USD)
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-white/15 uppercase tracking-widest">
            {gpu === "RTX4090" ? "RTX 4090" : gpu}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({
  label,
  value,
  color,
  bold,
  pulse,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{label}</span>
      <div className="flex items-center gap-2">
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
        <span className={`font-mono text-lg tracking-tight ${color} ${bold ? "font-medium" : "font-light"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
