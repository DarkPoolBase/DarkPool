/**
 * DarkPool Process Split Queue API
 * POST /api/zk/process-split-queue
 *
 * Processes queued splits that are ready to send.
 * Called by frontend polling to process staggered splits without timeout issues.
 *
 * Always uses direct transfer: holding -> intermediate -> pool (no mixer)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { isBaseChain } from '../lib/chain-config.js';
import {
  generateHoldingWallet,
  getBaseProvider,
  getTokenAddress,
  getContractAddress,
  ERC20_ABI,
} from '../lib/void402-base.js';
import { getBaseIntermediateWalletPool } from '../lib/intermediate-wallet-pool-base.js';
import { ethers } from 'ethers';

const ALLOWED_ORIGINS = [
  "https://darkpoolbase.org",
  "https://www.darkpoolbase.org",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getAllowedOrigin(origin: string | undefined): string {
  if (!origin) return "https://www.darkpoolbase.org";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.match(/^https:\/\/darkpoolweb[\w-]*\.vercel\.app/)) return origin;
  return "https://www.darkpoolbase.org";
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { depositId, wallet } = req.body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Find pending or failed (for retry) splits that are ready to send
    let query = supabase
      .from('zk_split_queue')
      .select('*')
      .or('status.eq.pending,status.eq.failed')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1);

    if (depositId) {
      query = query.eq('deposit_id', depositId);
    }
    if (wallet) {
      query = query.eq('user_wallet', wallet);
    }

    const { data: pendingSplits, error: queryError } = await query;

    if (queryError) {
      console.error('Error querying split queue:', queryError);
      return res.status(500).json({ error: 'Failed to query split queue' });
    }

    if (!pendingSplits || pendingSplits.length === 0) {
      // Check if there are upcoming pending splits
      const { data: upcomingSplits } = await supabase
        .from('zk_split_queue')
        .select('id, scheduled_at, split_index')
        .eq('status', 'pending')
        .eq('deposit_id', depositId || '')
        .order('scheduled_at', { ascending: true })
        .limit(5);

      // Check if all splits are sent
      const { data: allSplits } = await supabase
        .from('zk_split_queue')
        .select('id, status')
        .eq('deposit_id', depositId || '');

      const totalSplits = allSplits?.length || 0;
      const sentSplits = allSplits?.filter((s: any) => s.status === 'sent').length || 0;
      const failedSplits = allSplits?.filter((s: any) => s.status === 'failed').length || 0;

      // Always direct transfer (no mixer)
      const skipMixer = true;

      if (totalSplits > 0 && sentSplits === totalSplits) {
        return res.status(200).json({
          success: true,
          message: 'All splits completed (no mixer needed)',
          allSent: true,
          totalSplits,
          sentSplits,
          skipMixer: true,
          depositComplete: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'No splits ready to process yet',
        pendingSplits: upcomingSplits?.length || 0,
        nextScheduled: upcomingSplits?.[0]?.scheduled_at || null,
        totalSplits,
        sentSplits,
        failedSplits,
        skipMixer,
      });
    }

    const split = pendingSplits[0];

    // Check retry count for failed splits (max 3 retries)
    const retryCount = split.retry_count || 0;
    const MAX_RETRIES = 3;

    if (split.status === 'failed' && retryCount >= MAX_RETRIES) {
      console.log(`Split ${split.split_index + 1} has failed ${retryCount} times, marking as permanently failed`);
      await supabase
        .from('zk_split_queue')
        .update({ status: 'permanently_failed', updated_at: new Date().toISOString() })
        .eq('id', split.id);
      return res.status(200).json({
        success: false,
        message: 'Split permanently failed after max retries',
        splitId: split.id
      });
    }

    const isRetry = split.status === 'failed';
    if (isRetry) {
      console.log(`Retrying split ${split.split_index + 1} (attempt ${retryCount + 1}/${MAX_RETRIES}) for deposit ${split.deposit_id}`);
    } else {
      console.log(`Processing split ${split.split_index + 1} for deposit ${split.deposit_id}`);
    }

    // Mark as sending
    await supabase
      .from('zk_split_queue')
      .update({
        status: 'sending',
        retry_count: isRetry ? retryCount + 1 : retryCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', split.id);

    // =========================================================================
    // Direct transfer: holding → intermediate → pool (no mixer)
    // =========================================================================
    {
      const privacyLevel = 'partial';
      console.log(`PARTIAL PRIVACY: Processing direct transfer (holding → intermediate → pool)`);

      const provider = getBaseProvider();
      const holdingWallet = generateHoldingWallet(split.deposit_id);

      // Helper: sweep all remaining ETH from holding wallet back to collection wallet
      const sweepHoldingWalletETH = async () => {
        try {
          const collectionKey = process.env.COLLECTION_WALLET_PRIVATE_KEY_BASE;
          if (!collectionKey) return;
          const collectionAddress = new ethers.Wallet(collectionKey).address;
          const holdingEthRemaining = await provider.getBalance(holdingWallet.address);
          if (holdingEthRemaining === 0n) return;
          // Use block baseFee for accurate gas cost (legacy type 0 tx for reliability)
          const block = await provider.getBlock('latest');
          const baseFee = block?.baseFeePerGas || 0n;
          const gasPrice = baseFee + ethers.parseUnits("0.001", "gwei");
          const gasLimit = 21000n;
          const gasCost = gasPrice * gasLimit;
          // Leave 10% gas buffer to avoid rounding issues
          const sweepAmount = holdingEthRemaining - gasCost - (gasCost / 10n);
          if (sweepAmount <= 0n) {
            console.log(`Holding wallet ETH (${ethers.formatEther(holdingEthRemaining)}) too small to sweep after gas`);
            return;
          }
          const holdingSigner = new ethers.Wallet(holdingWallet.privateKey, provider);
          const nonce = await provider.getTransactionCount(holdingWallet.address);
          const sweepTx = await holdingSigner.sendTransaction({
            to: collectionAddress,
            value: sweepAmount,
            gasLimit,
            gasPrice,
            nonce,
            type: 0, // Legacy tx for reliable gas estimation
            chainId: 8453,
          });
          await sweepTx.wait();
          console.log(`Swept ${ethers.formatEther(sweepAmount)} ETH from holding wallet: ${sweepTx.hash}`);
        } catch (sweepErr: any) {
          console.warn(`ETH sweep failed (non-critical): ${sweepErr.message}`);
        }
      };

      try {
        const tokenAddress = getTokenAddress(split.token || 'USDC');
        const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS || '0x36077c43166a4eE59D5775FCe433393b43f2140a';
        const splitAmount = ethers.parseUnits(split.split_amount, 6);

        // Check holding wallet token balance
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const holdingBalance: bigint = await tokenContract.balanceOf(holdingWallet.address);

        // Get or assign intermediate wallet (needed for both fresh and retry flows)
        let { data: walletMapping } = await supabase
          .from('zk_user_wallets')
          .select('intermediate_wallet')
          .eq('user_wallet', split.user_wallet)
          .maybeSingle();

        let intermediateAddress: string;

        if (!walletMapping) {
          const intermediatePool = getBaseIntermediateWalletPool();
          await intermediatePool.initialize();
          const intermediateWallet = await intermediatePool.getAvailableWallet();
          intermediateAddress = intermediateWallet.address;

          await supabase
            .from('zk_user_wallets')
            .insert({ user_wallet: split.user_wallet, intermediate_wallet: intermediateAddress, token: split.token });
          console.log(`Auto-assigned Base intermediate wallet: ${intermediateAddress}`);
        } else {
          intermediateAddress = walletMapping.intermediate_wallet;
        }

        // Get intermediate wallet private key from pool
        const intermediatePool = getBaseIntermediateWalletPool();
        await intermediatePool.initialize();
        const intermediateWalletData = await intermediatePool.getWalletByAddress(intermediateAddress);

        if (!intermediateWalletData) {
          await supabase
            .from('zk_split_queue')
            .update({ status: 'failed', error_message: 'Intermediate wallet not found in Base pool', updated_at: new Date().toISOString() })
            .eq('id', split.id);
          return res.status(500).json({ error: 'Intermediate wallet not found' });
        }

        // Check if intermediate wallet already has tokens from a previous attempt
        // (e.g., holding->intermediate succeeded but pool deposit failed on retry)
        const intermediateBalance: bigint = await tokenContract.balanceOf(intermediateAddress);
        const alreadyTransferred = holdingBalance < splitAmount && intermediateBalance >= splitAmount;

        if (holdingBalance < splitAmount && !alreadyTransferred) {
          // No tokens in holding OR intermediate -- genuinely insufficient
          await sweepHoldingWalletETH(); // Reclaim any stranded ETH before failing
          await supabase
            .from('zk_split_queue')
            .update({ status: 'failed', error_message: `Insufficient balance: have ${holdingBalance}, need ${splitAmount}`, updated_at: new Date().toISOString() })
            .eq('id', split.id);
          return res.status(400).json({ error: 'Insufficient balance in holding wallet' });
        }

        if (alreadyTransferred) {
          console.log(`RETRY: Intermediate wallet already has ${ethers.formatUnits(intermediateBalance, 6)} ${split.token} from previous attempt, skipping transfer`);
          // Sweep any ETH stranded from the previous failed attempt
          await sweepHoldingWalletETH();
        } else {
          // STEP 1: Fund holding wallet with ETH for gas
          const ethNeeded = ethers.parseEther("0.0005");
          const holdingEthBalance = await provider.getBalance(holdingWallet.address);
          if (holdingEthBalance < ethNeeded) {
            const fundAmount = ethNeeded - holdingEthBalance;
            let funded = false;
            const funderKeys = [
              { name: 'collection', key: process.env.COLLECTION_WALLET_PRIVATE_KEY_BASE },
              { name: 'mixer', key: process.env.MIXER_WITHDRAWAL_WALLET_PRIVATE_KEY_BASE },
            ];
            for (const { name, key } of funderKeys) {
              if (!key || funded) continue;
              try {
                const funder = new ethers.Wallet(key, provider);
                const funderBalance = await provider.getBalance(funder.address);
                const estimatedGas = ethers.parseEther("0.00015");
                if (funderBalance < fundAmount + estimatedGas) {
                  console.warn(`  ${name} wallet (${funder.address.slice(0, 10)}...) insufficient ETH: ${ethers.formatEther(funderBalance)}`);
                  continue;
                }
                const fundTx = await funder.sendTransaction({ to: holdingWallet.address, value: fundAmount });
                await fundTx.wait();
                console.log(`Funded holding wallet with ${ethers.formatEther(fundAmount)} ETH from ${name} wallet: ${fundTx.hash}`);
                funded = true;
              } catch (fundErr: any) {
                console.warn(`  Failed to fund from ${name} wallet: ${fundErr.message}`);
              }
            }
            if (!funded) throw new Error('Cannot fund holding wallet with ETH - all funder wallets depleted');
          }

          // STEP 2: Holding -> Intermediate (ERC20 transfer)
          const holdingSigner = new ethers.Wallet(holdingWallet.privateKey, provider);
          const holdingToken = new ethers.Contract(tokenAddress, ERC20_ABI, holdingSigner);
          const tx1 = await holdingToken.transfer(intermediateAddress, splitAmount);
          await tx1.wait();
          console.log(`Holding -> Intermediate: ${tx1.hash}`);

          // STEP 2b: Sweep remaining ETH from holding wallet
          await sweepHoldingWalletETH();
        }

        // STEP 3: Fund intermediate with ETH for gas
        const intEthBalance = await provider.getBalance(intermediateAddress);
        const intEthNeeded = ethers.parseEther("0.001");
        if (intEthBalance < intEthNeeded) {
          const intFundAmount = intEthNeeded - intEthBalance;
          let intFunded = false;
          const intFunderKeys = [
            { name: 'collection', key: process.env.COLLECTION_WALLET_PRIVATE_KEY_BASE },
            { name: 'mixer', key: process.env.MIXER_WITHDRAWAL_WALLET_PRIVATE_KEY_BASE },
          ];
          for (const { name, key } of intFunderKeys) {
            if (!key || intFunded) continue;
            try {
              const funder = new ethers.Wallet(key, provider);
              const funderBalance = await provider.getBalance(funder.address);
              const estimatedGas = ethers.parseEther("0.00015");
              if (funderBalance < intFundAmount + estimatedGas) {
                console.warn(`  ${name} wallet (${funder.address.slice(0, 10)}...) insufficient ETH: ${ethers.formatEther(funderBalance)}`);
                continue;
              }
              const fundTx = await funder.sendTransaction({ to: intermediateAddress, value: intFundAmount });
              await fundTx.wait();
              console.log(`Funded intermediate with ${ethers.formatEther(intFundAmount)} ETH from ${name} wallet: ${fundTx.hash}`);
              intFunded = true;
            } catch (fundErr: any) {
              console.warn(`  Failed to fund from ${name} wallet: ${fundErr.message}`);
            }
          }
          if (!intFunded) throw new Error('Cannot fund intermediate wallet with ETH - all funder wallets depleted');
        }

        // STEP 4: Intermediate -> Escrow (approve + depositFor on behalf of user)
        const intSigner = new ethers.Wallet(intermediateWalletData.privateKey, provider);
        const intToken = new ethers.Contract(tokenAddress, ERC20_ABI, intSigner);
        const escrowAbi = ['function depositFor(address user, uint256 amount) external'];
        const escrow = new ethers.Contract(escrowAddress, escrowAbi, intSigner);

        const approveTx = await intToken.approve(escrowAddress, splitAmount);
        await approveTx.wait();
        console.log(`Intermediate approve to Escrow: ${approveTx.hash}`);

        const depositTx = await escrow.depositFor(split.user_wallet, splitAmount);
        const depositReceipt = await depositTx.wait();
        console.log(`Intermediate -> Escrow depositFor(${split.user_wallet}): ${depositReceipt.hash}`);

        // Mark split as sent
        await supabase
          .from('zk_split_queue')
          .update({
            status: 'sent',
            transaction_signature: depositReceipt.hash,
            exchange_id: `direct_${privacyLevel}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', split.id);

        // Record in zk_transactions
        const amountInCurrency = Number(splitAmount) / 1e6;
        const { error: txError } = await supabase.from('zk_transactions').insert({
          sender_wallet: split.user_wallet,
          recipient_wallet: split.user_wallet,
          amount: amountInCurrency,
          fee_percentage: 0,
          token_symbol: split.token,
          tx_hash: depositReceipt.hash,
          status: 'completed',
          privacy_level: privacyLevel,
          transaction_type: 'deposit',
        });
        if (txError) {
          console.warn(`Failed to log transaction:`, txError.message);
        }

        // Check if all splits are done
        const { data: allSplits } = await supabase
          .from('zk_split_queue')
          .select('id, status')
          .eq('deposit_id', split.deposit_id);

        const totalSplits = allSplits?.length || 1;
        const sentSplits = allSplits?.filter((s: any) => s.status === 'sent').length || 1;
        const pendingSplits = allSplits?.filter((s: any) => s.status === 'pending').length || 0;
        const allSent = totalSplits > 0 && sentSplits === totalSplits;

        if (allSent) {
          await supabase
            .from('zk_holding_wallets')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('deposit_id', split.deposit_id);
          console.log(`Base ${privacyLevel.toUpperCase()} ALL ${totalSplits} splits completed!`);
        }

        return res.status(200).json({
          success: true,
          message: allSent
            ? `${privacyLevel.charAt(0).toUpperCase() + privacyLevel.slice(1)} deposit completed (no mixer)`
            : `Split ${split.split_index + 1}/${totalSplits} completed`,
          splitIndex: split.split_index + 1,
          signature: depositReceipt.hash,
          totalSplits,
          sentSplits,
          pendingSplits,
          allSent,
          depositComplete: allSent,
          skipMixer: true,
          privacyLevel,
        });

      } catch (error: any) {
        console.error(`Base ${privacyLevel.toUpperCase()} direct transfer failed:`, error);
        // Always try to sweep stranded ETH from holding wallet on failure
        await sweepHoldingWalletETH();
        await supabase
          .from('zk_split_queue')
          .update({ status: 'failed', error_message: error.message || 'Unknown error', updated_at: new Date().toISOString() })
          .eq('id', split.id);
        return res.status(500).json({ success: false, error: error.message || 'Failed to process direct transfer', privacyLevel });
      }
    }

  } catch (error: any) {
    console.error('Process split queue error:', error);
    return res.status(500).json({ error: 'Failed to process split queue', message: error.message || 'Unknown error' });
  }
}
