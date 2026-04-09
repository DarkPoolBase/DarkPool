import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, TrendingUp, CheckCircle, DollarSign, Cpu, Code2, Copy, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { api } from "@/lib/api";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useApiKeys } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AgentActivity {
  totalOrders: number;
  filledOrders: number;
  fillRate: number;
  totalUsdcSpent: string;
  mostUsedGpuType: string | null;
  avgFillTimeHours: number;
  recentOrders: Array<{
    id: string;
    gpuType: string;
    quantity: number;
    pricePerHour: string;
    duration: number;
    status: string;
    escrowAmount: string;
    createdAt: string;
  }>;
}

function useAgentActivity(enabled: boolean) {
  return useQuery<AgentActivity>({
    queryKey: ["agents", "activity"],
    queryFn: () => api.get<AgentActivity>("/api/agents/activity"),
    enabled,
    refetchInterval: 30_000,
    placeholderData: {
      totalOrders: 0,
      filledOrders: 0,
      fillRate: 0,
      totalUsdcSpent: "0.00",
      mostUsedGpuType: null,
      avgFillTimeHours: 0,
      recentOrders: [],
    },
  });
}

const codeSnippet = `const response = await fetch("https://api.darkpool.trade/api/agents/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
  },
  body: JSON.stringify({
    gpuType: "H100",
    quantity: 1,
    maxPrice: "3.00",
    duration: 4
  })
});

const { orderId, status } = await response.json();
console.log(\`Order \${orderId} submitted (\${status})\`);`;

export default function AgentDashboard() {
  const { isAuthenticated } = useAutoAuth();
  const { user } = useAuth();
  const { keys, fetchKeys } = useApiKeys();
  const { data } = useAgentActivity(isAuthenticated);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) fetchKeys();
  }, [user, fetchKeys]);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: "Total Agent Orders", value: String(data?.totalOrders ?? 0), icon: Bot, color: "text-violet-400" },
    { label: "Filled Orders", value: String(data?.filledOrders ?? 0), icon: CheckCircle, color: "text-emerald-400" },
    { label: "Fill Rate", value: `${data?.fillRate ?? 0}%`, icon: TrendingUp, color: "text-amber-400" },
    { label: "Total USDC Spent", value: `$${data?.totalUsdcSpent ?? "0.00"}`, icon: DollarSign, color: "text-white/70" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Agent Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Monitor your AI agent's autonomous GPU compute activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">{s.label}</span>
            </div>
            <p className={`font-mono text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most used GPU + API Keys */}
        <GlassCard delay={0.2} className="p-6 space-y-4">
          <SectionLabel>Agent Profile</SectionLabel>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[11px] text-white/30">Preferred GPU</span>
              <span className="font-mono text-xs text-white/70 flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-violet-400" />
                {data?.mostUsedGpuType ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[11px] text-white/30">Fill Rate</span>
              <span className="font-mono text-xs text-emerald-400">{data?.fillRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[11px] text-white/30">Active API Keys</span>
              <span className="font-mono text-xs text-white/70">{keys.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] text-white/30">Auth Method</span>
              <span className="font-mono text-xs text-violet-400">X-API-Key header</span>
            </div>
          </div>
        </GlassCard>

        {/* Recent agent orders */}
        <GlassCard delay={0.25} className="p-6">
          <SectionLabel className="mb-4">Recent Agent Orders</SectionLabel>
          {!data?.recentOrders?.length ? (
            <p className="font-mono text-[11px] text-white/20 py-4 text-center">No agent orders yet. Submit your first order below.</p>
          ) : (
            <div className="space-y-0 max-h-[240px] overflow-y-auto">
              {data.recentOrders.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div>
                    <span className="font-mono text-xs text-white/70">{o.gpuType}</span>
                    <span className="font-mono text-[10px] text-white/25 ml-2">{o.duration}h</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/40">${parseFloat(o.escrowAmount).toFixed(2)}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                      o.status === "FILLED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      o.status === "ACTIVE" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                      "bg-white/[0.05] text-white/30 border-white/[0.06]"
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Code snippet */}
      <GlassCard delay={0.3} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-violet-400" />
            <SectionLabel>Quick Start — Submit an Agent Order</SectionLabel>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all text-[10px] font-mono"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="bg-black/40 rounded-xl p-4 overflow-x-auto border border-white/[0.06]">
          <code className="font-mono text-[11px] text-white/60 leading-relaxed whitespace-pre">{codeSnippet}</code>
        </pre>
        <p className="font-mono text-[10px] text-white/25 mt-3">
          Get your API key from <a href="/settings" className="text-violet-400 hover:text-violet-300">Settings → API Keys</a>. Full docs at <a href="/api-docs" className="text-violet-400 hover:text-violet-300">API Docs</a>.
        </p>
      </GlassCard>
    </div>
  );
}
