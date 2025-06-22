export class SocketManager {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate
      this.send({
        type: 'authenticate',
        token: this.token,
      });
    };

    this.socket.onclose = () => {
      console.log('Socket disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('Socket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, delay);
    }
  }

  public send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  public onMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
