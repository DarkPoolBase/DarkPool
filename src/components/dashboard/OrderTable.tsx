import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useNavigate } from "react-router-dom";

const orders = [
  { id: "#4521", side: "BUY", gpu: "H100", qty: "24 hrs", price: "$0.22", status: "FILLED" as const, time: "2 min ago" },
  { id: "#4520", side: "SELL", gpu: "RTX 4090", qty: "48 hrs", price: "$0.18", status: "ACTIVE" as const, time: "Waiting" },
  { id: "#4519", side: "BUY", gpu: "A100", qty: "72 hrs", price: "$0.19", status: "CANCELLED" as const, time: "1 hr ago" },
];

export function OrderTable() {
  const navigate = useNavigate();

  return (
    <GlassCard delay={0.2} corners className="overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-0">
        <SectionLabel>Recent Orders</SectionLabel>
        <button
          onClick={() => navigate("/orders")}
          className="font-mono text-[10px] text-primary/70 hover:text-primary tracking-wider uppercase transition-colors"
        >
          View All →
        </button>
      </div>
      <div className="p-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Order</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Side</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">GPU</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Qty</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Price</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-300 cursor-pointer">
                <TableCell className="font-mono text-sm text-primary">{order.id}</TableCell>
                <TableCell>
                  <span className={`text-xs font-bold tracking-wider ${order.side === "BUY" ? "text-success" : "text-destructive"}`}>
                    {order.side}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-white/70">{order.gpu}</TableCell>
                <TableCell className="font-mono text-sm text-white/70">{order.qty}</TableCell>
                <TableCell className="font-mono text-sm text-white/70">{order.price}</TableCell>
                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                <TableCell className="text-xs text-white/40">{order.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}
