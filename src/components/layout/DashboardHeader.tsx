/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bell, Wallet, LogOut, Copy, Check, ShieldCheck, ArrowRightLeft, AlertTriangle, Package, ArrowDownToLine, ArrowUpFromLine, Loader2, X, Settings } from "lucide-react";
import { useAvatarColor } from "@/pages/SettingsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import { useNotifications, type NotificationType } from "@/hooks/useNotifications";
import { useEscrowBalance, useUSDCBalance, useDepositUSDC, useWithdrawUSDC } from "@/hooks/useContracts";
import { useAutoAuth } from "@/hooks/useAutoAuth";
import { formatUSDC } from "@/lib/chain";
import { toast } from "sonner";
import metamaskLogo from "@/assets/metamask-logo.png";
import phantomLogo from "@/assets/phantom-logo.jpg";
import coinbaseLogo from "@/assets/coinbase-wallet-logo.webp";
import DepositModal from "@/components/dashboard/DepositModal";

const notifIcon: Record<NotificationType, typeof Package> = {
  order: Package,
  settlement: ArrowRightLeft,
  alert: AlertTriangle,
  system: ShieldCheck,
};

export function DashboardHeader() {
  const {
    connected, connecting, walletAddress, fullWalletAddress,
    walletType, networkStatus, connect, disconnect, showModal, setShowModal,
  } = useWallet();
  const { isAuthenticated } = useAutoAuth();
  const { data: escrowBalance, refetch: refetchEscrow } = useEscrowBalance(fullWalletAddress ?? undefined);
  const { formatted: usdcFormatted, refetch: refetchUSDC } = useUSDCBalance(fullWalletAddress ?? undefined);
  const { deposit, isLoading: depositing } = useDepositUSDC();
  const { withdraw, isLoading: withdrawing } = useWithdrawUSDC();

  const escrowAvailable = formatUSDC(escrowBalance?.available ?? BigInt(0));
  const escrowLocked = formatUSDC(escrowBalance?.locked ?? BigInt(0));
  const escrowTotal = formatUSDC((escrowBalance?.available ?? BigInt(0)) + (escrowBalance?.locked ?? BigInt(0)));

  const navigate = useNavigate();
  const { color: avatarColor } = useAvatarColor();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [amount, setAmount] = useState("");
  const [showPrivacyDeposit, setShowPrivacyDeposit] = useState(false);

  const sanitizeAmount = (val: string): string => {
    let clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 6) clean = parts[0] + '.' + parts[1].slice(0, 6);
    return clean;
  };

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }

    const availBal = Number(escrowBalance?.available ?? BigInt(0)) / 1e6;
    if (amt > availBal) { toast.error(`Insufficient escrow balance. Available: $${availBal.toFixed(2)}`); return; }
    try {
      await withdraw(amt);
      toast.success(`Withdrew $${amt.toFixed(2)} USDC`);
      setAmount("");
      refetchEscrow();
      refetchUSDC();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Withdrawal failed");
    }
  };

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
            <button
              onClick={() => { setShowBalance(true); setShowDropdown(false); setShowNotifications(false); }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">USDC</span>
              <span className="font-mono text-sm font-medium text-white tabular-nums">${escrowTotal}</span>
            </button>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
              className="relative text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-300"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-[#111118] backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Notifications</span>
                    <span onClick={markAllRead} className="text-[10px] font-mono text-violet-400 cursor-pointer hover:text-violet-300 transition-colors">Mark all read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 4).map((n) => {
                      const Icon = notifIcon[n.type];
                      return (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`flex items-start gap-3 px-3 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.04] last:border-0 ${n.unread ? 'bg-violet-500/[0.03]' : ''}`}
                        >
                          <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'order' ? 'bg-emerald-500/10 text-emerald-400' :
                            n.type === 'settlement' ? 'bg-violet-500/10 text-violet-400' :
                            n.type === 'alert' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white/80">{n.title}</span>
                              {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-white/30 font-mono mt-0.5 truncate">{n.message}</p>
                            <span className="text-[10px] text-white/20 font-mono mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                      className="w-full text-center text-[10px] font-mono text-violet-400 hover:text-violet-300 py-1.5 transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showNotifications && (
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            )}
          </div>

          {connected ? (
            <div className="relative">
              <Button
                size="sm"
                onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white gap-2 transition-all duration-300 border border-white/[0.08] rounded-full px-4"
              >
                <div className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }} />
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
                      onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white/80 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
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

                  <button
                    onClick={() => connect('coinbase')}
                    disabled={connecting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 disabled:opacity-50"
                  >
                    <img src={coinbaseLogo} alt="Coinbase Wallet" className="w-10 h-10 rounded-xl object-cover" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-white/90">Coinbase Wallet</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">Self-Custody Wallet</div>
                    </div>
                    {typeof window !== 'undefined' && ((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet) && (
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

      {/* Balance Modal */}
      <AnimatePresence>
        {showBalance && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowBalance(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 w-full max-w-sm mx-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111118]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-light text-white tracking-tight">Balance</h3>
                  </div>
                  <button
                    onClick={() => setShowBalance(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all text-white/50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Balance display */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/[0.03]">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Available</p>
                    <p className="font-mono text-lg font-semibold text-emerald-400 tabular-nums mt-1">${escrowAvailable}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03]">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Locked</p>
                    <p className="font-mono text-lg font-semibold text-amber-400 tabular-nums mt-1">${escrowLocked}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] mb-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Wallet USDC</p>
                  <p className="font-mono text-sm font-semibold text-white tabular-nums mt-1">${usdcFormatted}</p>
                </div>

                {/* Deposit button */}
                <Button
                  onClick={() => { setShowBalance(false); setShowPrivacyDeposit(true); }}
                  className="w-full h-12 gap-2 text-sm font-semibold transition-all duration-300 border-0 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] mb-3"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Deposit USDC
                </Button>

                {/* Withdraw section */}
                <div className="border-t border-white/[0.06] pt-4 mt-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-3">Withdraw</p>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                    className="font-mono text-center text-lg h-12 border-white/[0.06] bg-white/[0.02] mb-3"
                  />
                  <Button
                    onClick={handleConfirm}
                    disabled={withdrawing || !amount}
                    className="w-full h-12 gap-2 text-sm font-semibold transition-all duration-300 border-0 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  >
                    {withdrawing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4" />
                    )}
                    Confirm Withdrawal
                  </Button>
                  <p className="font-mono text-[10px] text-white/20 text-center mt-3">
                    Available USDC will be returned to your wallet
                  </p>
                </div>

                {/* Deposit info */}
                <div className="border-t border-white/[0.06] pt-4 mt-3">
                  <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-3">
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Deposits are split into 2-4 random parts and routed through intermediate wallets for privacy. No fees. Processing takes 1-3 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DepositModal open={showPrivacyDeposit} onClose={() => setShowPrivacyDeposit(false)} />
    </>
  );
}

