import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { publicClient } from "@/lib/chain";

interface TransactionReceiptModalProps {
  open: boolean;
  onClose: () => void;
  txHash: string;
}

interface ReceiptData {
  blockNumber: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: "success" | "reverted";
  timestamp: number;
  confirmations: number;
}

const TransactionReceiptModal = ({ open, onClose, txHash }: TransactionReceiptModalProps) => {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !txHash) return;
    setLoading(true);
    setError("");
    setReceipt(null);

    (async () => {
      try {
        const txReceipt = await publicClient.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        const block = await publicClient.getBlock({
          blockNumber: txReceipt.blockNumber,
        });

        const currentBlock = await publicClient.getBlockNumber();

        setReceipt({
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed,
          effectiveGasPrice: txReceipt.effectiveGasPrice,
          status: txReceipt.status,
          timestamp: Number(block.timestamp),
          confirmations: Number(currentBlock - txReceipt.blockNumber),
        });
      } catch (err: any) {
        setError(err?.message || "Failed to fetch receipt");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, txHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gasCostEth = receipt
    ? Number(receipt.gasUsed * receipt.effectiveGasPrice) / 1e18
    : 0;

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    }) + " UTC";

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-[#111118] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h3 className="text-base font-light text-white tracking-tight">Transaction Receipt</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all text-white/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-6">
              {loading && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-6 w-6 text-violet-400 animate-spin mb-3" />
                  <p className="text-xs text-white/30 font-mono">Fetching on-chain receipt...</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-xs text-red-400 font-mono">{error}</p>
                </div>
              )}

              {receipt && (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${receipt.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className={`text-sm font-medium ${receipt.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                      {receipt.status === "success" ? "Confirmed" : "Reverted"}
                    </span>
                    <span className="text-[10px] text-white/20 font-mono ml-auto">
                      {receipt.confirmations.toLocaleString()} confirmations
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    {[
                      ["Block", receipt.blockNumber.toString()],
                      ["Timestamp", formatDate(receipt.timestamp)],
                      ["Gas Used", receipt.gasUsed.toLocaleString()],
                      ["Gas Price", `${(Number(receipt.effectiveGasPrice) / 1e9).toFixed(4)} Gwei`],
                      ["Gas Cost", `${gasCostEth.toFixed(8)} ETH`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[11px] text-white/30">{label}</span>
                        <span className="text-xs font-mono text-white/70">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tx Hash */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-white/60 break-all flex-1">{txHash}</code>
                      <button onClick={handleCopy} className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/30" />}
                      </button>
                    </div>
                  </div>

                  {/* Basescan link */}
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-mono hover:bg-violet-500/10 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on Basescan
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionReceiptModal;
