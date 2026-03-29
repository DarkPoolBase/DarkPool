import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion, AnimatePresence } from "framer-motion";

const orders = [
  { id: "#4521", side: "BUY", gpu: "H100", qty: "24 hrs", price: "$0.22", status: "FILLED" as const, submitted: "Mar 26, 2026 14:32:15 UTC", filled: "Mar 26, 2026 14:33:00 UTC (Batch #4521)", clearing: "$0.21/GPU-hr", total: "$5.04 USDC", tx: "0x7a3b...f82c", access: "ssh://compute-xyz123.darkpool.io" },
  { id: "#4520", side: "BUY", gpu: "A100", qty: "48 hrs", price: "$0.18", status: "ACTIVE" as const, submitted: "Mar 26, 2026 13:15:00 UTC" },
  { id: "#4519", side: "BUY", gpu: "A100", qty: "72 hrs", price: "$0.19", status: "CANCELLED" as const, submitted: "Mar 26, 2026 12:00:00 UTC" },
  { id: "#4518", side: "SELL", gpu: "RTX 4090", qty: "24 hrs", price: "$0.09", status: "FILLED" as const, submitted: "Mar 25, 2026 22:00:00 UTC", filled: "Mar 25, 2026 22:01:00 UTC (Batch #4518)", clearing: "$0.08/GPU-hr", total: "$1.92 USDC", tx: "0x9c1a...d43e" },
  { id: "#4517", side: "SELL", gpu: "A100", qty: "168 hrs", price: "$0.16", status: "FILLED" as const, submitted: "Mar 25, 2026 18:30:00 UTC", filled: "Mar 25, 2026 18:31:00 UTC (Batch #4517)", clearing: "$0.16/GPU-hr", total: "$26.88 USDC", tx: "0x2f4d...a91b" },
  { id: "#4516", side: "BUY", gpu: "H100", qty: "48 hrs", price: "$0.30", status: "EXPIRED" as const, submitted: "Mar 25, 2026 10:00:00 UTC" },
];

type StatusFilter = "ALL" | "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED";

const Orders = () => {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts = {
    ACTIVE: orders.filter((o) => o.status === "ACTIVE").length,
    FILLED: orders.filter((o) => o.status === "FILLED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    EXPIRED: orders.filter((o) => o.status === "EXPIRED").length,
  };

  return (
    <div className="space-y-8 max-w-[1440px]">
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
            {s !== "ALL" && ` (${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      <GlassCard delay={0.1} corners className="overflow-hidden">
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
            {filtered.map((order) => (
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
                        <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Cancel</Button>
                        <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Modify</Button>
                      </div>
                    )}
                    {order.status === "FILLED" && (
                      <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Details</Button>
                    )}
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedId === order.id && order.status === "FILLED" && (
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
                              ["Filled", order.filled],
                              ["Clearing Price", order.clearing],
                              ["Total Paid", order.total],
                            ].map(([label, val]) => (
                              <p key={label} className="flex gap-4 text-xs">
                                <span className="text-white/30 w-32 shrink-0">{label}</span>
                                <span className="font-mono text-white/60">{val}</span>
                              </p>
                            ))}
                            <p className="flex gap-4 text-xs">
                              <span className="text-white/30 w-32 shrink-0">Transaction</span>
                              <span className="font-mono text-primary">{order.tx}</span>
                            </p>
                            {order.access && (
                              <p className="flex gap-4 text-xs">
                                <span className="text-white/30 w-32 shrink-0">Compute Access</span>
                                <span className="font-mono text-primary">{order.access}</span>
                              </p>
                            )}
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
