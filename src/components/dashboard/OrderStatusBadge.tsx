import { cn } from "@/lib/utils";

type Status = "FILLED" | "ACTIVE" | "PENDING" | "CANCELLED" | "EXPIRED";

const statusStyles: Record<Status, { className: string; label: string }> = {
  FILLED: {
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Filled",
  },
  ACTIVE: {
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    label: "Active",
  },
  PENDING: {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    label: "Pending",
  },
  CANCELLED: {
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    label: "Cancelled",
  },
  EXPIRED: {
    className: "bg-white/5 text-white/40 border-white/10",
    label: "Expired",
  },
};

export function OrderStatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border tracking-wide tabular-nums",
      s.className
    )}>
      <span className={cn(
        "w-1 h-1 rounded-full",
        status === "FILLED" && "bg-emerald-400",
        status === "ACTIVE" && "bg-violet-400",
        status === "PENDING" && "bg-amber-400",
        status === "CANCELLED" && "bg-rose-400",
        status === "EXPIRED" && "bg-white/30",
      )} />
      {s.label}
    </span>
  );
}
