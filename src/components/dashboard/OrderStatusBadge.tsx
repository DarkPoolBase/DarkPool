import { Badge } from "@/components/ui/badge";

type OrderStatus = "FILLED" | "PENDING" | "CANCELLED" | "EXPIRED" | "ACTIVE";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  FILLED: { label: "✅ Filled", className: "bg-success/15 text-success border-success/30" },
  PENDING: { label: "⏳ Pending", className: "bg-warning/15 text-warning border-warning/30 animate-pulse-glow" },
  ACTIVE: { label: "⏳ Active", className: "bg-warning/15 text-warning border-warning/30 animate-pulse-glow" },
  CANCELLED: { label: "❌ Cancelled", className: "bg-destructive/15 text-destructive border-destructive/30" },
  EXPIRED: { label: "⏰ Expired", className: "bg-muted-foreground/15 text-muted-foreground border-border" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
