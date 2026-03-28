import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";

const orders = [
  { id: "#4521", side: "BUY", gpu: "H100", qty: "24hr", price: "$0.22", status: "FILLED" as const, time: "2 min ago" },
  { id: "#4520", side: "SELL", gpu: "RTX 4090", qty: "48hr", price: "$0.18", status: "PENDING" as const, time: "Waiting" },
  { id: "#4519", side: "BUY", gpu: "A100", qty: "72hr", price: "$0.19", status: "CANCELLED" as const, time: "1 hr ago" },
  { id: "#4518", side: "BUY", gpu: "H100", qty: "24hr", price: "$0.21", status: "FILLED" as const, time: "3 hrs ago" },
  { id: "#4517", side: "SELL", gpu: "A100", qty: "168hr", price: "$0.16", status: "FILLED" as const, time: "5 hrs ago" },
];

export function OrderTable() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium">Recent Orders</h3>
        <a href="/orders" className="text-xs text-primary hover:underline">
          View All →
        </a>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">Order</TableHead>
              <TableHead className="text-xs text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs text-muted-foreground">GPU</TableHead>
              <TableHead className="text-xs text-muted-foreground">Qty</TableHead>
              <TableHead className="text-xs text-muted-foreground">Price</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground">Filled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-sm text-primary">{order.id}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-semibold ${
                      order.side === "BUY" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {order.side}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{order.gpu}</TableCell>
                <TableCell className="text-sm font-mono">{order.qty}</TableCell>
                <TableCell className="text-sm font-mono">{order.price}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{order.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
