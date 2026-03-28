import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Settings as SettingsIcon, Plus, BarChart3 } from "lucide-react";

const Provider = () => {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Provider Panel</h1>
        <p className="text-sm text-muted-foreground">Register and manage your GPU resources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium">Register Your GPUs</h3>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">GPU Model</label>
            <Select><SelectTrigger><SelectValue placeholder="Select GPU Model" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="h100">H100 NVIDIA 80GB</SelectItem>
                <SelectItem value="a100">A100 NVIDIA 80GB</SelectItem>
                <SelectItem value="rtx4090">RTX 4090 24GB</SelectItem>
                <SelectItem value="rtx3090">RTX 3090 24GB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">VRAM (GB)</label>
            <Input type="number" defaultValue={80} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Location</label>
            <Select><SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="asia">Asia Pacific</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Bandwidth (Gbps)</label>
            <Input type="number" defaultValue={1} className="font-mono" />
          </div>
          <Button variant="outline" className="w-full gap-2"><Play className="h-3.5 w-3.5" /> Run Benchmark Test</Button>
          <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stake Required</span>
            <span className="font-mono font-medium">500 USDC</span>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90">Deposit Stake</Button>
        </div>

        {/* GPU Fleet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Your GPU Fleet</h3>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add GPU</Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">GPU ID: GPU-7A3B</p>
                <p className="text-xs text-muted-foreground">Model: NVIDIA H100 80GB</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-success"><span className="h-2 w-2 rounded-full bg-success" /> Active</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span className="text-muted-foreground">Uptime (30d)</span><p className="font-mono font-medium mt-0.5">98.7%</p></div>
              <div><span className="text-muted-foreground">Reputation</span><p className="font-mono font-medium mt-0.5">⭐ 4.8/5.0</p></div>
              <div><span className="text-muted-foreground">Hours Sold</span><p className="font-mono font-medium mt-0.5">342 hrs</p></div>
              <div><span className="text-muted-foreground">Revenue</span><p className="font-mono font-medium mt-0.5">$71.82 USDC</p></div>
            </div>
            <p className="text-xs text-muted-foreground">Current Job: #4521 (18 hrs remaining)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Details</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5"><Pause className="h-3 w-3" /> Pause</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5"><SettingsIcon className="h-3 w-3" /> Settings</Button>
            </div>
          </div>

          {/* Earnings */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-medium">💰 Earnings</h3>
            <div className="space-y-2 text-sm">
              {[["Total Earned", "$1,245.67"], ["This Month", "$234.50"], ["Pending", "$45.00"]].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">Withdraw to Wallet</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Provider;
