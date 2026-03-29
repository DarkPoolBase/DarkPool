import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Trash2, Eye, EyeOff, Shield, Key } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useState } from "react";

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
