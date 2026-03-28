import { Plus, BarChart3, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Buy Order", icon: Plus, color: "text-success border-success/20 hover:bg-success/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]", route: "/marketplace" },
    { label: "Sell Order", icon: Plus, color: "text-destructive border-destructive/20 hover:bg-destructive/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]", route: "/marketplace" },
    { label: "View Market", icon: BarChart3, color: "text-white/50 border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10", route: "/analytics" },
    { label: "API Keys", icon: Key, color: "text-white/50 border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10", route: "/settings" },
  ];

  return (
    <GlassCard delay={0.3} className="p-5">
      <SectionLabel className="mb-4">Quick Actions</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className={`justify-start gap-2 bg-transparent transition-all duration-300 ${action.color}`}
            onClick={() => navigate(action.route)}
          >
            <action.icon className="h-3.5 w-3.5" /> {action.label}
          </Button>
        ))}
      </div>
    </GlassCard>
  );
}
