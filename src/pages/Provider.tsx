/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Cpu, MapPin, Wifi, Zap, TrendingUp, CheckCircle2,
  DollarSign, Activity, Upload, Loader2, Pencil, Check, X, Plus, Trash2, AlertTriangle
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useMyProvider, useMyEarnings, useRegisterProvider, useUpdateMinPrice, useUpdateCapacity, useDeregisterProvider } from "@/hooks/useProviders";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { useWithdrawUSDC, useEscrowBalance } from "@/hooks/useContracts";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

const GPU_OPTIONS = [
  { value: "H100", label: "NVIDIA H100 · 80GB HBM3" },
  { value: "A100", label: "NVIDIA A100 · 80GB HBM2e" },
  { value: "RTX4090", label: "RTX 4090 · 24GB GDDR6X" },
  { value: "L40S", label: "NVIDIA L40S · 48GB GDDR6" },
  { value: "H200", label: "NVIDIA H200 · 141GB HBM3e" },
  { value: "A10G", label: "NVIDIA A10G · 24GB GDDR6" },
];

const REGIONS = [
  { value: "us-east", label: "US East" },
  { value: "us-west", label: "US West" },
  { value: "eu-west", label: "EU West" },
  { value: "asia-se", label: "Asia Pacific" },
];

function RegistrationForm() {
  const [name, setName] = useState("");
  const [gpuType, setGpuType] = useState("");
  const [count, setCount] = useState(1);
  const [minPrice, setMinPrice] = useState(0.15);
  const [region, setRegion] = useState("");
  const register = useRegisterProvider();

  const handleSubmit = async () => {
    if (!name || !gpuType || !region) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await register.mutateAsync({
        name,
        gpuTypes: [{ type: gpuType, count, available: count }],
        region,
        minPricePerHour: minPrice,
      });
      toast.success("Registered as a provider!");
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    }
  };

  return (
    <GlassCard delay={0.1} className="p-6 max-w-lg mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <SectionLabel>Become a Provider</SectionLabel>
          <p className="font-mono text-[11px] text-white/40 mt-2">
            List your GPU capacity on the dark pool. The system will automatically place SELL orders on your behalf each batch cycle.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Provider Name</label>
          <Input
            placeholder="e.g. My GPU Farm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-3 w-3" /> GPU Model
          </label>
          <Select onValueChange={setGpuType}>
            <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10">
              <SelectValue placeholder="Select GPU Model" />
            </SelectTrigger>
            <SelectContent>
              {GPU_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">GPU Count</label>
            <Input
              type="number" min={1} value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Region
            </label>
            <Select onValueChange={setRegion}>
              <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" /> Min Ask Price (USDC / GPU-hr)
          </label>
          <Input
            type="number" step={0.01} min={0.01} value={minPrice}
            onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0.10)}
            className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10"
          />
        </div>

        <div className="rounded-xl bg-primary/[0.05] border border-primary/10 p-4">
          <p className="font-mono text-[10px] text-white/40">
            The market maker will auto-place SELL orders at your min price each 45-second batch cycle. You earn the clearing price when matched with a buyer.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={register.isPending}
          className="w-full h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0"
        >
          {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          List Capacity
        </Button>
      </div>
    </GlassCard>
  );
}

