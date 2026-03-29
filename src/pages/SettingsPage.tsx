import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

const SettingsPage = () => {
  return (
    <div className="space-y-8 max-w-[800px]">
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
        <SectionLabel>API Keys</SectionLabel>
        {[
          { label: "Production Key", key: "sk_live_****************************" },
          { label: "Test Key", key: "sk_test_****************************" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/[0.03] p-4 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">{item.label}</p>
            <p className="font-mono text-sm text-white/60 bg-white/[0.02] px-4 py-2 rounded-lg border border-white/[0.04]">{item.key}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-[10px] gap-2 h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50 transition-all duration-300">
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] gap-2 h-8 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50 transition-all duration-300">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] gap-2 h-8 border-destructive/20 bg-transparent hover:bg-destructive/10 text-destructive/70 transition-all duration-300">
                <Trash2 className="h-4 w-4" /> Revoke
              </Button>
            </div>
          </div>
        ))}
      </GlassCard>

      {/* Notifications */}
      <GlassCard delay={0.3} className="p-6 space-y-4">
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
