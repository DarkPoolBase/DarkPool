import { Bell, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import metamaskLogo from "@/assets/metamask-logo.png";
import phantomLogo from "@/assets/phantom-logo.jpg";

export function DashboardHeader() {
  const [modalOpen, setModalOpen] = useState(false);

  const connectMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (eth) {
      try {
        await eth.request({ method: "eth_requestAccounts" });
        setModalOpen(false);
      } catch (e: any) {
        if (e?.code === 4001) {
          // User rejected — don't show error
        } else {
          console.error("MetaMask error:", e);
          alert("Failed to connect. Make sure MetaMask is unlocked.");
        }
      }
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  const connectPhantom = async () => {
    const phantom = (window as any).phantom;
    // Try Phantom's EVM provider first, then fall back to generic ethereum
    const provider = phantom?.ethereum ?? (window as any).ethereum;
    if (provider) {
      try {
        await provider.request({ method: "eth_requestAccounts" });
        setModalOpen(false);
      } catch (e: any) {
        if (e?.code === 4001) {
          // User rejected — don't show error
        } else {
          console.error("Phantom error:", e);
          alert("Failed to connect. Make sure Phantom is unlocked and set to Ethereum/Base network.");
        }
      }
    } else {
      window.open("https://phantom.app/download", "_blank");
    }
  };

  return (
    <>
      <header className="h-[56px] md:h-[68px] flex items-center justify-between border-b border-white/[0.06] px-3 md:px-4 shrink-0 backdrop-blur-xl bg-[#030305]/80 relative z-20">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white/30 hover:text-white/70 transition-colors duration-300" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Base</span>
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
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white gap-2 shadow-[0_0_25px_rgba(139,92,246,0.25)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all duration-300 border-0 rounded-full px-4"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-medium">Connect Wallet</span>
          </Button>
        </div>
      </header>

      {/* Wallet Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 w-full max-w-md mx-4 rounded-2xl overflow-hidden glass-card"
            >
              <div className="p-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-light text-white tracking-tight">Connect Wallet</h3>
                    <p className="text-xs text-white/30 mt-1 font-mono">Select a wallet to connect</p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <X className="h-3.5 w-3.5 text-white/50" />
                  </button>
                </div>

                {/* Wallet Options */}
                <div className="space-y-3">
                  <button
                    onClick={connectMetaMask}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 group"
                  >
                    <img src={metamaskLogo} alt="MetaMask" className="w-10 h-10 rounded-xl object-contain" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-white/90">MetaMask</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">Browser Extension</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Popular</span>
                  </button>

                  <button
                    onClick={connectPhantom}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 group"
                  >
                    <img src={phantomLogo} alt="Phantom" className="w-10 h-10 rounded-xl object-cover" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-white/90">Phantom</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">Multi-Chain Wallet</div>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-white/20 font-mono">Secured by Base L2</span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] text-emerald-400/70 font-mono">Network Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