function MinPriceEditor({ provider }: { provider: any }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(parseFloat(provider.minPricePerHour).toFixed(2));
  const updateMinPrice = useUpdateMinPrice(provider.id);

  const save = async () => {
    try {
      await updateMinPrice.mutateAsync(parseFloat(value));
      toast.success("Min price updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update price");
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-foreground">${parseFloat(provider.minPricePerHour).toFixed(2)}/hr</span>
        <button onClick={() => setEditing(true)} className="text-white/30 hover:text-white/60 transition-colors">
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number" step={0.01} min={0.01}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="font-mono h-7 w-24 text-xs border-white/[0.06] bg-white/[0.02]"
        autoFocus
      />
      <button onClick={save} className="text-emerald-400 hover:text-emerald-300">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white/50">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ProviderDashboard({ provider }: { provider: any }) {
  const { data: earningsData } = useMyEarnings(true);
  const { fullWalletAddress } = useWallet();
  const { data: escrowBalance, refetch: refetchEscrow } = useEscrowBalance(fullWalletAddress ?? undefined);
  const { withdraw, isLoading: withdrawing } = useWithdrawUSDC();
  const updateCapacity = useUpdateCapacity(provider.id);
  const deregister = useDeregisterProvider();

  const [showAddGpu, setShowAddGpu] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [newGpuType, setNewGpuType] = useState("");
  const [newGpuCount, setNewGpuCount] = useState(1);

  const gpuLabel = GPU_OPTIONS.find(g => g.value === provider.gpuTypes?.[0]?.type)?.label
    ?? provider.gpuTypes?.[0]?.type ?? "—";

  const handleWithdraw = async () => {
    const available = Number(escrowBalance?.available ?? BigInt(0)) / 1e6;
    if (available <= 0) {
      toast.error("No available escrow balance to withdraw");
      return;
    }
    try {
      await withdraw(available);
      toast.success(`Withdrew $${available.toFixed(2)} USDC to wallet`);
      refetchEscrow();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Withdrawal failed");
    }
  };

  const handleDeregister = async () => {
    try {
      await deregister.mutateAsync();
      toast.success("Provider listing removed");
      setShowTerminate(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove listing");
    }
  };

  const handleAddGpu = async () => {
    if (!newGpuType) { toast.error("Select a GPU type"); return; }
    const existing = provider.gpuTypes || [];
    const alreadyListed = existing.find((g: any) => g.type === newGpuType);
    if (alreadyListed) { toast.error("GPU type already listed"); return; }
    try {
      await updateCapacity.mutateAsync([
        ...existing,
        { type: newGpuType, count: newGpuCount, available: newGpuCount },
      ]);
      toast.success(`Added ${newGpuType} to your listing`);
      setShowAddGpu(false);
      setNewGpuType("");
      setNewGpuCount(1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add GPU type");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GlassCard delay={0.1} className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <SectionLabel>Active Listing</SectionLabel>
            <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Online
            </span>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-foreground">{gpuLabel}</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {provider.name} · {provider.region ?? "—"}
              </p>
            </div>
          </div>

          {/* All listed GPU types */}
          {provider.gpuTypes?.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">All GPUs</span>
              {provider.gpuTypes.map((g: any) => (
                <div key={g.type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03]">
                  <span className="font-mono text-xs text-foreground">{g.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{g.count} units</span>
                    {provider.gpuTypes.length > 1 && (
                      <button
                        onClick={async () => {
                          const remaining = provider.gpuTypes.filter((x: any) => x.type !== g.type);
                          try {
                            await updateCapacity.mutateAsync(remaining);
                            toast.success(`Removed ${g.type} from listing`);
                          } catch { toast.error("Failed to remove GPU type"); }
                        }}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Min Ask</span>
              </div>
              <MinPriceEditor provider={provider} />
            </div>
            {[
              { label: "Total Jobs", value: String(provider.totalJobs), icon: Activity },
              { label: "Reputation", value: `${parseFloat(provider.reputation).toFixed(1)} / 5.0`, icon: TrendingUp },
              { label: "Uptime", value: `${parseFloat(provider.uptimePct).toFixed(1)}%`, icon: Wifi },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <stat.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Terminate listing */}
          <button
            onClick={() => setShowTerminate(true)}
            className="w-full p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.12] hover:border-red-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400/60 group-hover:text-red-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400/60 group-hover:text-red-400">Remove Listing</span>
          </button>
        </div>
      </GlassCard>

      <GlassCard delay={0.2} glow className="p-6 lg:col-span-2">
        <div className="flex flex-col gap-6">
          <SectionLabel pulse>Earnings</SectionLabel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Earned", value: `$${parseFloat(earningsData?.totalEarnings ?? '0').toFixed(4)}`, accent: true },
              { label: "Pending Payout", value: `$${parseFloat(earningsData?.pendingEarnings ?? '0').toFixed(4)}` },
              { label: "Status", value: provider.totalJobs > 0 ? "Active" : "Awaiting match" },
              { label: "Completed Jobs", value: String(provider.totalJobs) },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-white/[0.03]">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                <p className={`font-mono text-base font-semibold mt-2 ${stat.accent ? "text-emerald-400" : "text-foreground"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white/[0.03]">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent Payouts</span>
            </div>
            {earningsData?.earnings.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="font-mono text-xs text-white/20">No earnings yet — waiting for your first matched order</p>
              </div>
            )}
            {earningsData?.earnings.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{e.gpuType} · Batch #{e.batchId}</span>
                <span className="font-mono text-sm font-semibold text-emerald-400">+${parseFloat(e.amount).toFixed(4)}</span>
              </div>
            ))}
          </div>

          {/* Add GPU Type form */}
          {showAddGpu && (
            <div className="rounded-xl bg-white/[0.03] p-4 flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Add GPU Type</span>
              <div className="flex gap-3">
                <Select onValueChange={setNewGpuType}>
                  <SelectTrigger className="border-white/[0.06] bg-white/[0.02] h-9 text-xs">
                    <SelectValue placeholder="Select GPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {GPU_OPTIONS.filter(g => !provider.gpuTypes?.some((e: any) => e.type === g.value)).map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={1} value={newGpuCount}
                  onChange={(e) => setNewGpuCount(parseInt(e.target.value) || 1)}
                  className="font-mono text-xs h-9 w-20 border-white/[0.06] bg-white/[0.02]"
                  placeholder="Count"
                />
                <Button onClick={handleAddGpu} disabled={updateCapacity.isPending} size="sm" className="h-9 px-3 text-xs bg-primary hover:bg-primary/80 border-0 shrink-0">
                  {updateCapacity.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button onClick={() => setShowAddGpu(false)} size="sm" variant="ghost" className="h-9 px-2 shrink-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="flex-1 h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 border-0"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              Withdraw to Wallet
            </Button>
            <Button
              onClick={() => setShowAddGpu(!showAddGpu)}
              className="flex-1 h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0"
            >
              <Plus className="h-4 w-4" />
              Add GPU Type
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Terminate confirmation dialog */}
      {showTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard delay={0} className="p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <div>
                <h3 className="font-mono text-base font-semibold text-foreground">Remove Provider Listing</h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  This will permanently remove your listing for <span className="text-foreground">{gpuLabel}</span> and stop all auto-placed SELL orders. Any pending earnings will remain in your account.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setShowTerminate(false)}
                  variant="ghost"
                  className="flex-1 h-11 font-mono text-xs border border-white/[0.06] hover:bg-white/[0.03]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeregister}
                  disabled={deregister.isPending}
                  className="flex-1 h-11 font-mono text-xs bg-red-500/80 hover:bg-red-500 border-0 gap-2"
                >
                  {deregister.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove Listing
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

const Provider = () => {
  const { isAuthenticated } = useAutoAuth();
  const { data: provider, isLoading } = useMyProvider(isAuthenticated);

  return (
    <div className="space-y-6 max-w-7xl min-h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Provider Panel</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Register, manage, and monetize your GPU compute</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : !provider ? (
        <RegistrationForm />
      ) : (
        <ProviderDashboard provider={provider} />
      )}
    </div>
  );
};

export default Provider;
