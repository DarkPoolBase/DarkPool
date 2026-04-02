/**
 * DarkPool Auto Split and Exchange API
 * POST /api/zk/auto-split-and-exchange
 *
 * Detects when funds arrive in holding wallet, then queues splits
 * with staggered send times for enhanced privacy.
 *
 * QUEUE-BASED APPROACH:
 * - Calculates splits and inserts them into a queue table
 * - Each split has a scheduled_at time (1-3 minutes apart)
 * - Returns immediately without waiting (no timeout issues)
 * - Frontend polls /api/zk/process-split-queue to process each split
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { isBaseChain } from '../lib/chain-config.js';
import { generateHoldingWallet, getTokenAddress, getBaseProvider, ERC20_ABI } from '../lib/void402-base.js';
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
    const { depositId } = req.body;

    if (!depositId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'depositId is required'
      });
    }

    console.log(`AUTO-SPLIT: Checking holding wallet for deposit ${depositId}`);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Get deposit info from database
    const { data: depositData, error: dbError } = await supabase
      .from('zk_holding_wallets')
      .select('*')
      .eq('deposit_id', depositId)
      .single();

    if (dbError || !depositData) {
      return res.status(404).json({
        error: 'Deposit not found',
        message: `No deposit found with ID: ${depositId}`
      });
    }

    const userWallet = depositData.user_wallet;
    if (!userWallet) {
      return res.status(400).json({ error: 'Invalid deposit', message: 'No user wallet' });
    }

    // Always partial privacy: split 2-4 parts with 30-60s delays, direct transfer
    const privacyLevel = 'partial';

    // If already completed, return early
    if (depositData.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: `Deposit ${depositId} is already completed`,
        status: depositData.status
      });
    }

    // Check if splits are already queued
    const { data: existingQueue } = await supabase
      .from('zk_split_queue')
      .select('id, status, scheduled_at, split_index')
      .eq('deposit_id', depositId)
      .order('split_index', { ascending: true });

    if (existingQueue && existingQueue.length > 0) {
      const totalSplits = existingQueue.length;
      const sentSplits = existingQueue.filter((s: any) => s.status === 'sent').length;
      const pendingSplits = existingQueue.filter((s: any) => s.status === 'pending').length;
      const failedSplits = existingQueue.filter((s: any) => s.status === 'failed').length;
      const nextPending = existingQueue.find((s: any) => s.status === 'pending');

      if (sentSplits === totalSplits) {
        await supabase
          .from('zk_holding_wallets')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('deposit_id', depositId);

        return res.status(200).json({
          success: true,
          message: 'All splits have been sent to Privacy Mixer',
          allSent: true,
          numSplits: totalSplits,
          pollQueue: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Splits queued: ${sentSplits}/${totalSplits} sent`,
        numSplits: totalSplits,
        sentSplits,
        pendingSplits,
        failedSplits,
        nextScheduled: nextPending?.scheduled_at || null,
        pollQueue: true,
      });
    }

    // ========== Check holding wallet balance (Base chain ERC20) ==========
    const holdingWallet = generateHoldingWallet(depositId);
    const tokenAddress = getTokenAddress(depositData.token || 'USDC');
    const provider = getBaseProvider();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance: bigint = await tokenContract.balanceOf(holdingWallet.address);

    if (balance === 0n) {
      return res.status(200).json({
        success: false,
        message: 'No funds detected in holding wallet yet',
        holdingWalletAddress: holdingWallet.address,
        depositId: depositId,
      });
    }

    const actualAmount = balance;

    // Verify amount is close to expected
    const originalExpectedAmount = BigInt(Math.floor(parseFloat(depositData.amount) * 1_000_000));
    const tolerance = BigInt(1000);
    const minRequiredAmount = originalExpectedAmount > tolerance ? originalExpectedAmount - tolerance : originalExpectedAmount;

    if (actualAmount < minRequiredAmount) {
      const holdingAddr = generateHoldingWallet(depositId).address;
      console.log(`AUTO-SPLIT: Insufficient funds - Expected: ${originalExpectedAmount.toString()}, Received: ${actualAmount.toString()}`);
      return res.status(200).json({
        success: false,
        message: 'Insufficient funds received',
        holdingWalletAddress: holdingAddr,
        depositId: depositId,
        expectedAmount: originalExpectedAmount.toString(),
        actualAmount: actualAmount.toString(),
      });
    }

    console.log(`AUTO-SPLIT: Detected ${(Number(actualAmount) / 1e6).toFixed(6)} ${depositData.token} in holding wallet`);

    // =========================================================================
    // PARTIAL PRIVACY: Split 2-4 parts with 30-60s delays, direct transfer
    // =========================================================================
    console.log(`PARTIAL PRIVACY: Splitting into 2-4 parts with staggered timing`);

    // Calculate splits
    const PRIVACY_EXCHANGE_MIN = BigInt(3_000_000); // $3 minimum
    const maxPossibleSplits = Math.floor(Number(actualAmount) / Number(PRIVACY_EXCHANGE_MIN));

    let numSplits: number;
    if (maxPossibleSplits < 2) {
      if (actualAmount >= PRIVACY_EXCHANGE_MIN) {
        numSplits = 1;
      } else {
        await supabase
          .from('zk_holding_wallets')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('deposit_id', depositId);
        return res.status(200).json({
          success: false,
          message: `Amount is below minimum required for privacy exchange ($${Number(PRIVACY_EXCHANGE_MIN) / 1e6})`,
          amount: actualAmount.toString(),
          minimum: PRIVACY_EXCHANGE_MIN.toString()
        });
      }
    } else if (maxPossibleSplits >= 4) {
      numSplits = 2 + Math.floor(Math.random() * 3); // 2-4 splits
    } else {
      numSplits = 2;
    }

    numSplits = Math.min(numSplits, maxPossibleSplits);

    // Calculate split amounts
    const splits: bigint[] = [];

    if (numSplits === 1) {
      splits.push(actualAmount);
    } else {
      let remainingAmount = actualAmount;

      for (let i = 0; i < numSplits - 1; i++) {
        const remainingSplits = numSplits - i;
        const minRequiredForRemaining = PRIVACY_EXCHANGE_MIN * BigInt(remainingSplits);
        const maxAllowedForThisSplit = remainingAmount - minRequiredForRemaining + PRIVACY_EXCHANGE_MIN;

        const minForThisSplit = Number(PRIVACY_EXCHANGE_MIN);
        const maxForThisSplit = Number(maxAllowedForThisSplit);
        const randomAmount = BigInt(Math.floor(minForThisSplit + (Math.random() * (maxForThisSplit - minForThisSplit))));

        splits.push(randomAmount);
        remainingAmount -= randomAmount;
      }
      splits.push(remainingAmount);

      // Shuffle splits for privacy
      for (let i = splits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [splits[i], splits[j]] = [splits[j], splits[i]];
      }
    }

    console.log(`PRIVACY: Queueing ${numSplits} splits with 30-60 second delays:`,
      splits.map(s => `${(Number(s) / 1e6).toFixed(6)} ${depositData.token}`));

    // Queue splits with staggered times (30-60 seconds apart)
    const now = new Date();
    const queuedSplits = [];

    for (let i = 0; i < splits.length; i++) {
      const delayMs = i === 0 ? 0 : (30000 + Math.floor(Math.random() * 30000));
      const scheduledAt = new Date(now.getTime() + (i === 0 ? 0 : (i * 30000 + delayMs)));

      const splitData = {
        deposit_id: depositId,
        user_wallet: userWallet,
        token: depositData.token,
        split_index: i,
        split_amount: (Number(splits[i]) / 1e6).toFixed(6),
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        privacy_level: 'partial',
      };

      const { error: insertError } = await supabase
        .from('zk_split_queue')
        .insert(splitData);

      if (insertError) {
        // Try without privacy_level column (backwards compat)
        const { error: retryError } = await supabase
          .from('zk_split_queue')
          .insert({
            deposit_id: depositId,
            user_wallet: userWallet,
            token: depositData.token,
            split_index: i,
            split_amount: (Number(splits[i]) / 1e6).toFixed(6),
            scheduled_at: scheduledAt.toISOString(),
            status: 'pending',
          });
        if (retryError) {
          console.error(`Failed to queue split ${i + 1}:`, retryError);
          continue;
        }
      }

      queuedSplits.push({
        splitIndex: i + 1,
        amount: (Number(splits[i]) / 1e6).toFixed(6),
        scheduledAt: scheduledAt.toISOString(),
      });

      console.log(`Queued split ${i + 1}/${numSplits}: ${(Number(splits[i]) / 1e6).toFixed(6)} ${depositData.token} at ${scheduledAt.toISOString()}`);
    }

    // Mark holding wallet as processing
    await supabase
      .from('zk_holding_wallets')
      .update({
        status: 'processing',
        num_splits: numSplits,
        updated_at: new Date().toISOString()
      })
      .eq('deposit_id', depositId);

    console.log(`AUTO-SPLIT: Queued ${queuedSplits.length} splits for deposit ${depositId}`);

    return res.status(200).json({
      success: true,
      message: `Queued ${queuedSplits.length} splits with staggered timing`,
      numSplits: queuedSplits.length,
      splits: queuedSplits,
      pollQueue: true,
      depositId: depositId,
    });

  } catch (error: any) {
    console.error('AUTO-SPLIT error:', error);
    return res.status(500).json({
      error: 'Failed to process auto-split',
      message: error.message || 'Unknown error'
    });
  }
}
