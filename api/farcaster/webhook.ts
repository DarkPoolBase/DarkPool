/**
 * Farcaster Mini App Webhook
 * POST /api/farcaster/webhook
 *
 * Receives events from Farcaster when users add/remove the mini app
 * or enable/disable notifications. Stores notification tokens in Supabase
 * so the backend can send push notifications later.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body;

    if (!body || !body.event) {
      return res.status(400).json({ error: "Missing event field" });
    }

    const { event, fid } = body;

    switch (event) {
      case "miniapp_added":
      case "notifications_enabled": {
        const details = body.notificationDetails;
        if (details?.url && details?.token && fid && supabase) {
          await supabase.from("fc_notification_tokens").upsert(
            {
              fid,
              token: details.token,
              url: details.url,
              enabled: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "fid" },
          );
        }
        break;
      }

      case "notifications_disabled":
      case "miniapp_removed": {
        if (fid && supabase) {
          await supabase
            .from("fc_notification_tokens")
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq("fid", fid);
        }
        break;
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal error";
    console.error("Farcaster webhook error:", message);
    return res.status(500).json({ error: message });
  }
}
