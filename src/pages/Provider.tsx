import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Settings as SettingsIcon, Plus, BarChart3, Cpu } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion } from "framer-motion";
import { pageHeader, ease } from "@/lib/animations";

const Provider = () => {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <motion.div {...pageHeader}>
        <h1 className="text-2xl font-semibold text-gradient">Provider Panel</h1>
        <p className="text-sm text-white/40 mt-1">Register and manage your GPU resources</p>
      </motion.div>

      {/* Top Row: Registration + GPU Fleet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Registration Form */}
        <div className="lg:col-span-4">
          <GlassCard delay={0.08} className="p-6 space-y-4 h-full">
            <SectionLabel>Register Your GPUs</SectionLabel>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">GPU Model</label>
              <Select>
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02]">
                  <SelectValue placeholder="Select GPU Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h100">H100 NVIDIA 80GB</SelectItem>
                  <SelectItem value="a100">A100 NVIDIA 80GB</SelectItem>
                  <SelectItem value="rtx4090">RTX 4090 24GB</SelectItem>
                  <SelectItem value="rtx3090">RTX 3090 24GB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">VRAM (GB)</label>
                <Input type="number" defaultValue={80} className="font-mono border-white/[0.06] bg-white/[0.02]" />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Bandwidth</label>
                <Input type="number" defaultValue={1} className="font-mono border-white/[0.06] bg-white/[0.02]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Location</label>
              <Select>
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02]">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="asia">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full gap-2 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/60 transition-all duration-300">
              <Play className="h-3.5 w-3.5" /> Run Benchmark Test
            </Button>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Stake Required</span>
              <span className="font-mono text-sm font-medium">500 USDC</span>
            </div>

            <Button className="w-full bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0">
              Deposit Stake
            </Button>
          </GlassCard>
        </div>

        {/* GPU Fleet + Stats */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* GPU Card */}
          <GlassCard delay={0.16} corners className="p-6 space-y-5 flex-1">
            <div className="flex items-center justify-between">
              <SectionLabel>Your GPU Fleet</SectionLabel>
              <Button variant="outline" size="sm" className="gap-1.5 text-[10px] font-mono border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">
                <Plus className="h-3.5 w-3.5" /> Add GPU
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">GPU ID: <span className="font-mono text-primary">GPU-7A3B</span></p>
                  <p className="text-xs text-white/40 mt-0.5">NVIDIA H100 80GB · US-East</p>
                </div>
              </div>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-success">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Uptime (30d)", value: "98.7%" },
                { label: "Reputation", value: "⭐ 4.8/5.0" },
                { label: "Hours Sold", value: "342 hrs" },
                { label: "Revenue", value: "$71.82" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block">{stat.label}</span>
                  <p className="font-mono text-sm font-medium mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">Current Job: <span className="text-primary font-mono">#4521</span> (18 hrs remaining)</p>
              <div className="flex gap-2">
                {[
                  { icon: BarChart3, label: "Details" },
                  { icon: Pause, label: "Pause" },
                  { icon: SettingsIcon, label: "Settings" },
                ].map((action) => (
                  <Button key={action.label} variant="outline" size="sm" className="text-[10px] gap-1.5 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50 transition-all duration-300">
                    <action.icon className="h-3 w-3" /> {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Earnings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Earned", value: "$1,245.67" },
              { label: "This Month", value: "$234.50" },
              { label: "Pending", value: "$45.00" },
            ].map(({ label, value }, i) => (
              <GlassCard key={label} delay={0.24 + i * 0.08} className="p-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block">{label}</span>
                <p className="font-mono text-xl font-semibold mt-2 text-white tabular-nums">{value}</p>
              </GlassCard>
            ))}
          </div>

          {/* Withdraw */}
          <GlassCard delay={0.48} glow className="p-5 flex items-center justify-between">
            <div>
              <SectionLabel pulse>Withdraw Earnings</SectionLabel>
              <p className="text-xs text-white/30 mt-1">Available: <span className="text-white/60 font-mono">$1,245.67 USDC</span></p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0 px-6">
              Withdraw to Wallet
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Provider;
