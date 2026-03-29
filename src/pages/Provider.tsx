import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, Settings as SettingsIcon, Shield, Cpu, MapPin, Wifi, Clock,
  Zap, TrendingUp, CheckCircle2, DollarSign, Activity, BarChart3, Upload
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { motion } from "framer-motion";

const Provider = () => {
  return (
    <div className="space-y-8 max-w-[1440px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">Provider Panel</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">Register, manage, and monetize your GPU compute</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Section 1: Register GPU ─── */}
        <GlassCard delay={0.1} className="p-7">
          <div className="flex flex-col gap-6">
            <SectionLabel>Register GPU</SectionLabel>

            {/* GPU Model */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <Cpu className="h-3 w-3" /> GPU Model
              </label>
              <Select>
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10">
                  <SelectValue placeholder="Select GPU Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h100">NVIDIA H100 · 80GB HBM3</SelectItem>
                  <SelectItem value="a100">NVIDIA A100 · 80GB HBM2e</SelectItem>
                  <SelectItem value="rtx4090">RTX 4090 · 24GB GDDR6X</SelectItem>
                  <SelectItem value="rtx3090">RTX 3090 · 24GB GDDR6X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* VRAM + Location row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">VRAM (GB)</label>
                <Input type="number" defaultValue={80} className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Location
                </label>
                <Select>
                  <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east">US East</SelectItem>
                    <SelectItem value="us-west">US West</SelectItem>
                    <SelectItem value="eu-west">EU West</SelectItem>
                    <SelectItem value="asia-se">Asia Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bandwidth + Benchmark */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <Wifi className="h-3 w-3" /> Bandwidth (Gbps)
                </label>
                <Input type="number" defaultValue={10} className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Benchmark
                </label>
                <Button variant="outline" className="h-10 gap-2 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-muted-foreground transition-all duration-300 text-xs font-mono">
                  <Play className="h-3.5 w-3.5" /> Run Test
                </Button>
              </div>
            </div>

            {/* Stake */}
            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Stake Required</span>
                <span className="font-mono text-sm font-semibold text-foreground">500 <span className="text-xs text-muted-foreground">USDC</span></span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">Stake is locked during active listing and returned on deregistration.</p>
            </div>

            {/* Min Ask Price */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" /> Min Ask Price (USDC / GPU-hr)
              </label>
              <Input type="number" defaultValue={0.21} step={0.01} className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10" />
            </div>

            {/* Available GPU-hours + Window */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Available GPU-hrs
                </label>
                <Input type="number" defaultValue={168} className="font-mono border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Availability
                </label>
                <Select>
                  <SelectTrigger className="border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors h-10">
                    <SelectValue placeholder="Window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24-7">24/7 Always On</SelectItem>
                    <SelectItem value="business">Business Hours</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Primary CTA */}
            <Button className="w-full h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0">
              <Upload className="h-4 w-4" />
              List Capacity
            </Button>
          </div>
        </GlassCard>

        {/* ─── Right column: Active Listing + Earnings ─── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ─── Section 2: Active Listing ─── */}
          <GlassCard delay={0.2} className="p-7">
            <div className="flex flex-col gap-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <SectionLabel>Active Listing</SectionLabel>
                <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  Verified & Active
                </span>
              </div>

              {/* GPU identity */}
              <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] p-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">NVIDIA H100 · 80GB HBM3</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">GPU-7A3B · US East · 10 Gbps</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Uptime (30d)", value: "98.7%", icon: Activity },
                  { label: "Reputation", value: "4.8 / 5.0", icon: TrendingUp },
                  { label: "Hours Sold", value: "342 hrs", icon: Clock },
                  { label: "Min Ask", value: "$0.21/hr", icon: DollarSign },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-white/[0.03]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <stat.icon className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="font-mono text-sm font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Current Job */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current Job</span>
                  <p className="font-mono text-sm text-foreground mt-1">Order <span className="text-primary">#4521</span> — 18 hrs remaining</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">Processing</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {[
                  { icon: BarChart3, label: "Details" },
                  { icon: Pause, label: "Pause Listing" },
                  { icon: SettingsIcon, label: "Settings" },
                ].map((action) => (
                  <Button key={action.label} variant="outline" size="sm" className="text-[10px] gap-2 font-mono border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-muted-foreground transition-all duration-300">
                    <action.icon className="h-3.5 w-3.5" /> {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* ─── Section 3: Earnings & Performance ─── */}
          <GlassCard delay={0.3} glow className="p-7">
            <div className="flex flex-col gap-6">
              <SectionLabel pulse>Earnings & Performance</SectionLabel>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Earned", value: "$1,245.67", accent: true },
                  { label: "Pending Payout", value: "$45.00" },
                  { label: "Fill Rate", value: "87.3%" },
                  { label: "Completed Jobs", value: "28" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-white/[0.03]">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                    <p className={`font-mono text-base font-semibold mt-2 ${stat.accent ? "text-emerald-400" : "text-foreground"}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent payouts */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent Payouts</span>
                </div>
                {[
                  { date: "Mar 28", amount: "+$71.82", jobs: "12 jobs", status: "Settled" },
                  { date: "Mar 21", amount: "+$63.15", jobs: "9 jobs", status: "Settled" },
                  { date: "Mar 14", amount: "+$58.40", jobs: "11 jobs", status: "Settled" },
                ].map((payout, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
                      <span className="font-mono text-xs text-muted-foreground">{payout.date}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">{payout.jobs}</span>
                    <span className="font-mono text-sm font-semibold text-emerald-400">{payout.amount}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button className="flex-1 h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 border-0">
                  <DollarSign className="h-4 w-4" />
                  Withdraw to Wallet
                </Button>
                <Button className="flex-1 h-12 gap-2 text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0">
                  <Zap className="h-4 w-4" />
                  Submit Ask
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Provider;