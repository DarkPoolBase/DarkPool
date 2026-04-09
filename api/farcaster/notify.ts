/**
 * Farcaster Push Notification Sender
 * POST /api/farcaster/notify
 *
 * Internal endpoint called by the backend to send push notifications
 * to Farcaster users via their stored notification tokens.
 *
 * Body: { fids: number[], title: string, body: string, targetUrl?: string }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const INTERNAL_SECRET = process.env.FC_NOTIFY_SECRET || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Simple auth check for internal calls
  const authHeader = req.headers["x-notify-secret"] as string | undefined;
  if (INTERNAL_SECRET && authHeader !== INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { fids, title, body, targetUrl } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Fetch notification tokens for the requested fids (or all enabled if no fids)
    let query = supabase
      .from("fc_notification_tokens")
      .select("fid, token, url")
      .eq("enabled", true);

    if (fids && fids.length > 0) {
      query = query.in("fid", fids);
    }

    const { data: tokens, error } = await query;
    if (error) {
      console.error("Error fetching tokens:", error);
      return res.status(500).json({ error: "Failed to fetch tokens" });
    }

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({ success: true, sent: 0 });
    }

    // Group tokens by notification URL (usually the same Farcaster endpoint)
    const grouped = new Map<string, string[]>();
    for (const t of tokens) {
      const list = grouped.get(t.url) || [];
      list.push(t.token);
      grouped.set(t.url, list);
    }

    let totalSent = 0;
    const invalidTokens: string[] = [];

    for (const [url, tokenList] of grouped) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: crypto.randomUUID(),
          title,
          body,
          targetUrl: targetUrl || "https://darkpoolbase.org/miniapp",
          tokens: tokenList,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        totalSent += result.result?.successfulTokens?.length || 0;

        // Clean up invalid tokens
        if (result.result?.invalidTokens?.length > 0) {
          invalidTokens.push(...result.result.invalidTokens);
        }
      }
    }

    // Remove invalid tokens from DB
    if (invalidTokens.length > 0 && supabase) {
      await supabase
        .from("fc_notification_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return res.status(200).json({ success: true, sent: totalSent });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal error";
    console.error("Farcaster notify error:", message);
    return res.status(500).json({ error: message });
  }
}
