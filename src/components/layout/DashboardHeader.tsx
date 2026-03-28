import { Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="h-14 flex items-center justify-between border-b border-white/[0.06] px-4 shrink-0 backdrop-blur-md bg-[hsl(var(--background))]/50 relative z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white/40 hover:text-white/80 transition-colors" />

        {/* Network badge with ping */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">Base Mainnet</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Balance display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">USDC</span>
          <span className="font-mono text-sm font-medium">$2,450.00</span>
        </div>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(108,60,233,0.8)]" />
        </Button>

        {/* Wallet button with gradient */}
        <Button
          size="sm"
          className="bg-gradient-to-r from-primary to-[hsl(258,78%,65%)] hover:from-primary/90 hover:to-[hsl(258,78%,60%)] text-white gap-2 shadow-[0_0_20px_rgba(108,60,233,0.3)] hover:shadow-[0_0_30px_rgba(108,60,233,0.5)] transition-all duration-300 border-0"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Connect Wallet</span>
        </Button>
      </div>
    </header>
  );
}
