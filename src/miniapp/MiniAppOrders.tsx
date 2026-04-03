import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useOrders, useCancelOrder, useOrderFulfillment } from '@/hooks/useOrders';
import { useMiniAppAuth } from './useMiniAppAuth';
import { toast } from 'sonner';

type StatusFilter = 'ALL' | 'ACTIVE' | 'FILLED' | 'CANCELLED' | 'EXPIRED';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  FILLED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  CANCELLED: 'bg-white/5 text-white/30 border-white/10',
  EXPIRED: 'bg-white/5 text-white/30 border-white/10',
};

function FulfillmentInfo({ orderId }: { orderId: string }) {
  const { data, isLoading } = useOrderFulfillment(orderId);

  if (isLoading || !data || data.status === 'PENDING' || data.status === 'PROVISIONING') {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        <span className="font-mono text-[10px] text-amber-400">Provisioning GPU...</span>
      </div>
    );
  }

  if (data.status === 'RUNNING') {
    return (
      <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="font-mono text-[10px] text-emerald-400 mb-1">GPU Ready</p>
        <code className="font-mono text-[10px] text-white/60 bg-black/30 px-2 py-1 rounded block break-all">
          {data.connectionString}
        </code>
      </div>
    );
  }

  if (data.status === 'FAILED') {
    return (
      <div className="mt-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
        <p className="font-mono text-[10px] text-rose-400">Provisioning failed</p>
      </div>
    );
  }

  if (data.status === 'TERMINATED') {
    return (
      <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="font-mono text-[10px] text-white/30">Instance expired</p>
      </div>
    );
  }

  return null;
}

export function MiniAppOrders() {
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isAuthenticated, loading } = useMiniAppAuth();
  const cancelOrder = useCancelOrder();

  const { data: apiOrders } = useOrders(
    { status: filter === 'ALL' ? undefined : filter },
    isAuthenticated,
  );

  const orders = (apiOrders?.data || []).map((o) => ({
    id: o.id.slice(0, 8),
    fullId: o.id,
    side: o.side,
    gpu: o.gpuType,
    duration: `${o.duration}h`,
    price: `$${parseFloat(o.pricePerHour).toFixed(2)}`,
    status: o.status as 'ACTIVE' | 'FILLED' | 'CANCELLED' | 'EXPIRED',
    time: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clearing: o.clearingPrice ? `$${parseFloat(o.clearingPrice).toFixed(2)}` : null,
    escrow: o.escrowAmount ? `$${parseFloat(o.escrowAmount).toFixed(2)}` : null,
    batchId: o.batchId,
  }));

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('Order cancelled');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel';
      toast.error(msg);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 text-primary animate-spin mb-3" />
            <p className="font-mono text-xs text-white/30">Connecting wallet...</p>
          </>
        ) : (
          <>
            <p className="font-mono text-sm text-white/30 mb-2">Authenticating...</p>
            <p className="font-mono text-[10px] text-white/15">
              Connecting your Farcaster wallet
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-[10px] font-mono rounded-lg border whitespace-nowrap transition-colors ${
              filter === s
                ? 'text-primary border-primary/30 bg-primary/10'
                : 'text-white/30 border-white/[0.06] bg-white/[0.02]'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-xs text-white/20 mb-1">No orders found</p>
            <p className="font-mono text-[10px] text-white/10">
              Place an order from the Market tab
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="w-full text-left p-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedId === order.id ? (
                    <ChevronDown className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${order.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {order.side}
                        </span>
                        <span className="text-xs text-white/70">{order.gpu}</span>
                        <span className="font-mono text-[10px] text-white/30">{order.duration}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-[10px] text-white/30">{order.id}</span>
                      <span className="font-mono text-xs text-white/60">{order.price}/hr</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === order.id && (
                <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-white/25">Date</span>
                    <span className="text-white/50">{order.time}</span>
                  </div>
                  {order.clearing && (
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-white/25">Clearing</span>
                      <span className="text-white/50">{order.clearing}/hr</span>
                    </div>
                  )}
                  {order.escrow && (
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-white/25">Escrow</span>
                      <span className="text-white/50">{order.escrow} USDC</span>
                    </div>
                  )}
                  {order.batchId && (
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-white/25">Batch</span>
                      <span className="text-primary/60">#{order.batchId}</span>
                    </div>
                  )}

                  {/* Fulfillment panel for filled BUY orders */}
                  {order.status === 'FILLED' && order.side === 'BUY' && (
                    <FulfillmentInfo orderId={order.fullId} />
                  )}

                  {/* Cancel button for active orders */}
                  {order.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCancel(order.fullId)}
                      className="w-full mt-2 py-2 rounded-lg text-[10px] font-mono text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
