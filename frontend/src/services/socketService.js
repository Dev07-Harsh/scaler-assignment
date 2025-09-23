import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentShowId = null;
    this.listeners = new Map();
  }

  connect() {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.warn('No authentication token available for socket connection');
      return;
    }

    // Prevent multiple connections
    if (this.socket) {
      if (this.socket.connected || this.socket.connecting) {
        console.log('Socket already connected or connecting');
        return;
      } else {
        // Clean up dead socket
        this.socket.removeAllListeners();
        this.socket = null;
      }
    }

    console.log('Establishing new socket connection...');
    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      forceNew: true // Force a new connection
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Seat-related events
    this.socket.on('seats-updated', (data) => {
      console.log('Seats updated:', data);
      this.emit('seats-updated', data);
    });

    this.socket.on('seats-blocked', (data) => {
      console.log('Seats blocked:', data);
      this.emit('seats-blocked', data);
    });

    this.socket.on('seats-unblocked', (data) => {
      console.log('Seats unblocked:', data);
      this.emit('seats-unblocked', data);
    });

    this.socket.on('booking-confirmed', (data) => {
      console.log('Booking confirmed:', data);
      this.emit('booking-confirmed', data);
    });

    this.socket.on('booking-cancelled', (data) => {
      console.log('Booking cancelled:', data);
      this.emit('booking-cancelled', data);
    });

    // Seat availability response
    this.socket.on('seat-availability', (data) => {
      this.emit('seat-availability', data);
    });

    // Block/unblock responses
    this.socket.on('seat-block-response', (data) => {
      this.emit('seat-block-response', data);
    });

    this.socket.on('seat-unblock-response', (data) => {
      this.emit('seat-unblock-response', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentShowId = null;
    }
  }

  // Join a show room
  joinShow(showId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join show');
      return;
    }

    if (this.currentShowId === showId) {
      return; // Already in this show
    }

    // Leave current show if any
    if (this.currentShowId) {
      this.leaveShow(this.currentShowId);
    }

    this.currentShowId = showId;
    this.socket.emit('join-show', { showId });
    console.log(`Joined show ${showId}`);
  }

  // Leave a show room
  leaveShow(showId = null) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    const targetShowId = showId || this.currentShowId;
    if (targetShowId) {
      this.socket.emit('leave-show', { showId: targetShowId });
      if (targetShowId === this.currentShowId) {
        this.currentShowId = null;
      }
      console.log(`Left show ${targetShowId}`);
    }
  }

  // Block seats
  blockSeats(showId, seats) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot block seats');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Seat blocking timeout'));
      }, 5000);

      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off('seat-block-response', handleResponse);
        resolve(response);
      };

      this.on('seat-block-response', handleResponse);
      this.socket.emit('block-seats', { showId, seats });
    });
  }

  // Unblock seats
  unblockSeats(showId, seats = null) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot unblock seats');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Seat unblocking timeout'));
      }, 5000);

      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off('seat-unblock-response', handleResponse);
        resolve(response);
      };

      this.on('seat-unblock-response', handleResponse);
      this.socket.emit('unblock-seats', { showId, seats });
    });
  }

  // Get current seat availability
  getSeatAvailability(showId) {
    if (!this.socket || !this.isConnected) {
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Seat availability timeout'));
      }, 5000);

      const handleResponse = (response) => {
        clearTimeout(timeout);
        this.off('seat-availability', handleResponse);
        resolve(response);
      };

      this.on('seat-availability', handleResponse);
      this.socket.emit('get-seat-availability', { showId });
    });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getCurrentShow() {
    return this.currentShowId;
  }

  // Cleanup all listeners
  removeAllListeners() {
    this.listeners.clear();
  }
}

// Create singleton instance
const socketService = new SocketService();

// Auto-connect when auth state changes
let isListeningToAuth = false;
let isInitialized = false;

export const initializeSocket = () => {
  // Prevent multiple initializations (important for React StrictMode)
  if (isInitialized) {
    console.log('Socket service already initialized');
    return;
  }

  if (!isListeningToAuth) {
    const { subscribe } = useAuthStore;
    
    subscribe((state) => {
      if (state.isAuthenticated && state.token) {
        socketService.connect();
      } else {
        socketService.disconnect();
      }
    });
    
    isListeningToAuth = true;
  }

  // Connect immediately if already authenticated
  const { isAuthenticated, token } = useAuthStore.getState();
  if (isAuthenticated && token) {
    socketService.connect();
  }

  isInitialized = true;
  console.log('Socket service initialized');
};

export default socketService;