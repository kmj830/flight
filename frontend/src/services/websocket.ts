import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TickResultDto } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/ws-airport` : 'http://localhost:8080/ws-airport');

export function createStompClient(
  onMessage: (data: TickResultDto) => void,
  onStatusChange?: (connected: boolean) => void
): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 2000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      onStatusChange?.(true);
      client.subscribe('/topic/simulation', (message) => {
        try {
          const payload: TickResultDto = JSON.parse(message.body);
          onMessage(payload);
        } catch (err) {
          console.error('WebSocket payload parse error:', err);
        }
      });
    },
    onDisconnect: () => {
      onStatusChange?.(false);
    },
    onStompError: (frame) => {
      console.warn('STOMP error:', frame);
      onStatusChange?.(false);
    },
    onWebSocketClose: () => {
      onStatusChange?.(false);
    }
  });

  return client;
}
