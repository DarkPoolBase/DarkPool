import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Settings as SettingsIcon, Plus, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { motion } from "framer-motion";

const Provider = () => {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold text-gradient">Provider Panel</h1>
        <p className="text-sm text-white/40 mt-1">Register and manage your GPU resources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <GlassCard gradient delay={0.1} className="p-6 space-y-4">
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

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">VRAM (GB)</label>
            <Input type="number" defaultValue={80} className="font-mono border-white/[0.06] bg-white/[0.02]" />
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

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Bandwidth (Gbps)</label>
            <Input type="number" defaultValue={1} className="font-mono border-white/[0.06] bg-white/[0.02]" />
          </div>

          <Button variant="outline" className="w-full gap-2 border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/60 transition-all duration-300">
            <Play className="h-3.5 w-3.5" /> Run Benchmark Test
          </Button>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Stake Required</span>
            <span className="font-mono text-sm font-medium">500 USDC</span>
          </div>

          <Button className="w-full bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0">
            Deposit Stake
          </Button>
        </GlassCard>

        {/* GPU Fleet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Your GPU Fleet</SectionLabel>
            <Button variant="outline" size="sm" className="gap-1.5 text-[10px] font-mono border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/50">
              <Plus className="h-3.5 w-3.5" /> Add GPU
            </Button>
          </div>

          <GlassCard delay={0.2} corners className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">GPU ID: <span className="font-mono text-primary">GPU-7A3B</span></p>
                <p className="text-xs text-white/40 mt-0.5">Model: NVIDIA H100 80GB</p>
              </div>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-success">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Uptime (30d)", value: "98.7%" },
                { label: "Reputation", value: "⭐ 4.8/5.0" },
                { label: "Hours Sold", value: "342 hrs" },
                { label: "Revenue", value: "$71.82" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">{stat.label}</span>
                  <p className="font-mono text-sm font-medium mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

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
          </GlassCard>

          {/* Earnings */}
          <GlassCard delay={0.3} glow className="p-6 space-y-4">
            <SectionLabel pulse>Earnings</SectionLabel>
            <div className="space-y-1">
              {[
                { label: "Total Earned", value: "$1,245.67" },
                { label: "This Month", value: "$234.50" },
                { label: "Pending", value: "$45.00" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-white/40">{label}</span>
                  <span className="font-mono text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            <Button className="w-full bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0">
              Withdraw to Wallet
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Provider;
