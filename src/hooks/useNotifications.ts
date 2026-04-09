import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

export type NotificationType = 'order' | 'settlement' | 'alert' | 'system';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const MAX_NOTIFICATIONS = 50;

// Simple module-level state so header and page share the same data
let globalNotifications: Notification[] = [];
let nextId = 1;
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(fn => fn());
}

export function addNotification(type: NotificationType, title: string, message: string) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  globalNotifications = [
    { id: nextId++, type, title, message, time, unread: true },
    ...globalNotifications,
  ].slice(0, MAX_NOTIFICATIONS);
  notify();
}

export function useNotifications() {
  const [, setTick] = useState(0);

  // Subscribe to changes
  useState(() => {
    const listener = () => setTick(t => t + 1);
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  });

  const markAllRead = useCallback(() => {
    globalNotifications = globalNotifications.map(n => ({ ...n, unread: false }));
    notify();
  }, []);

  const markRead = useCallback((id: number) => {
    globalNotifications = globalNotifications.map(n =>
      n.id === id ? { ...n, unread: false } : n
    );
    notify();
  }, []);

  const unreadCount = globalNotifications.filter(n => n.unread).length;

  return {
    notifications: globalNotifications,
    unreadCount,
    markAllRead,
    markRead,
  };
}

/**
 * Hook that wires WebSocket events to the in-app notification system.
 * Mount once near the app root (e.g. in DashboardLayout).
 */
export function useNotificationListener() {
  const { subscribe } = useWebSocket();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const unsubs: Array<() => void> = [];

    // Order status changes
    unsubs.push(
      subscribe('order:status', (data: unknown) => {
        const evt = data as { type?: string; status?: string; orderId?: string; side?: string; gpuType?: string; clearingPrice?: string };
        if (evt.type === 'order:filled' || evt.status === 'FILLED') {
          addNotification(
            'order',
            'Order Filled',
            `Your ${evt.side || ''} order${evt.gpuType ? ` for ${evt.gpuType}` : ''} was filled${evt.clearingPrice ? ` at $${evt.clearingPrice}/hr` : ''}.`,
          );
        } else if (evt.status === 'CANCELLED') {
          addNotification(
            'order',
            'Order Cancelled',
            `Order ${evt.orderId?.slice(0, 8) || ''} has been cancelled.`,
          );
        } else if (evt.status === 'ACTIVE') {
          addNotification(
            'order',
            'Order Placed',
            `Your ${evt.side || ''} order${evt.gpuType ? ` for ${evt.gpuType}` : ''} is now active.`,
          );
        }
      }),
    );

    // Batch settlement events
    unsubs.push(
      subscribe('batch:settled', (data: unknown) => {
        const evt = data as { batchId?: number; gpuType?: string; clearingPrice?: string; matchedVolume?: string; numFills?: number };
        addNotification(
          'settlement',
          'Batch Settled',
          `Batch #${evt.batchId || '?'}${evt.gpuType ? ` (${evt.gpuType})` : ''} settled at $${evt.clearingPrice || '?'}/hr — ${evt.numFills || 0} fills.`,
        );
      }),
    );

    // Market price alerts
    unsubs.push(
      subscribe('market:price', (data: unknown) => {
        const evt = data as { gpuType?: string; price?: string; change24h?: number };
        if (evt.change24h && Math.abs(evt.change24h) >= 10) {
          addNotification(
            'alert',
            'Price Alert',
            `${evt.gpuType || 'GPU'} price moved ${evt.change24h > 0 ? '+' : ''}${evt.change24h.toFixed(1)}% to $${evt.price || '?'}/hr.`,
          );
        }
      }),
    );

    return () => unsubs.forEach(fn => fn());
  }, [subscribe]);
}
