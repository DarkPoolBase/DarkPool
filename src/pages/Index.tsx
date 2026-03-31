import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IntroLoader } from "@/components/IntroLoader";
import { useWallet } from "@/contexts/WalletContext";
import metamaskLogo from "@/assets/metamask-logo.png";
import phantomLogo from "@/assets/phantom-logo.jpg";

const Index = () => {
  const [loaderDone, setLoaderDone] = useState(false);
  const { connected, connecting, walletAddress, connect, showModal, setShowModal } = useWallet();
  const navigate = useNavigate();

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
          src="/aero.html"
          className="w-full h-screen border-0"
          title="Agentic Dark Pool"
        />

        {/* Wallet Connect Modal — React-powered, overlays the iframe */}
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

                  {/* Connected state */}
                  {connected && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
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
                  )}

                  {/* Wallet options */}
                  {!connected && (
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
