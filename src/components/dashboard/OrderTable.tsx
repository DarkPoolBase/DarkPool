import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { useOrders } from "@/hooks/useOrders";
import { useAutoAuth } from "@/hooks/useAutoAuth";

export function OrderTable() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAutoAuth();
  const { data: apiOrders } = useOrders({ limit: 5 }, isAuthenticated);

  const orders = apiOrders?.data?.length
    ? apiOrders.data.map((o) => ({
        id: o.id.slice(0, 8),
        side: o.side,
        gpu: o.gpuType,
        qty: `${o.duration} hrs`,
        price: `$${parseFloat(o.pricePerHour).toFixed(2)}`,
        status: o.status as "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED" | "PENDING",
        time: new Date(o.createdAt).toLocaleTimeString(),
      }))
    : [];

  return (
    <GlassCard delay={0.2}>
      <div className="flex items-center justify-between p-4 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Recent Orders</span>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="font-mono text-[10px] text-violet-400/70 hover:text-violet-400 tracking-wider uppercase transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md"
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
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="font-mono text-[11px] text-white/20 mb-2">No orders yet</p>
                  <button
                    onClick={() => navigate("/marketplace")}
                    className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Place your first order →
                  </button>
                </TableCell>
              </TableRow>
            ) : orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 ease-out"
                onClick={() => navigate("/orders")}
              >
                <TableCell className="font-mono text-sm text-violet-400 tabular-nums py-4">{order.id}</TableCell>
                <TableCell className="py-4">
                  <span className={`text-[10px] font-bold font-mono tracking-widest ${order.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                    {order.side}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-white/70 font-mono py-4">{order.gpu}</TableCell>
                <TableCell className="font-mono text-sm text-white/60 tabular-nums py-4">{order.qty}</TableCell>
                <TableCell className="font-mono text-sm text-white/60 tabular-nums py-4">{order.price}</TableCell>
                <TableCell className="py-4"><OrderStatusBadge status={order.status} /></TableCell>
                <TableCell className="text-[11px] text-white/30 font-mono py-4">{order.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}
