import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion } from "framer-motion";
import { pageHeader } from "@/lib/animations";

const SettingsPage = () => {
  return (
    <div className="space-y-8 max-w-[800px]">
      <motion.div {...pageHeader}>
        <h1 className="text-2xl font-semibold text-gradient">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage your wallet, API keys, and notifications</p>
      </motion.div>

      {/* Wallet */}
      <GlassCard delay={0.08} corners className="p-6 space-y-4">
        <SectionLabel>Connected Wallet</SectionLabel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
      <GlassCard delay={0.16} gradient className="p-6 space-y-5">
        <SectionLabel>API Keys</SectionLabel>
        {[
          { label: "Production Key", key: "sk_live_****************************" },
          { label: "Test Key", key: "sk_test_****************************" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">{item.label}</p>
            <p className="font-mono text-sm text-white/60 bg-white/[0.02] px-3 py-2 rounded-lg border border-white/[0.04]">{item.key}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="text-[10px] gap-1.5 h-7 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50 transition-all duration-300">
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] gap-1.5 h-7 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50 transition-all duration-300">
                <RefreshCw className="h-3 w-3" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] gap-1.5 h-7 border-destructive/20 bg-transparent hover:bg-destructive/10 text-destructive/70 transition-all duration-300">
                <Trash2 className="h-3 w-3" /> Revoke
              </Button>
            </div>
          </div>
        ))}
      </GlassCard>

      {/* Notifications */}
      <GlassCard delay={0.24} corners className="p-6 space-y-5">
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
