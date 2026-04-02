/**
 * DarkPool ZK Balance API
 * GET /api/zk/balance?wallet=0x...
 *
 * Returns the user's deposit balance from zk_transactions table.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: "Database not configured" });
  }

  const wallet = req.query.wallet as string;
  if (!wallet) {
    return res.status(400).json({ success: false, error: "wallet query param required" });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sum all completed deposits for this wallet
    const { data: deposits, error: depError } = await supabase
      .from('zk_transactions')
      .select('amount')
      .ilike('sender_wallet', wallet)
      .eq('status', 'completed')
      .eq('transaction_type', 'deposit');

    if (depError) {
      console.error('[balance] Query error:', depError.message);
      return res.status(500).json({ success: false, error: 'Database query failed' });
    }

    const totalDeposited = (deposits || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Sum all completed withdrawals for this wallet
    const { data: withdrawals, error: wdError } = await supabase
      .from('zk_transactions')
      .select('amount')
      .ilike('sender_wallet', wallet)
      .eq('status', 'completed')
      .eq('transaction_type', 'withdrawal');

    const totalWithdrawn = wdError ? 0 : (withdrawals || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const balance = totalDeposited - totalWithdrawn;

    return res.status(200).json({
      success: true,
      balance: Math.max(0, balance),
      deposited: totalDeposited,
      withdrawn: totalWithdrawn,
    });
  } catch (error: any) {
    console.error('[balance] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Unknown error' });
  }
}
