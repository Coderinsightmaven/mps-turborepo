import { WebSocketEvent, WebSocketMessage } from '@repo/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Map<WebSocketEvent, Set<(data: any) => void>>();
  private currentMatchId: string | null = null;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;

        // Rejoin match if we were in one
        if (this.currentMatchId) {
          this.joinMatch(this.currentMatchId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.event);
    if (listeners) {
      listeners.forEach((callback) => callback(message.data));
    }
  }

  on(event: WebSocketEvent, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: WebSocketEvent, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  send(event: WebSocketEvent, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: new Date(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  joinMatch(matchId: string) {
    this.currentMatchId = matchId;
    this.send(WebSocketEvent.JOIN_MATCH, { matchId });
  }

  leaveMatch(matchId: string) {
    this.send(WebSocketEvent.LEAVE_MATCH, { matchId });
    this.currentMatchId = null;
  }

  scorePoint(matchId: string, pointWinner: 1 | 2) {
    this.send(WebSocketEvent.SCORE_POINT, { matchId, pointWinner });
  }

  undoPoint(matchId: string) {
    this.send(WebSocketEvent.UNDO_POINT, { matchId });
  }

  startMatch(matchId: string) {
    this.send(WebSocketEvent.START_MATCH, { matchId });
  }

  disconnect() {
    if (this.currentMatchId) {
      this.leaveMatch(this.currentMatchId);
    }
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new WebSocketClient();

