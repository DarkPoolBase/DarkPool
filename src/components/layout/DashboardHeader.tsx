import { Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="h-14 flex items-center justify-between border-b border-white/5 px-4 shrink-0 backdrop-blur-xl bg-[#030305]/80 relative z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white/30 hover:text-white/70 transition-colors duration-300" />

        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Base Mainnet</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">USDC</span>
          <span className="font-mono text-sm font-medium text-white tabular-nums">$2,450.00</span>
        </div>

        <Button variant="ghost" size="icon" className="relative text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-300">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        </Button>

        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white gap-2 shadow-[0_0_25px_rgba(139,92,246,0.25)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all duration-300 border-0 rounded-full px-4"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Connect Wallet</span>
        </Button>
      </div>
    </header>
  );
}
