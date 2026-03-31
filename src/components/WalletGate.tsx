import { Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function WalletGate({ children }: { children: ReactNode }) {
  const { connected, setShowModal } = useWallet();

  if (connected) return <>{children}</>;

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-68px)]">
      {/* Blurred background — render children but blur them */}
      <div className="absolute inset-0 blur-md opacity-30 pointer-events-none overflow-hidden">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#030305]/60 backdrop-blur-sm z-10" />

      {/* Connect prompt */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-violet-400" />
          </div>

          <h2 className="text-2xl font-light text-white tracking-tight mb-2">
            Wallet Required
          </h2>
          <p className="text-sm text-white/40 font-mono mb-8 leading-relaxed">
            Connect your wallet to access the Agentic Dark Pool dashboard and start trading GPU compute privately.
          </p>

          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-300 border-0 rounded-full px-8 py-3 text-sm"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>

          <p className="text-[10px] text-white/20 font-mono mt-6">
            Supports MetaMask, Phantom, and Coinbase Wallet on Base
          </p>
        </motion.div>
      </div>
    </div>
  );
}

