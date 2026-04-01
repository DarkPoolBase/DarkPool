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

const initialNotifications: Notification[] = [];

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
