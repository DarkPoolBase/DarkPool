import { Bell, Package, ArrowRightLeft, AlertTriangle, ShieldCheck, CheckCheck } from "lucide-react";
import { useNotifications, type NotificationType } from "@/hooks/useNotifications";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const notifIcon: Record<NotificationType, typeof Package> = {
  order: Package,
  settlement: ArrowRightLeft,
  alert: AlertTriangle,
  system: ShieldCheck,
};

const notifColor: Record<NotificationType, string> = {
  order: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  settlement: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  alert: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  system: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const notifLabel: Record<NotificationType, string> = {
  order: 'Order',
  settlement: 'Settlement',
  alert: 'Alert',
  system: 'System',
};

const Notifications = () => {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-thin tracking-tight text-foreground">Notifications</h1>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="gap-2 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <GlassCard delay={0} className="overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map((n, i) => {
              const Icon = notifIcon[n.type];
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${n.unread ? 'bg-violet-500/[0.03]' : ''}`}
                >
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${notifColor[n.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/85">{n.title}</span>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />}
                      <span className={`ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border ${notifColor[n.type]}`}>
                        {notifLabel[n.type]}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 font-mono mt-1">{n.message}</p>
                    <span className="text-[10px] text-white/15 font-mono mt-1.5 block">{n.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Notifications;
