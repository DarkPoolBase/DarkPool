import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

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
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage and review all your orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["ALL", "ACTIVE", "FILLED", "CANCELLED", "EXPIRED"] as StatusFilter[]).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All Orders" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== "ALL" && ` (${counts[s as keyof typeof counts]})`}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead className="text-xs text-muted-foreground">Order ID</TableHead>
              <TableHead className="text-xs text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs text-muted-foreground">GPU</TableHead>
              <TableHead className="text-xs text-muted-foreground">Qty</TableHead>
              <TableHead className="text-xs text-muted-foreground">Price</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <>
                <TableRow key={order.id} className="border-border hover:bg-secondary/50 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  <TableCell>
                    {expandedId === order.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary">{order.id}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${order.side === "BUY" ? "text-success" : "text-destructive"}`}>{order.side}</span>
                  </TableCell>
                  <TableCell className="text-sm">{order.gpu}</TableCell>
                  <TableCell className="text-sm font-mono">{order.qty}</TableCell>
                  <TableCell className="text-sm font-mono">{order.price}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell>
                    {order.status === "ACTIVE" && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-xs h-7">Cancel</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">Modify</Button>
                      </div>
                    )}
                    {order.status === "FILLED" && (
                      <Button variant="outline" size="sm" className="text-xs h-7">Details</Button>
                    )}
                  </TableCell>
                </TableRow>
                {expandedId === order.id && order.status === "FILLED" && (
                  <TableRow key={`${order.id}-detail`} className="border-border bg-secondary/30">
                    <TableCell colSpan={8}>
                      <div className="p-3 space-y-1 text-xs text-muted-foreground">
                        <p>Submitted: {order.submitted}</p>
                        <p>Filled: {order.filled}</p>
                        <p>Clearing Price: {order.clearing}</p>
                        <p>Total Paid: {order.total}</p>
                        <p>Transaction: <span className="font-mono text-primary">{order.tx}</span></p>
                        {order.access && <p>Compute Access: <span className="font-mono text-primary">{order.access}</span></p>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Orders;
