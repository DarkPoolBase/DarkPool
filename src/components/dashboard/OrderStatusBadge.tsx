import { cn } from "@/lib/utils";

type Status = "FILLED" | "ACTIVE" | "PENDING" | "CANCELLED" | "EXPIRED";

const statusStyles: Record<Status, { className: string; label: string }> = {
  FILLED: {
    className: "bg-success/10 text-success border-success/20 shadow-[0_0_8px_rgba(34,197,94,0.15)]",
    label: "✅ Filled",
  },
  ACTIVE: {
    className: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_8px_rgba(108,60,233,0.15)]",
    label: "⏳ Active",
  },
  PENDING: {
    className: "bg-warning/10 text-warning border-warning/20 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse-glow",
    label: "⏳ Pending",
  },
  CANCELLED: {
    className: "bg-destructive/10 text-destructive border-destructive/20",
    label: "❌ Cancelled",
  },
  EXPIRED: {
    className: "bg-white/5 text-white/40 border-white/10",
    label: "⏰ Expired",
  },
};

export function OrderStatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border tracking-wide", s.className)}>
      {s.label}
    </span>
  );
}
