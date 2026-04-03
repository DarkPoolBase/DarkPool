import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Server, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketPrices, useMarketStats } from '@/hooks/useMarket';

const gpuMeta: Record<string, { name: string; vram: string; icon: typeof Cpu }> = {
  H100: { name: 'NVIDIA H100', vram: '80GB HBM3', icon: Cpu },
  A100: { name: 'NVIDIA A100', vram: '80GB HBM2e', icon: Server },
  L40S: { name: 'NVIDIA L40S', vram: '48GB GDDR6', icon: Cpu },
  H200: { name: 'NVIDIA H200', vram: '141GB HBM3e', icon: Cpu },
  A10G: { name: 'NVIDIA A10G', vram: '24GB GDDR6', icon: Zap },
};

export function MiniAppMarketplace() {
  const navigate = useNavigate();
  const { data: prices } = useMarketPrices();
  const { data: stats } = useMarketStats();
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null);

  const gpuList = useMemo(() => {
    if (!prices?.length) return [];
    return prices.map((p) => {
      const meta = gpuMeta[p.gpuType] || { name: p.gpuType, vram: '-', icon: Cpu };
      return { ...p, ...meta, priceNum: parseFloat(p.price) };
    });
  }, [prices]);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
        <span>{stats?.totalProviders ?? '-'} providers</span>
        <span className="text-white/10">|</span>
        <span>{stats?.totalTrades ?? '-'} trades/24h</span>
        <span className="text-white/10">|</span>
        <span>${stats?.totalVolume24h ? Number(stats.totalVolume24h).toLocaleString() : '-'} vol</span>
      </div>

      {/* GPU List */}
      <div className="space-y-2">
        {gpuList.map((gpu) => {
          const Icon = gpu.icon;
          const isUp = gpu.change24h > 0;
          const isDown = gpu.change24h < 0;
          const ChangeIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

          return (
            <button
              key={gpu.gpuType}
              onClick={() => setSelectedGpu(selectedGpu === gpu.gpuType ? null : gpu.gpuType)}
              className="w-full text-left p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/[0.08] border border-primary/[0.12] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{gpu.name}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      ${gpu.priceNum.toFixed(2)}<span className="text-[10px] text-white/40">/hr</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-[10px] text-white/30">{gpu.vram}</span>
                    <span className={`flex items-center gap-0.5 font-mono text-[10px] ${
                      isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-white/30'
                    }`}>
                      <ChangeIcon className="w-3 h-3" />
                      {Math.abs(gpu.change24h).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded action buttons */}
              {selectedGpu === gpu.gpuType && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/marketplace/${gpu.gpuType.toLowerCase()}?side=buy`);
                    }}
                    className="flex-1 py-2 rounded-lg text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
                  >
                    Buy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/marketplace/${gpu.gpuType.toLowerCase()}?side=sell`);
                    }}
                    className="flex-1 py-2 rounded-lg text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    Sell
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {!gpuList.length && (
        <div className="text-center py-12">
          <p className="font-mono text-xs text-white/20">Loading market data...</p>
        </div>
      )}
    </div>
  );
}
