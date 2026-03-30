import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001/ws';

interface BatchPhaseEvent {
  batchId: number;
  phase: string;
  endsAt: number;
}

interface BatchSettledEvent {
  batchId: number;
  clearingPrice: string;
  matchedVolume: string;
  txHash: string;
  timestamp: number;
}

interface OrderStatusEvent {
  orderId: string;
  status: string;
  fillPrice?: string;
  fillQty?: number;
}

interface MarketPriceEvent {
  gpuType: string;
  price: string;
  change24h: number;
}

export type WsEvent =
  | { type: 'batch:phase'; data: BatchPhaseEvent }
  | { type: 'batch:settled'; data: BatchSettledEvent }
  | { type: 'order:status'; data: OrderStatusEvent }
  | { type: 'market:price'; data: MarketPriceEvent };

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('adp_access_token');

    const socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const events = ['batch:phase', 'batch:settled', 'order:status', 'market:price', 'provider:status'] as const;

    for (const event of events) {
      socket.on(event, (data: unknown) => {
        setLastEvent({ type: event, data } as WsEvent);
        const listeners = listenersRef.current.get(event);
        if (listeners) {
          listeners.forEach((cb) => cb(data));
        }
      });
    }

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  return { connected, lastEvent, subscribe, socket: socketRef.current };
}
