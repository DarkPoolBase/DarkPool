/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IntroLoader } from "@/components/IntroLoader";
import { useWallet } from "@/contexts/WalletContext";
import { LogOut, Copy, Check } from "lucide-react";
import metamaskLogo from "@/assets/metamask-logo.png";
import phantomLogo from "@/assets/phantom-logo.jpg";
import coinbaseLogo from "@/assets/coinbase-wallet-logo.webp";

const Index = () => {
  const [loaderDone, setLoaderDone] = useState(false);
  const {
    connected, connecting, walletAddress, fullWalletAddress,
    walletType, networkStatus, connect, disconnect, showModal, setShowModal,
  } = useWallet();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Tell the iframe to hide/show its nav buttons based on wallet state
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const msg = connected ? 'wallet-connected' : 'wallet-disconnected';
    iframe.contentWindow.postMessage(msg, '*');
  }, [connected]);

  const copyAddress = () => {
    if (fullWalletAddress) {
      navigator.clipboard.writeText(fullWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Listen for messages from the iframe (aero.html)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'open-wallet-modal') {
        setShowModal(true);
      }
      if (event.data === 'launch-app') {
        navigate('/dashboard');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setShowModal, navigate]);

  return (
    <>
      {!loaderDone && <IntroLoader onComplete={() => setLoaderDone(true)} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaderDone ? 1 : 0 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        className="w-full h-screen relative"
      >
        <iframe
          ref={iframeRef}
          src="/aero.html"
          className="w-full h-screen border-0"
          title="Agentic Dark Pool"
          onLoad={() => {
            if (connected && iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage('wallet-connected', '*');
            }
          }}
        />

        {/* Connected wallet overlay — sits on top of the iframe nav, top-right */}
        {connected && (
          <div className="fixed top-4 md:top-6 right-4 md:right-6 z-[100] hidden md:flex items-center gap-3">
            {/* Wallet address button */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0" />
                <span className="text-white/90 font-mono text-xs">{walletAddress}</span>
              </button>

              {/* Dropdown */}
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
                      onClick={() => { disconnect(); setShowDropdown(false); }}
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

            {/* Launch App button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-[#6C3CE9] to-[#9D6FFF] text-white text-sm rounded-full font-medium hover:opacity-90 transition-all shadow-[0_0_20px_rgba(108,60,233,0.4)] border-0 cursor-pointer"
            >
              Launch App →
            </button>
          </div>
        )}

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

                  {connected ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                        <div>
                          <div className="text-sm font-mono text-white">{walletAddress}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">Connected to Base</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowModal(false); navigate('/dashboard'); }}
                        className="mt-3 w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                      >
                        Go to Dashboard →
                      </button>
                    </div>
                  ) : (
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
                  )}

                  {connecting && (
                    <div className="mt-4 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-white/40 font-mono mt-2">Connecting...</p>
                    </div>
                  )}

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
      </motion.div>
    </>
  );
};

export default Index;

