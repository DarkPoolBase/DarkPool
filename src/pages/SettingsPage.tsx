import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Trash2, Eye, EyeOff, Shield, Key, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useState, useEffect, useRef } from "react";
import { useAuth, useApiKeys } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AVATAR_COLOR_KEY = "darkpool_avatar_color";
const PALETTE = [
  { label: "Violet",  from: "#7C3AED", to: "#A855F7" },
  { label: "Fuchsia", from: "#A21CAF", to: "#E879F9" },
  { label: "Blue",    from: "#1D4ED8", to: "#60A5FA" },
  { label: "Cyan",    from: "#0E7490", to: "#22D3EE" },
  { label: "Emerald", from: "#065F46", to: "#34D399" },
  { label: "Amber",   from: "#B45309", to: "#FCD34D" },
  { label: "Rose",    from: "#9F1239", to: "#FB7185" },
  { label: "Slate",   from: "#334155", to: "#94A3B8" },
];

export function useAvatarColor() {
  const [color, setColorState] = useState<{ from: string; to: string }>(() => {
    try {
      const saved = localStorage.getItem(AVATAR_COLOR_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return PALETTE[0];
  });

  const setColor = (c: { from: string; to: string }) => {
    setColorState(c);
    localStorage.setItem(AVATAR_COLOR_KEY, JSON.stringify(c));
    window.dispatchEvent(new Event("avatar-color-change"));
  };

  useEffect(() => {
    const handler = () => {
      try {
        const saved = localStorage.getItem(AVATAR_COLOR_KEY);
        if (saved) setColorState(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("avatar-color-change", handler);
    return () => window.removeEventListener("avatar-color-change", handler);
  }, []);

  return { color, setColor };
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { keys, loading: keysLoading, fetchKeys, createKey, revokeKey } = useApiKeys();
  const { toast } = useToast();
  const { color: avatarColor, setColor: setAvatarColor } = useAvatarColor();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [notifPrefs, setNotifPrefs] = useState({
    "Order filled": true,
    "Batch settlements": true,
    "Price alerts": false,
    "Provider earnings": true,
    "Marketing updates": false,
  });

  useEffect(() => {
    if (user) fetchKeys();
  }, [user, fetchKeys]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await createKey();
      setNewKeyFull(result.key);
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
    } catch {
      toast({ title: "Failed to create key", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeKey(id);
      toast({ title: "API key revoked" });
    } catch {
      toast({ title: "Failed to revoke key", variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard" });
    });
  };

  const handleNotifToggle = (label: string, newVal: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [label]: newVal }));
    toast({
      title: newVal ? `${label} enabled` : `${label} disabled`,
      description: newVal ? "You'll be notified for this event." : "Notifications turned off for this event.",
    });
  };

  const shortWallet = user?.wallet
    ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`
    : "Not connected";

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Manage your wallet, API keys, and notifications</p>
      </div>

      {/* Wallet */}
      <GlassCard delay={0.1} className="p-6">
        <SectionLabel>Connected Wallet</SectionLabel>

        <div className="mt-4 flex items-center gap-4">
          {/* Avatar — click to open color picker */}
          <div className="relative shrink-0" ref={pickerRef}>
            <button
              onClick={() => setShowColorPicker(v => !v)}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 hover:ring-2 hover:ring-white/20"
              style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }}
              title="Change avatar color"
            >
              <span className="text-[11px] font-mono font-bold text-white/90">0x</span>
            </button>

            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 z-50 p-3 rounded-xl bg-[#111118] border border-white/[0.08] shadow-2xl"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-2.5">Avatar Color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PALETTE.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => { setAvatarColor(c); setShowColorPicker(false); toast({ title: `Avatar color set to ${c.label}` }); }}
                        className="w-8 h-8 rounded-full transition-all hover:scale-110 hover:ring-2 hover:ring-white/30"
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wallet info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white/70">{shortWallet}</span>
              {user?.wallet && (
                <button
                  onClick={() => copyToClipboard(user.wallet)}
                  className="text-white/25 hover:text-white/60 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {user && (
              <p className="font-mono text-[10px] text-white/30 mt-0.5">Base Mainnet · Chain ID 8453</p>
            )}
          </div>

          {/* Connected badge */}
          {user && (
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[9px] text-emerald-400">Connected</span>
            </div>
          )}
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

        {!user ? (
          <p className="font-mono text-[11px] text-white/30 text-center py-4">Connect your wallet to manage API keys</p>
        ) : keysLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
          </div>
        ) : (
          <div className="space-y-3">
            {newKeyFull && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2">
                <p className="font-mono text-[10px] text-emerald-400">New key — copy now, it won't be shown again</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[11px] text-white/60 bg-white/[0.03] rounded px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap border border-white/[0.06]">
                    {newKeyFull}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKeyFull)} className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setNewKeyFull(null)} className="h-8 w-8 p-0 text-white/30 hover:text-white/60">
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {keys.length === 0 && !newKeyFull && (
              <p className="font-mono text-[11px] text-white/30 text-center py-2">No API keys yet</p>
            )}

            {keys.map((k) => {
              const isRevealed = revealed[k.id];
              const displayKey = `${k.prefix}${"•".repeat(28)}`;
              return (
                <div key={k.id} className="group rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300">
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">{k.label || "API Key"}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                      {k.lastUsedAt && (
                        <span className="font-mono text-[9px] text-white/20">last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))} className="h-7 w-7 p-0 text-white/30 hover:text-white/60 hover:bg-white/[0.04]">
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(k.prefix)} className="h-7 w-7 p-0 text-white/30 hover:text-white/60 hover:bg-white/[0.04]">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(k.id)} disabled={revoking === k.id} className="h-7 w-7 p-0 text-white/30 hover:text-destructive/70 hover:bg-destructive/10">
                        {revoking === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <div className="font-mono text-[13px] text-white/40 select-all bg-white/[0.02] rounded-md px-3 py-2 border border-white/[0.04] overflow-hidden text-ellipsis whitespace-nowrap">
                      {isRevealed ? `${k.prefix}(full key not stored)` : displayKey}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {user && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-[10px] font-mono uppercase tracking-[0.15em] h-9 border-dashed border-white/[0.08] bg-transparent hover:bg-white/[0.03] text-white/40 hover:text-white/60 transition-all duration-300"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Key className="h-3.5 w-3.5 mr-2" />}
              Generate New Key
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Notifications */}
      <GlassCard delay={0.3} className="p-6 space-y-1">
        <SectionLabel>Notification Preferences</SectionLabel>
        <div className="pt-3 space-y-0">
          {(Object.keys(notifPrefs) as (keyof typeof notifPrefs)[]).map((label) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-white/60">{label}</span>
              <Switch
                checked={notifPrefs[label]}
                onCheckedChange={(val) => handleNotifToggle(label, val)}
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;
