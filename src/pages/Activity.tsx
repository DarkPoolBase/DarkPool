import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle, XCircle, Layers, ExternalLink, Download } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import { useAutoAuth } from "@/hooks/useAutoAuth";

interface ActivityEvent {
  id: string;
  type: "deposit" | "withdrawal" | "order_filled" | "order_cancelled" | "settlement";
  title: string;
  description: string;
  amount: string | null;
  currency: string;
  txHash: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

function useActivity(enabled: boolean) {
  return useQuery<ActivityEvent[]>({
    queryKey: ["activity"],
    queryFn: () => api.get<ActivityEvent[]>("/api/activity"),
    enabled,
    refetchInterval: 30_000,
    placeholderData: [],
  });
}

const eventIcon: Record<ActivityEvent["type"], typeof CheckCircle> = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  order_filled: CheckCircle,
  order_cancelled: XCircle,
  settlement: Layers,
};

const eventColor: Record<ActivityEvent["type"], string> = {
  deposit: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  withdrawal: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  order_filled: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  order_cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
  settlement: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const amountColor: Record<ActivityEvent["type"], string> = {
  deposit: "text-emerald-400",
  withdrawal: "text-amber-400",
  order_filled: "text-red-400",
  order_cancelled: "text-emerald-400",
  settlement: "text-red-400",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default function Activity() {
  const { isAuthenticated } = useAutoAuth();
  const { data: events, isLoading } = useActivity(isAuthenticated);
  const [filter, setFilter] = useState<"ALL" | ActivityEvent["type"]>("ALL");

  const filtered = filter === "ALL" ? events ?? [] : (events ?? []).filter((e) => e.type === filter);

  const handleExport = () => {
    if (!events?.length) return;
    const rows = [
      ["Date", "Type", "Title", "Description", "Amount", "Currency", "Tx Hash"],
      ...events.map((e) => [
        new Date(e.timestamp).toISOString(),
        e.type,
        e.title,
        e.description,
        e.amount ?? "",
        e.currency,
        e.txHash ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darkpool-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Complete history of your wallet events on DarkPool</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!events?.length}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all text-[10px] font-mono disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "order_filled", "order_cancelled", "settlement"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded-xl border transition-all duration-300 ${
              filter === f
                ? "text-white border-primary/30 bg-primary/10"
                : "text-white/40 border-white/[0.06] hover:border-white/10 hover:text-white/60 bg-white/[0.02]"
            }`}
          >
            {f === "ALL" ? "All Events" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      <GlassCard delay={0.1} className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-sm text-white/20 mb-2">No activity yet</p>
            <p className="font-mono text-[11px] text-white/10">Your deposits, order fills, and settlements will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((event) => {
              const Icon = eventIcon[event.type];
              const colors = eventColor[event.type];
              const amtColor = amountColor[event.type];
              return (
                <div key={event.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colors}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/80 font-light">{event.title}</p>
                        <p className="font-mono text-[11px] text-white/30 mt-0.5 leading-relaxed">{event.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {event.amount && (
                          <p className={`font-mono text-sm font-medium ${amtColor}`}>
                            {event.amount} {event.currency}
                          </p>
                        )}
                        <p className="font-mono text-[10px] text-white/20 mt-0.5">{formatRelativeTime(event.timestamp)}</p>
                      </div>
                    </div>

                    {event.txHash && (
                      <a
                        href={`https://basescan.org/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 font-mono text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
