import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Trash2, Eye, EyeOff, Shield, Key } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useState } from "react";

const ApiKeyRow = ({ label, prefix, env, active }: { label: string; prefix: string; env: string; active: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const maskedKey = `${prefix}${"•".repeat(28)}`;
  const fullKey = `${prefix}a1b2c3d4e5f6g7h8i9j0k1l2m3n4`;

  return (
    <div className="group rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">{label}</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
            env === "LIVE" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            {env}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="h-7 w-7 p-0 text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/30 hover:text-destructive/70 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Key value */}
      <div className="px-4 pb-3">
        <div className="font-mono text-[13px] text-white/40 select-all bg-white/[0.02] rounded-md px-3 py-2 border border-white/[0.04] overflow-hidden text-ellipsis whitespace-nowrap">
          {revealed ? fullKey : maskedKey}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-8 max-w-[1200px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Manage your wallet, API keys, and notifications</p>
      </div>

      {/* Wallet */}
      <GlassCard delay={0.1} className="p-6 space-y-6">
        <SectionLabel>Connected Wallet</SectionLabel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(258,78%,70%)] flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold">0x</span>
            </div>
            <span className="font-mono text-sm text-white/60">0x7a3b...f82c</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-[10px] font-mono border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Disconnect</Button>
            <Button variant="outline" size="sm" className="text-[10px] font-mono border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">Change Wallet</Button>
          </div>
        </div>
      </GlassCard>

      {/* API Keys */}
      <GlassCard delay={0.2} gradient className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <SectionLabel>API Keys</SectionLabel>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">Encrypted</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: "Production", prefix: "sk_live_", env: "LIVE", active: true },
            { label: "Test", prefix: "sk_test_", env: "TEST", active: true },
          ].map((item) => (
            <ApiKeyRow key={item.label} {...item} />
          ))}
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] font-mono uppercase tracking-[0.15em] h-9 border-dashed border-white/[0.08] bg-transparent hover:bg-white/[0.03] text-white/40 hover:text-white/60 transition-all duration-300"
          >
            <Key className="h-3.5 w-3.5 mr-2" />
            Generate New Key
          </Button>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard delay={0.3} className="p-6 space-y-6">
        <SectionLabel>Notification Preferences</SectionLabel>
        {[
          { label: "Order filled", defaultChecked: true },
          { label: "Batch settlements", defaultChecked: true },
          { label: "Price alerts", defaultChecked: false },
          { label: "Provider earnings", defaultChecked: true },
          { label: "Marketing updates", defaultChecked: false },
        ].map((pref) => (
          <div key={pref.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-white/60">{pref.label}</span>
            <Switch defaultChecked={pref.defaultChecked} />
          </div>
        ))}
      </GlassCard>
    </div>
  );
};

export default SettingsPage;
