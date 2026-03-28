import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatsCard({ icon: Icon, label, value, change, changeType = "neutral" }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold font-mono animate-count-up">{value}</span>
        {change && (
          <span
            className={`text-xs font-medium mb-0.5 ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
