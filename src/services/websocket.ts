import { frontendConfig } from '../utils/config';

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private token: string | null = null;
  private isManuallyDisconnected = false;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  connect(token?: string) {
    this.token = token || null;
    this.isManuallyDisconnected = false;
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    const baseUrl = frontendConfig.WEBSOCKET_URL;
    const url = this.token ? `${baseUrl}?token=${this.token}` : baseUrl;
    
    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to:', baseUrl);
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000; // Reset interval
        this.emit('connected', { url: baseUrl });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.event, data.data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (!this.isManuallyDisconnected) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      this.emit('error', error);
      if (!this.isManuallyDisconnected) {
        this.attemptReconnect();
      }
    }
  }

  private attemptReconnect() {
    if (this.isManuallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Exponential backoff with jitter
      const baseInterval = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectInterval);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const interval = baseInterval + jitter;
      
      console.log(`🔄 Attempting to reconnect in ${Math.round(interval/1000)}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect(this.token || undefined);
      }, interval);
    } else {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
      this.emit('maxReconnectAttemptsReached', { attempts: this.maxReconnectAttempts });
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    
    // Clear any pending reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🔌 WebSocket manually disconnected');
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }

  // Force reconnect
  reconnect() {
    console.log('🔄 Manual reconnect requested');
    this.disconnect();
    setTimeout(() => {
      this.connect(this.token || undefined);
    }, 1000);
  }
}

export const websocketService = new WebSocketService();
export default websocketService; 