/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion, AnimatePresence } from "framer-motion";
import { useOrders, useOrderStats, useCancelOrder, useOrderFulfillment } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { toast } from "sonner";

function FulfillmentPanel({ orderId }: { orderId: string }) {
  const { data, isLoading } = useOrderFulfillment(orderId);

  if (isLoading || !data || data.status === 'PENDING' || data.status === 'PROVISIONING') {
    return (
      <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
        <p className="font-mono text-xs text-amber-400">Provisioning GPU instance...</p>
      </div>
    );
  }

  if (data.status === 'RUNNING') {
    return (
      <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <p className="font-mono text-xs text-emerald-400 mb-2">GPU Ready — SSH Access</p>
        <code className="font-mono text-xs text-white/70 bg-black/30 px-3 py-2 rounded block">
          {data.connectionString}
        </code>
        <p className="font-mono text-[10px] text-white/30 mt-2">
          Expires: {new Date(data.expiresAt!).toLocaleString()}
        </p>
      </div>
    );
  }

  if (data.status === 'TERMINATED') {
    return (
      <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="font-mono text-xs text-white/30">Instance expired</p>
      </div>
    );
  }

  if (data.status === 'FAILED') {
    return (
      <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
        <p className="font-mono text-xs text-destructive/70">Provisioning failed — contact support</p>
      </div>
    );
  }

  return null;
}


type StatusFilter = "ALL" | "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED";

const Orders = () => {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isAuthenticated } = useAutoAuth();
  const cancelOrder = useCancelOrder();

  // Fetch real orders from API
  const { data: apiOrders } = useOrders(
    { status: filter === "ALL" ? undefined : filter },
    isAuthenticated,
  );
  const { data: stats } = useOrderStats(isAuthenticated);

  // Map API orders to display format
  const orders = (apiOrders?.data || []).map((o) => ({
    id: o.id.slice(0, 8),
    fullId: o.id,
    side: o.side,
    gpu: o.gpuType,
    qty: `${o.duration} hrs`,
    price: `$${parseFloat(o.pricePerHour).toFixed(2)}`,
    status: o.status as "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED",
    submitted: new Date(o.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC',
    ...(o.clearingPrice && { clearing: `$${parseFloat(o.clearingPrice).toFixed(2)}/GPU-hr` }),
    ...(o.escrowAmount && { total: `$${parseFloat(o.escrowAmount).toFixed(2)} USDC` }),
    ...(o.txHash && { tx: o.txHash.slice(0, 6) + '...' + o.txHash.slice(-4) }),
    ...(o.batchId && { filled: `Batch #${o.batchId}` }),
  }));

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts = stats ?? {
    ACTIVE: orders.filter((o) => o.status === "ACTIVE").length,
    FILLED: orders.filter((o) => o.status === "FILLED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    EXPIRED: orders.filter((o) => o.status === "EXPIRED").length,
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('Order cancelled');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Manage and review all your orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["ALL", "ACTIVE", "FILLED", "CANCELLED", "EXPIRED"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`relative px-4 py-2 text-[10px] font-mono tracking-wider uppercase rounded-xl border transition-all duration-300 ${
              filter === s
                ? "text-white border-primary/30 bg-primary/10 shadow-[0_0_15px_rgba(108,60,233,0.15)]"
                : "text-white/40 border-white/[0.06] hover:border-white/10 hover:text-white/60 bg-white/[0.02]"
            }`}
          >
            {s === "ALL" ? "All Orders" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== "ALL" && ` (${counts[s as keyof typeof counts] ?? 0})`}
          </button>
        ))}
      </div>

      <GlassCard delay={0.1} className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Order ID</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">GPU</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Qty</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Price</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <p className="font-mono text-sm text-white/20 mb-3">No orders found</p>
                  <p className="font-mono text-[11px] text-white/10">Place your first order on the Marketplace to get started</p>
                </TableCell>
              </TableRow>
            ) : filtered.map((order) => (
              <>
                <TableRow
                  key={order.id}
                  className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors duration-300"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <TableCell className="py-4">
                    {expandedId === order.id
                      ? <ChevronDown className="h-4 w-4 text-primary/60" />
                      : <ChevronRight className="h-4 w-4 text-white/20" />
                    }
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary py-4">{order.id}</TableCell>
                  <TableCell className="py-4">
                    <span className={`text-xs font-bold tracking-wider ${order.side === "BUY" ? "text-success" : "text-destructive"}`}>{order.side}</span>
                  </TableCell>
                  <TableCell className="text-sm text-white/70 py-4">{order.gpu}</TableCell>
                  <TableCell className="font-mono text-sm text-white/70 py-4">{order.qty}</TableCell>
                  <TableCell className="font-mono text-sm text-white/70 py-4">{order.price}</TableCell>
                  <TableCell className="py-4"><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell className="py-4">
                    {order.status === "ACTIVE" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50" onClick={(e) => { e.stopPropagation(); handleCancel(order.fullId); }}>Cancel</Button>
                      </div>
                    )}
                    {order.status === "FILLED" && (
                      <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Details</Button>
                    )}
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedId === order.id && (
                    <TableRow key={`${order.id}-detail`} className="border-white/[0.04]">
                      <TableCell colSpan={8} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 bg-primary/[0.02] border-l-2 border-l-primary/30 space-y-2">
                            {[
                              ["Submitted", order.submitted],
                              ["Status", order.status],
                              ...(order.filled ? [["Filled", order.filled]] : []),
                              ...(order.clearing ? [["Clearing Price", order.clearing]] : []),
                              ...(order.total ? [["Total Paid", order.total]] : []),
                            ].map(([label, val]) => (
                              <p key={label} className="flex gap-4 text-xs">
                                <span className="text-white/30 w-32 shrink-0">{label}</span>
                                <span className="font-mono text-white/60">{val}</span>
                              </p>
                            ))}
                            {order.tx && (
                              <p className="flex gap-4 text-xs">
                                <span className="text-white/30 w-32 shrink-0">Transaction</span>
                                <span className="font-mono text-primary">{order.tx}</span>
                              </p>
                            )}
                            {order.status === "FILLED" && <FulfillmentPanel orderId={order.fullId} />}
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
};

export default Orders;

