/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DarkPool Create Holding Wallet API
 * POST /api/zk/create-holding-wallet
 *
 * Creates a deterministic holding wallet address for the user to send their full deposit to.
 * Also builds the unsigned transaction for the user to sign (so frontend doesn't need RPC access).
 * Base chain only.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { isBaseChain } from '../lib/chain-config.js';
import {
  generateHoldingWallet,
  getUsdcAddress,
  getTokenAddress,
  getDepositRouterAddress,
  ERC20_ABI,
  DEPOSIT_ROUTER_ABI,
  isValidBaseAddress,
  getBaseProvider,
} from '../lib/void402-base.js';
import { getBaseIntermediateWalletPool } from '../lib/intermediate-wallet-pool-base.js';
import { ethers } from 'ethers';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { wallet, amount, token } = req.body;

    if (!wallet || !amount || !token) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'wallet, amount, and token are required'
      });
    }

    // Always partial privacy: split 2-4 parts, direct transfer holding → intermediate → pool
    const privacyLevel = 'partial';

    if (!['USDC', 'USDT'].includes(token)) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Token must be USDC or USDT'
      });
    }

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========== BASE CHAIN: EVM holding wallet ==========
    if (!isValidBaseAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Base wallet address' });
    }

    const depositId = `${wallet}_${Date.now()}_${token}`;
    const holdingWallet = generateHoldingWallet(depositId);
    const holdingAddress = holdingWallet.address;

    // Assign intermediate wallet from Base pool
    const intermediatePool = getBaseIntermediateWalletPool();
    await intermediatePool.initialize();
    const intermediateWallet = await intermediatePool.getAvailableWallet();

    // Store holding wallet in database
    const { error: dbError } = await supabase
      .from('zk_holding_wallets')
      .insert({
        deposit_id: depositId,
        user_wallet: wallet,
        holding_wallet_address: holdingAddress,
        amount: amount.toString(),
        token: token,
        token_mint: getTokenAddress(token),
        status: 'pending',
        privacy_level: privacyLevel,
      });

    if (dbError && dbError.code !== '23505' && !dbError.message?.includes('duplicate')) {
      console.error(`Failed to store Base holding wallet:`, dbError);
      return res.status(500).json({ error: 'Database error', message: dbError.message });
    }

    // Map user wallet to intermediate wallet
    const { data: existingMapping } = await supabase
      .from('zk_user_wallets')
      .select('intermediate_wallet')
      .eq('user_wallet', wallet)
      .maybeSingle();

    if (!existingMapping) {
      await supabase
        .from('zk_user_wallets')
        .insert({
          user_wallet: wallet,
          intermediate_wallet: intermediateWallet.address,
          token: token,
        });
    }

    console.log(`Base holding wallet created: ${depositId} -> ${holdingAddress}`);

    // Resolve the correct token address (USDC or USDT on Base)
    const tokenAddress = getTokenAddress(token);

    // Pre-check: verify user has sufficient token balance before building transaction
    const depositAmount = parseFloat(amount);
    const transferAmount = ethers.parseUnits(depositAmount.toString(), 6);
    try {
      const provider = getBaseProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const userBalance: bigint = await tokenContract.balanceOf(wallet);
      if (userBalance < transferAmount) {
        const userBalanceFormatted = ethers.formatUnits(userBalance, 6);
        return res.status(400).json({
          error: `Insufficient ${token} balance`,
          message: `Your wallet has ${userBalanceFormatted} ${token} but you're trying to deposit ${depositAmount} ${token}. Please reduce the deposit amount or add more ${token} to your wallet.`,
        });
      }
    } catch (balanceCheckErr: any) {
      console.warn(`Could not pre-check balance: ${balanceCheckErr.message}`);
      // Continue anyway -- the transaction will fail on-chain if balance is insufficient
    }

    // Build DepositRouter transaction: router.depositWithGas(token, holdingWallet, amount) + ETH
    const routerAddress = getDepositRouterAddress();
    const routerInterface = new ethers.Interface(DEPOSIT_ROUTER_ABI);
    const depositData = routerInterface.encodeFunctionData('depositWithGas', [
      tokenAddress,
      holdingAddress,
      transferAmount,
    ]);

    // ETH to forward to collection wallet for backend gas funding
    // Base gas is very cheap (~$0.01/tx), so minimal ETH needed
    const ethForGas = ethers.parseEther('0.0003'); // holding + intermediate wallet gas

    // Check if user needs to approve the router for this token (exact amount only)
    let needsApproval = false;
    let approveTransaction = undefined;
    try {
      const provider = getBaseProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const allowance = await tokenContract.allowance(wallet, routerAddress);
      if (allowance < transferAmount) {
        needsApproval = true;
        const erc20Interface = new ethers.Interface(ERC20_ABI);
        const approveData = erc20Interface.encodeFunctionData('approve', [
          routerAddress,
          transferAmount,
        ]);
        approveTransaction = {
          to: tokenAddress,
          data: approveData,
          value: '0x0',
        };
      }
    } catch (err: any) {
      console.warn(`Could not check allowance, assuming approval needed: ${err.message}`);
      needsApproval = true;
      const erc20Interface = new ethers.Interface(ERC20_ABI);
      const approveData = erc20Interface.encodeFunctionData('approve', [
        routerAddress,
        transferAmount,
      ]);
      approveTransaction = {
        to: tokenAddress,
        data: approveData,
        value: '0x0',
      };
    }

    return res.status(200).json({
      success: true,
      holdingWalletAddress: holdingAddress,
      depositId: depositId,
      amount: amount,
      token: token,
      privacy_level: privacyLevel,
      needsApproval,
      approveTransaction,
      evmTransaction: {
        to: routerAddress,
        data: depositData,
        value: '0x' + ethForGas.toString(16),
      },
      message: needsApproval
        ? 'Approve USDC spending first, then sign the deposit transaction.'
        : 'Sign this transaction to deposit USDC and ETH gas in a single transaction.',
    });

  } catch (error: any) {
    console.error('Error creating holding wallet:', error);
    return res.status(500).json({
      error: 'Failed to create holding wallet',
      message: error.message || 'Unknown error'
    });
  }
}
