import { useState, useCallback } from 'react';

export type NotificationType = 'order' | 'settlement' | 'alert' | 'system';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, type: 'order', title: 'Order Filled', message: '48 GPU-hrs H100 filled at $0.21/hr', time: '2m ago', unread: true },
  { id: 2, type: 'settlement', title: 'Settlement Confirmed', message: 'Tx 0x3f…a91c settled on Base', time: '8m ago', unread: true },
  { id: 3, type: 'alert', title: 'Price Alert', message: 'H100 spot price dropped below $0.20', time: '1h ago', unread: false },
  { id: 4, type: 'system', title: 'Auction Complete', message: 'Batch #142 cleared — 12 orders matched', time: '3h ago', unread: false },
  { id: 5, type: 'order', title: 'Order Submitted', message: '24 GPU-hrs A100 bid at $0.15/hr', time: '5h ago', unread: false },
  { id: 6, type: 'settlement', title: 'Settlement Pending', message: 'Tx 0x7b…e4d2 awaiting confirmation', time: '6h ago', unread: false },
  { id: 7, type: 'system', title: 'Maintenance Window', message: 'Scheduled maintenance completed successfully', time: '12h ago', unread: false },
  { id: 8, type: 'alert', title: 'Availability Update', message: 'RTX 4090 availability dropped to 45%', time: '1d ago', unread: false },
];

// Simple module-level state so header and page share the same data
let globalNotifications = [...initialNotifications];
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(fn => fn());
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
