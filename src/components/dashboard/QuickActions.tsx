import { Plus, BarChart3, Key, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Buy Order", icon: Plus, accent: "emerald", route: "/marketplace" },
    { label: "Sell Order", icon: ArrowUpRight, accent: "rose", route: "/marketplace" },
    { label: "View Market", icon: BarChart3, accent: "violet", route: "/analytics" },
    { label: "API Keys", icon: Key, accent: "fuchsia", route: "/settings" },
  ];

  const iconColorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    violet: "text-violet-400",
    fuchsia: "text-fuchsia-400",
  };

  return (
    <GlassCard delay={0.35} className="p-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4 block">Quick Actions</span>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-all duration-300 ease-out text-left group hover:bg-white/[0.06] hover:border-white/[0.15]"
          >
            <action.icon className={`h-4 w-4 ${iconColorMap[action.accent]} transition-transform duration-300 group-hover:scale-110`} />
            <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors duration-300 font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}