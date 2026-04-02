/**
 * Deposit Modal Component
 *
 * Always-partial-privacy split-deposit flow (no ChangeNow mixer, no privacy level selection):
 * 1. Create holding wallet (deterministic per deposit)
 * 2. User signs token transfer to holding wallet
 * 3. Auto-split deposit into 2-4 random parts with staggered timing
 * 4. Each part routed through intermediate wallet -> Pool
 * 5. Balance credited after all splits processed
 *
 * Zero platform fees. Small ETH gas deposit covers network costs.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

type DepositStep =
  | "form"
  | "signing"
  | "submitting"
  | "waitingForFunds"
  | "splitting"
  | "success"
  | "failed";

const MAX_AMOUNT = 999999.99;

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "darkpool_session";

interface StoredSession {
  token: string;
  walletAddress: string;
  expiresAt: number;
}

function getStoredSession(walletAddress: string): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (
      session.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
      session.expiresAt > Date.now()
    ) {
      return session.token;
    }
    localStorage.removeItem(SESSION_KEY);
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
}

function storeSession(token: string, walletAddress: string): void {
  const session: StoredSession = {
    token,
    walletAddress,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23 hours
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DepositModal = ({ open, onClose }: DepositModalProps) => {
  const { connected, fullWalletAddress, walletType, getProvider } = useWallet();

  const [amount, setAmount] = useState("");
  const token = "USDC" as const;
  const [step, setStep] = useState<DepositStep>("form");
  const [depositId, setDepositId] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [error, setError] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Split progress
  const [totalSplits, setTotalSplits] = useState(0);
  const [sentSplits, setSentSplits] = useState(0);

  // Polling refs
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);

  // Sanitize amount input
  const handleAmountChange = (value: string) => {
    let clean = value.replace(/-/g, "");
    if (clean === "" || clean === ".") {
      setAmount(clean);
      return;
    }
    const num = parseFloat(clean);
    if (!isNaN(num) && num > MAX_AMOUNT) {
      clean = MAX_AMOUNT.toString();
    }
    setAmount(clean);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      isCancelledRef.current = true;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Auth: obtain bearer token                                        */
  /* ---------------------------------------------------------------- */

  const ensureAuthenticated = useCallback(async (): Promise<string> => {
    if (!fullWalletAddress) throw new Error("Wallet not connected");

    // Check existing session
    const existing = sessionToken || getStoredSession(fullWalletAddress);
    if (existing) {
      setSessionToken(existing);
      return existing;
    }

    const provider = getProvider();
    if (!provider) throw new Error("Wallet provider not available");

    // Step 1: Request nonce
    const nonceRes = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: fullWalletAddress }),
    });
    const nonceData = await nonceRes.json();
    if (!nonceRes.ok || !nonceData.nonce) {
      throw new Error(nonceData.error || "Failed to get auth nonce");
    }

    // Step 2: Sign the full message (not just the nonce)
    const message = nonceData.message;
    const hexMessage =
      "0x" +
      Array.from(new TextEncoder().encode(message))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const signature = (await provider.request({
      method: "personal_sign",
      params: [hexMessage, fullWalletAddress],
    })) as string;

    // Step 3: Verify signature
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: fullWalletAddress,
        signature,
        nonce: nonceData.nonce,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.sessionToken) {
      throw new Error(verifyData.error || "Failed to verify signature");
    }

    const newToken = verifyData.sessionToken;
    storeSession(newToken, fullWalletAddress);
    setSessionToken(newToken);
    return newToken;
  }, [fullWalletAddress, sessionToken, getProvider]);

  /* ---------------------------------------------------------------- */
  /*  Authenticated fetch helper                                       */
  /* ---------------------------------------------------------------- */

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}, bearer: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
        ...(options.headers as Record<string, string>),
      };
      return fetch(url, { ...options, headers });
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Poll endpoint helper                                             */
  /* ---------------------------------------------------------------- */

  const pollEndpoint = async (
    url: string,
    body: Record<string, unknown>,
    checkFn: (data: any) => { done: boolean; data?: any },
    intervalMs: number,
    timeoutMs: number,
    method: "POST" | "GET" = "POST",
    bearer?: string
  ): Promise<any> => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let resolved = false;

      const poll = async () => {
        if (resolved || isCancelledRef.current) {
          if (!resolved && isCancelledRef.current)
            reject(new Error("Cancelled"));
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          if (!resolved) {
            resolved = true;
            reject(new Error("Timeout waiting for response"));
          }
          return;
        }

        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

          const fetchOptions: RequestInit =
            method === "GET"
              ? { method: "GET", headers }
              : { method: "POST", headers, body: JSON.stringify(body) };

          const response = await fetch(url, fetchOptions);
          if (!response.ok) {
            console.warn(`Poll response ${response.status}`);
            return;
          }
          const data = await response.json();
          if (resolved) return;

          const result = checkFn(data);

          if (result.done && !resolved) {
            resolved = true;
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            resolve(result.data || data);
            return;
          }
        } catch (err) {
          console.warn("Poll error:", err);
        }
      };

      poll();
      pollingRef.current = setInterval(poll, intervalMs);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Main deposit handler (Base EVM only)                             */
  /* ---------------------------------------------------------------- */

  const handleDeposit = async () => {
    if (!connected || !fullWalletAddress) {
      setError("Wallet not connected. Please connect your wallet first.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 3) {
      setError("Minimum deposit amount is $3");
      return;
    }
    if (parsedAmount > MAX_AMOUNT) {
      setError(`Maximum deposit amount is $${MAX_AMOUNT.toLocaleString()}`);
      return;
    }

    try {
      setError("");
      isCancelledRef.current = false;
      setStep("signing");
      setProcessingStatus("Authenticating...");

      // Authenticate
      const bearer = await ensureAuthenticated();

      setProcessingStatus("Creating holding wallet...");

      const depositAmount = parsedAmount;
      console.log(`[Deposit] Starting deposit: ${depositAmount} ${token}`);

      // ============================================
      // STEP 1: Create holding wallet (returns evmTransaction)
      // ============================================
      const holdingResponse = await authFetch(
        "/api/zk/create-holding-wallet",
        {
          method: "POST",
          body: JSON.stringify({
            wallet: fullWalletAddress,
            amount: depositAmount,
            token,
            privacy_level: "partial",
          }),
        },
        bearer
      );

      const holdingResult = await holdingResponse.json();
      if (!holdingResult.success) {
        throw new Error(
          holdingResult.error ||
            holdingResult.message ||
            "Failed to create holding wallet"
        );
      }

      const newDepositId = holdingResult.depositId;
      setDepositId(newDepositId);
      console.log(
        `[Deposit] Holding wallet: ${holdingResult.holdingWalletAddress}`
      );
      console.log(`[Deposit] Deposit ID: ${newDepositId}`);

      // ============================================
      // STEP 2: User signs EVM transfer to holding wallet
      // ============================================
      setProcessingStatus("Please approve the transfer in your wallet...");

      const provider = getProvider();
      if (!provider) {
        throw new Error(
          "Wallet provider not found. Please reconnect your wallet."
        );
      }

      // Ensure connected to Base chain
      const BASE_CHAIN_ID = "0x2105";
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_CHAIN_ID }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_CHAIN_ID,
                chainName: "Base",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } else {
          throw new Error("Failed to switch to Base network");
        }
      }

      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please reconnect your wallet.");
      }

      // If user needs to approve the DepositRouter for USDC (one-time)
      if (holdingResult.needsApproval && holdingResult.approveTransaction) {
        setProcessingStatus(
          "One-time USDC approval needed for deposit router..."
        );
        const approveTx = holdingResult.approveTransaction;
        const approveHash = (await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: accounts[0],
              to: approveTx.to,
              data: approveTx.data,
              value: approveTx.value,
            },
          ],
        })) as string;
        console.log(`[Deposit] Approval tx: ${approveHash}`);

        // Wait for approval to confirm
        setProcessingStatus("Waiting for approval confirmation...");
        let approvalConfirmed = false;
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const receipt = (await provider.request({
            method: "eth_getTransactionReceipt",
            params: [approveHash],
          })) as { status: string } | null;
          if (receipt && receipt.status === "0x1") {
            approvalConfirmed = true;
            break;
          }
          if (receipt && receipt.status === "0x0") {
            throw new Error("USDC approval transaction failed");
          }
        }
        if (!approvalConfirmed) {
          throw new Error("USDC approval timed out");
        }
        console.log(`[Deposit] Approval confirmed`);
      }

      // Send deposit via DepositRouter (USDC + ETH gas in single tx)
      setStep("submitting");
      setProcessingStatus("Please approve the deposit in your wallet...");
      const evmTx = holdingResult.evmTransaction;
      const txHash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: evmTx.to,
            data: evmTx.data,
            value: evmTx.value,
          },
        ],
      })) as string;
      console.log(`[Deposit] Deposit tx: ${txHash}`);
      setTxSignature(txHash);

      // ============================================
      // STEP 3: Wait for funds + auto-split
      // ============================================
      setStep("waitingForFunds");
      setProcessingStatus("Detecting funds in holding wallet...");

      await new Promise((r) => setTimeout(r, 5000));

      const splitResult = await pollEndpoint(
        "/api/zk/auto-split-and-exchange",
        { depositId: newDepositId },
        (data) => {
          if (data.success && data.numSplits > 0) {
            return { done: true, data };
          }
          if (
            data.success === false &&
            data.message?.includes("below minimum")
          ) {
            return { done: true, data: { error: data.message } };
          }
          setProcessingStatus(
            data.message || "Waiting for funds to arrive..."
          );
          return { done: false };
        },
        5000,
        300000,
        "POST",
        bearer
      );

      if (splitResult.error) {
        throw new Error(splitResult.error);
      }

      const numSplits = splitResult.numSplits || 1;
      setTotalSplits(numSplits);
      setSentSplits(0);
      console.log(`[Deposit] ${numSplits} splits queued`);

      // ============================================
      // STEP 4: Process split queue
      // ============================================
      setStep("splitting");
      setProcessingStatus(`Processing splits (0/${numSplits})...`);

      await pollEndpoint(
        "/api/zk/process-split-queue",
        { depositId: newDepositId, wallet: fullWalletAddress },
        (data) => {
          if (data.sentSplits !== undefined) {
            setSentSplits(data.sentSplits);
            setTotalSplits(data.totalSplits || numSplits);
          }

          if (data.depositComplete || data.allSent) {
            setProcessingStatus(
              `All ${data.totalSplits || numSplits} splits processed!`
            );
            return { done: true, data };
          }

          const sent = data.sentSplits || 0;
          const total = data.totalSplits || numSplits;
          setProcessingStatus(`Processing splits (${sent}/${total})...`);
          return { done: false };
        },
        5000,
        600000,
        "POST",
        bearer
      );

      console.log(`[Deposit] Split queue done, deposit complete!`);

      // ============================================
      // STEP 5: Success!
      // ============================================
      setStep("success");
    } catch (err: any) {
      console.error("[Deposit] Error:", err);
      if (
        err.message?.includes("rejected") ||
        err.message?.includes("cancelled") ||
        err.message?.includes("User rejected")
      ) {
        setError("Transaction was cancelled");
      } else {
        setError(err.message || "Failed to process deposit");
      }
      setStep("failed");

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Reset & close                                                    */
  /* ---------------------------------------------------------------- */

  const handleReset = () => {
    setAmount("");
    setStep("form");
    setDepositId("");
    setTxSignature("");
    setError("");
    setProcessingStatus("");
    setTotalSplits(0);
    setSentSplits(0);
    isCancelledRef.current = false;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleClose = () => {
    if (step === "success" || step === "failed" || step === "form") {
      handleReset();
    }
    isCancelledRef.current = true;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    onClose();
  };

  /* ---------------------------------------------------------------- */
  /*  Progress                                                         */
  /* ---------------------------------------------------------------- */

  const getProgressPercent = (): number => {
    switch (step) {
      case "form":
        return 0;
      case "signing":
        return 10;
      case "submitting":
        return 20;
      case "waitingForFunds":
        return 30;
      case "splitting":
        return (
          30 + (totalSplits > 0 ? (sentSplits / totalSplits) * 65 : 0)
        );
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const minDeposit = 3;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[500px] mx-4 rounded-2xl border border-white/[0.08] bg-[#111118] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white/90">
                  Deposit Funds
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <AnimatePresence mode="wait">
                {/* ==================== FORM ==================== */}
                {step === "form" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Amount Input */}
                    <div>
                      <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        min="0"
                        max={MAX_AMOUNT}
                        className="w-full h-14 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-2xl font-mono text-white/90 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>

                    {/* Fee Breakdown */}
                    {amount && parseFloat(amount) >= minDeposit && (
                      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/30">Deposit amount</span>
                          <span className="text-white/90 font-medium font-mono">
                            ${parseFloat(amount).toFixed(2)} {token}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/30">Fee</span>
                          <span className="text-emerald-400 font-mono">
                            $0.00
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/30">
                            Network gas deposit
                          </span>
                          <span className="text-yellow-400 font-mono">
                            ~0.002 ETH
                          </span>
                        </div>

                        <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-white/90">
                            You will receive
                          </span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            ${parseFloat(amount).toFixed(2)} {token}
                          </span>
                        </div>

                        <p className="text-[11px] text-white/20 leading-tight">
                          Your deposit is split into 2-4 random parts for
                          privacy. No fees. A small ETH deposit (~0.002 ETH)
                          covers network gas. First deposit requires a {token}{" "}
                          approval.
                        </p>
                      </div>
                    )}

                    {/* Info block */}
                    <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4">
                      <p className="text-sm text-white/50">
                        Your deposit will be processed with privacy:
                      </p>
                      <ul className="text-sm text-white/50 mt-2 space-y-1">
                        <li>- Deposit to unique holding wallet</li>
                        <li>- Smart split into 2-4 random parts</li>
                        <li>
                          - Each part routed through intermediate wallet
                        </li>
                        <li>- Credited to your private balance</li>
                      </ul>
                      <p className="text-xs text-white/20 mt-2">
                        Minimum deposit: $3.00. Processing takes 1-3 minutes.
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleDeposit}
                      disabled={
                        !amount ||
                        parseFloat(amount) < minDeposit ||
                        parseFloat(amount) > MAX_AMOUNT ||
                        !connected
                      }
                      className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Deposit{" "}
                      {amount
                        ? `$${parseFloat(amount).toFixed(2)}`
                        : ""}{" "}
                      {token}
                    </button>
                  </motion.div>
                )}

                {/* ==================== SIGNING ==================== */}
                {step === "signing" && (
                  <motion.div
                    key="signing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                    <p className="text-lg font-semibold text-white/90">
                      Preparing Deposit
                    </p>
                    <p className="text-sm text-white/30 text-center">
                      {processingStatus ||
                        "Please approve the transaction in your wallet"}
                    </p>
                  </motion.div>
                )}

                {/* ==================== SUBMITTING ==================== */}
                {step === "submitting" && (
                  <motion.div
                    key="submitting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-6"
                  >
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                    <p className="text-lg font-semibold text-white/90">
                      Submitting Transaction
                    </p>
                    <p className="text-sm text-white/30 text-center">
                      {processingStatus || "Sending to Base network..."}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-violet-500 rounded-full"
                          initial={{ width: "10%" }}
                          animate={{ width: `${getProgressPercent()}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {txSignature && (
                      <a
                        href={`https://basescan.org/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-400 hover:underline"
                      >
                        View transaction on Basescan
                      </a>
                    )}
                  </motion.div>
                )}

                {/* ==================== WAITING FOR FUNDS ==================== */}
                {step === "waitingForFunds" && (
                  <motion.div
                    key="waitingForFunds"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-6"
                  >
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                    <p className="text-lg font-semibold text-white/90">
                      Detecting Funds
                    </p>

                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/30">
                          Transaction signed
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/30">
                          Submitted to blockchain
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/30">
                          Transaction confirmed
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                        <span className="text-sm text-white/90 font-medium">
                          {processingStatus ||
                            "Detecting funds in holding wallet..."}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-violet-500 rounded-full"
                          animate={{ width: `${getProgressPercent()}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {txSignature && (
                      <a
                        href={`https://basescan.org/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-400 hover:underline"
                      >
                        View transaction on Basescan
                      </a>
                    )}
                  </motion.div>
                )}

                {/* ==================== SPLITTING ==================== */}
                {step === "splitting" && (
                  <motion.div
                    key="splitting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-6"
                  >
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                    <p className="text-lg font-semibold text-white/90">
                      Processing Transfer
                    </p>

                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/30">
                          Transaction confirmed
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/30">
                          Funds detected in holding wallet
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                        <span className="text-sm text-white/90 font-medium">
                          Processing splits ({sentSplits}/{totalSplits})...
                        </span>
                      </div>
                    </div>

                    {/* Split progress */}
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs text-white/30 mb-1 font-mono">
                        <span>Splits sent</span>
                        <span>
                          {sentSplits}/{totalSplits}
                        </span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-violet-500 rounded-full"
                          animate={{
                            width:
                              totalSplits > 0
                                ? `${(sentSplits / totalSplits) * 100}%`
                                : "0%",
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/20">
                      <Clock className="w-3 h-3" />
                      <span>
                        Splits are staggered 30-60 seconds apart for privacy
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* ==================== SUCCESS ==================== */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                    <p className="text-lg font-semibold text-white/90">
                      Deposit Successful!
                    </p>
                    <p className="text-sm text-white/30 text-center">
                      Your funds have been split and routed through intermediate
                      wallets. Balance credited to your private account.
                    </p>
                    {txSignature && (
                      <a
                        href={`https://basescan.org/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:underline font-mono"
                      >
                        View transaction on Basescan
                      </a>
                    )}
                    <button
                      onClick={handleClose}
                      className="mt-4 px-6 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                )}

                {/* ==================== FAILED ==================== */}
                {step === "failed" && (
                  <motion.div
                    key="failed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    <AlertCircle className="w-16 h-16 text-red-400" />
                    <p className="text-lg font-semibold text-white/90">
                      Deposit Failed
                    </p>
                    <p className="text-sm text-white/30 text-center">
                      {error}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleReset}
                        className="px-6 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] text-white/90 text-sm font-medium transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleClose}
                        className="px-6 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DepositModal;
