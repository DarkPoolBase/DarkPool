import { Bell, Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import metamaskLogo from "@/assets/metamask-logo.png";
import phantomLogo from "@/assets/phantom-logo.jpg";

export function DashboardHeader() {
  const {
    connected, connecting, walletAddress, fullWalletAddress,
    walletType, networkStatus, connect, disconnect, showModal, setShowModal,
  } = useWallet();

  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const copyAddress = () => {
    if (fullWalletAddress) {
      navigator.clipboard.writeText(fullWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <header className="h-[56px] md:h-[68px] flex items-center justify-between border-b border-white/[0.06] px-3 md:px-4 shrink-0 backdrop-blur-xl bg-[#030305]/80 relative z-20">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white/30 hover:text-white/70 transition-colors duration-300" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${networkStatus === 'connected' ? 'bg-emerald-400' : networkStatus === 'wrong_network' ? 'bg-amber-400' : 'bg-red-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${networkStatus === 'connected' ? 'bg-emerald-400' : networkStatus === 'wrong_network' ? 'bg-amber-400' : 'bg-red-400'}`} />
            </span>
            <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Base</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {connected && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">USDC</span>
              <span className="font-mono text-sm font-medium text-white tabular-nums">$2,450.00</span>
            </div>
          )}

          <Button variant="ghost" size="icon" className="relative text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-300">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          </Button>

          {connected ? (
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white gap-2 transition-all duration-300 border border-white/[0.08] rounded-full px-4"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                <span className="text-xs font-mono">{walletAddress}</span>
              </Button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#111118] backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                          {walletType === 'phantom' ? 'Phantom' : walletType === 'metamask' ? 'MetaMask' : 'Coinbase'}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          networkStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {networkStatus === 'connected' ? 'Base Connected' : 'Wrong Network'}
                        </span>
                      </div>
                      <button
                        onClick={copyAddress}
                        className="mt-2 flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white/80 transition-colors w-full"
                      >
                        <span className="truncate">{fullWalletAddress}</span>
                        {copied ? <Check className="h-3 w-3 text-emerald-400 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
                      </button>
                    </div>
                    <button
                      onClick={() => window.open(`https://basescan.org/address/${fullWalletAddress}`, '_blank')}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      View on Basescan
                    </button>
                    <button
                      onClick={() => { disconnect(); setShowDropdown(false); navigate('/'); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect Wallet
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {showDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              disabled={connecting}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white gap-2 shadow-[0_0_25px_rgba(139,92,246,0.25)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all duration-300 border-0 rounded-full px-4"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </span>
            </Button>
          )}
        </div>
      </header>

      {/* Wallet Connect Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 w-full max-w-md mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111118]"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-light text-white tracking-tight">Connect Wallet</h3>
                    <p className="text-xs text-white/30 mt-1 font-mono">Select a wallet to connect to Base</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all text-white/50"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => connect('metamask')}
                    disabled={connecting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 disabled:opacity-50"
                  >
                    <img src={metamaskLogo} alt="MetaMask" className="w-10 h-10 rounded-xl object-contain" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-white/90">MetaMask</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">Browser Extension</div>
                    </div>
                    {typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask && (
                      <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Detected</span>
                    )}
                  </button>

                  <button
                    onClick={() => connect('phantom')}
                    disabled={connecting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 disabled:opacity-50"
                  >
                    <img src={phantomLogo} alt="Phantom" className="w-10 h-10 rounded-xl object-cover" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-white/90">Phantom</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">Multi-Chain Wallet</div>
                    </div>
                    {typeof window !== 'undefined' && (window as any).phantom?.ethereum?.isPhantom && (
                      <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Detected</span>
                    )}
                  </button>
                </div>

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

