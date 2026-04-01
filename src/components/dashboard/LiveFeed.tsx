/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSettlements } from "@/hooks/useOrders";

interface FeedItem {
  title: string;
  detail: string;
  time: string;
  highlight: boolean;
}


function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function LiveFeed() {
  const { data: settlements } = useSettlements(6);

  const realFeedItems: FeedItem[] = settlements?.length
    ? settlements.map((s: any) => ({
        title: `Batch #${s.batchId} settled`,
        detail: `${parseFloat(s.totalVolume).toFixed(0)} GPU-hrs @ $${parseFloat(s.clearingPrice).toFixed(2)}/hr — ${s.numFills} fills`,
        time: s.settledAt ? new Date(s.settledAt).toLocaleTimeString() : 'Recent',
        highlight: false,
      }))
    : [];

  const [feedItems, setFeedItems] = useState<FeedItem[]>(realFeedItems);

  useEffect(() => {
    if (realFeedItems.length > 0) setFeedItems(realFeedItems);
  }, [settlements]);
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe("batch:settled", (data: unknown) => {
        const event = data as {
          batchId: number;
          clearingPrice: string;
          matchedVolume: string;
          timestamp: number;
        };
        const newItem: FeedItem = {
          title: `Batch #${event.batchId} settled`,
          detail: `${event.matchedVolume} GPU-hrs @ $${event.clearingPrice}/hr`,
          time: formatTimeAgo(event.timestamp),
          highlight: false,
        };
        setFeedItems((prev) => [newItem, ...prev.slice(0, 9)]);
      })
    );

    unsubs.push(
      subscribe("order:status", (data: unknown) => {
        const event = data as {
          orderId: string;
          status: string;
          fillPrice?: string;
          fillQty?: number;
        };
        if (event.status === "FILLED") {
          const newItem: FeedItem = {
            title: `Your order filled!`,
            detail: `${event.fillQty ?? 0} GPU-hrs @ $${event.fillPrice ?? "0"}/hr`,
            time: "Just now",
            highlight: true,
          };
          setFeedItems((prev) => [newItem, ...prev.slice(0, 9)]);
        }
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [subscribe]);

  return (
    <GlassCard delay={0.4} className="h-full">
      <div className="flex items-center gap-2 p-4">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Live Batch Settlements {!connected && "(connecting...)"}
        </span>
      </div>
      <div className="divide-y divide-white/5 max-h-[440px] overflow-y-auto">
        {feedItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-mono text-[11px] text-white/15">No settlements yet</p>
            <p className="font-mono text-[10px] text-white/10 mt-1">Batch settlements will appear here in real time</p>
          </div>
        ) : (
        <AnimatePresence>
          {feedItems.map((item, i) => (
            <motion.div
              key={`${item.title}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
              className={`px-4 py-4 transition-all duration-300 ease-out hover:bg-white/[0.02] ${
                item.highlight
                  ? "border-l-2 border-l-violet-500/60 bg-violet-500/[0.03]"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-xs ${item.highlight ? "text-violet-400" : "text-white/60"}`}>
                  {item.title}
                </span>
                <span className="font-mono text-[10px] text-white/20 tabular-nums">{item.time}</span>
              </div>
              <p className="text-[11px] text-white/30 font-mono tabular-nums">{item.detail}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}

