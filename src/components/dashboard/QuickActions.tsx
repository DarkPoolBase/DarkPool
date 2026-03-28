import { Plus, BarChart3, Key, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Buy Order", icon: Plus, accent: "emerald", route: "/marketplace" },
    { label: "Sell Order", icon: ArrowUpRight, accent: "rose", route: "/marketplace" },
    { label: "View Market", icon: BarChart3, accent: "violet", route: "/analytics" },
    { label: "API Keys", icon: Key, accent: "fuchsia", route: "/settings" },
  ];

  const accentMap: Record<string, string> = {
    emerald: "hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]",
    rose: "hover:border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
    violet: "hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
    fuchsia: "hover:border-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)]",
  };

  const iconColorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    violet: "text-violet-400",
    fuchsia: "text-fuchsia-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4 block">Quick Actions</span>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md transition-all duration-300 ease-out text-left group ${accentMap[action.accent]}`}
            >
              <action.icon className={`h-4 w-4 ${iconColorMap[action.accent]} transition-transform duration-300 group-hover:scale-110`} />
              <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors duration-300 font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
