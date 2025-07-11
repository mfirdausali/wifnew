import { io, Socket } from 'socket.io-client';
import { authService } from '../api/auth';

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  transports: string[];
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private rooms: Set<string> = new Set();
  
  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || '',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      ...config,
    };
  }
  
  connect(): void {
    if (this.socket?.connected) return;
    
    const token = authService.getAccessToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }
    
    this.socket = io(this.config.url, {
      auth: { token },
      transports: this.config.transports,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
    });
    
    this.setupEventListeners();
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.rejoinRooms();
      this.emit('connection:established');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:lost', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection:error', error);
    });
    
    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', attemptNumber);
    });
    
    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.emit('connection:reconnect_error', error);
    });
    
    // Custom events
    this.socket.onAny((event, ...args) => {
      this.emit(event, ...args);
    });
  }
  
  private rejoinRooms(): void {
    if (!this.socket) return;
    
    this.rooms.forEach((room) => {
      this.socket!.emit('join', room);
    });
  }
  
  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }
  
  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return;
    
    if (handler) {
      this.eventHandlers.get(event)!.delete(handler);
    } else {
      this.eventHandlers.delete(event);
    }
  }
  
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
  
  // Room management
  joinRoom(room: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }
    
    this.socket.emit('join', room);
    this.rooms.add(room);
  }
  
  leaveRoom(room: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }
    
    this.socket.emit('leave', room);
    this.rooms.delete(room);
  }
  
  // Send message
  send(event: string, data: any, callback?: Function): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }
  
  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();