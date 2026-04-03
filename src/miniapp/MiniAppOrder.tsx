import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, encodePacked, keccak256 } from 'viem';
import { base } from 'wagmi/chains';
import { useMarketPrices } from '@/hooks/useMarket';
import { useCreateOrder } from '@/hooks/useOrders';
import { CONTRACTS } from '@/config/contracts';
import { ESCROW_ABI, ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';

const USDC_DECIMALS = 6;

function generateSecret(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export function MiniAppOrder() {
  const { gpuType } = useParams<{ gpuType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const side = (searchParams.get('side') || 'buy').toUpperCase() as 'BUY' | 'SELL';
  const gpuKey = (gpuType || 'h100').toUpperCase();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: prices } = useMarketPrices();
  const createOrder = useCreateOrder();

  const [duration, setDuration] = useState(1);
  const [pricePerHour, setPricePerHour] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const marketPrice = useMemo(() => {
    const p = prices?.find((x) => x.gpuType === gpuKey);
    return p ? parseFloat(p.price) : 0;
  }, [prices, gpuKey]);

  // Default price to market price
  const effectivePrice = pricePerHour ? parseFloat(pricePerHour) : marketPrice;
  const totalCost = effectivePrice * duration;

  // Approve USDC
  const { writeContractAsync: approveUsdc } = useWriteContract();
  // Deposit to escrow
  const { writeContractAsync: depositEscrow } = useWriteContract();

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) connect({ connector });
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      handleConnect();
      return;
    }

    if (!effectivePrice || effectivePrice <= 0 || duration <= 0) {
      toast.error('Invalid price or duration');
      return;
    }

    setSubmitting(true);
    try {
      const secret = generateSecret();
      const priceInUnits = parseUnits(effectivePrice.toString(), USDC_DECIMALS);
      const escrowAmount = parseUnits(totalCost.toFixed(USDC_DECIMALS), USDC_DECIMALS);

      // Generate commitment hash
      const commitmentHash = keccak256(
        encodePacked(
          ['string', 'uint256', 'uint256', 'uint256', 'bool', 'bytes32'],
          [gpuKey, BigInt(1), priceInUnits, BigInt(duration), side === 'BUY', secret],
        ),
      );

      if (side === 'BUY') {
        // Approve USDC spend
        toast.info('Approve USDC spend...');
        await approveUsdc({
          address: CONTRACTS.USDC as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.ESCROW as `0x${string}`, escrowAmount],
          chainId: base.id,
        });

        // Deposit to escrow
        toast.info('Depositing to escrow...');
        await depositEscrow({
          address: CONTRACTS.ESCROW as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'depositFor',
          args: [address as `0x${string}`, escrowAmount],
          chainId: base.id,
        });
      }

      // Submit order to backend
      await createOrder.mutateAsync({
        side,
        gpuType: gpuKey,
        quantity: 1,
        pricePerHour: effectivePrice,
        duration,
        commitmentHash,
      });

      toast.success('Order submitted!');
      navigate('/miniapp/orders');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/miniapp')}
        className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-mono text-[11px]">Back</span>
      </button>

      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">
          <span className={side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{side}</span>
          {' '}{gpuKey}
        </h2>
        <p className="font-mono text-[10px] text-white/30">
          Market price: ${marketPrice.toFixed(2)}/hr
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Price */}
        <div>
          <label className="font-mono text-[10px] text-white/40 mb-1 block">Price per hour (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0.001"
            max="100"
            placeholder={marketPrice.toFixed(2)}
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="font-mono text-[10px] text-white/40 mb-1 block">Duration (hours)</label>
          <div className="flex gap-2">
            {[1, 4, 8, 24].map((h) => (
              <button
                key={h}
                onClick={() => setDuration(h)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono border transition-colors ${
                  duration === h
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-white/[0.06] bg-white/[0.02] text-white/40'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          <input
            type="range"
            min="1"
            max="720"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full mt-2 accent-primary"
          />
          <div className="flex justify-between font-mono text-[9px] text-white/20 mt-0.5">
            <span>1h</span>
            <span>{duration}h selected</span>
            <span>720h</span>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/30">GPU</span>
            <span className="text-white/60">{gpuKey}</span>
          </div>
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/30">Quantity</span>
            <span className="text-white/60">1</span>
          </div>
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/30">Price</span>
            <span className="text-white/60">${effectivePrice.toFixed(2)}/hr</span>
          </div>
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/30">Duration</span>
            <span className="text-white/60">{duration}h</span>
          </div>
          <div className="border-t border-white/[0.06] pt-2 flex justify-between font-mono text-xs">
            <span className="text-white/40">Total</span>
            <span className="text-white font-semibold">${totalCost.toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Submit */}
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="w-full py-3 rounded-xl text-sm font-mono font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !effectivePrice}
            className={`w-full py-3 rounded-xl text-sm font-mono font-semibold transition-colors ${
              side === 'BUY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              `${side} ${gpuKey} — $${totalCost.toFixed(2)} USDC`
            )}
          </button>
        )}

        {isConnected && (
          <p className="font-mono text-[9px] text-white/20 text-center">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        )}
      </div>
    </div>
  );
}
