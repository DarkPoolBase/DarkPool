import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";

const orders = [
  { id: "#4521", side: "BUY", gpu: "H100", qty: "24 hrs", price: "$0.22", status: "FILLED" as const, time: "2 min ago" },
  { id: "#4520", side: "SELL", gpu: "RTX 4090", qty: "48 hrs", price: "$0.18", status: "ACTIVE" as const, time: "Waiting" },
  { id: "#4519", side: "BUY", gpu: "A100", qty: "72 hrs", price: "$0.19", status: "PENDING" as const, time: "5 min ago" },
  { id: "#4518", side: "BUY", gpu: "H100", qty: "12 hrs", price: "$0.24", status: "FILLED" as const, time: "32 min ago" },
  { id: "#4517", side: "SELL", gpu: "A100", qty: "168 hrs", price: "$0.16", status: "FILLED" as const, time: "1 hr ago" },
];

export function OrderTable() {
  const navigate = useNavigate();

  return (
    <GlassCard delay={0.2}>
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Recent Orders</span>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="font-mono text-[10px] text-violet-400/70 hover:text-violet-400 tracking-wider uppercase transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 backdrop-blur-md"
        >
          View All →
        </button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Order</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Side</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">GPU</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Qty</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Price</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 ease-out"
                onClick={() => navigate("/orders")}
              >
                <TableCell className="font-mono text-sm text-violet-400 tabular-nums">{order.id}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-bold font-mono tracking-widest ${order.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                    {order.side}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-white/70 font-mono">{order.gpu}</TableCell>
                <TableCell className="font-mono text-sm text-white/60 tabular-nums">{order.qty}</TableCell>
                <TableCell className="font-mono text-sm text-white/60 tabular-nums">{order.price}</TableCell>
                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                <TableCell className="text-[11px] text-white/30 font-mono">{order.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}