const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // socketId -> { userId, showId, userInfo }
    this.showRooms = new Map(); // showId -> Set of socketIds
  }

  initialize(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    console.log('Socket.io initialized successfully');
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userId = decoded.userId || decoded.id;
        if (!userId) {
          console.error('JWT decoded but no user ID found:', decoded);
          return next(new Error('Invalid token: missing user ID'));
        }
        
        // Fetch user details from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userInfo = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userInfo.name} connected with socket ${socket.id}`);

      // Store client connection
      this.connectedClients.set(socket.id, {
        userId: socket.userId,
        userInfo: socket.userInfo,
        showId: null
      });

      // Handle joining a show room
      socket.on('join-show', (data) => {
        this.handleJoinShow(socket, data);
      });

      // Handle leaving a show room
      socket.on('leave-show', (data) => {
        this.handleLeaveShow(socket, data);
      });

      // Handle seat blocking
      socket.on('block-seats', (data) => {
        this.handleBlockSeats(socket, data);
      });

      // Handle seat unblocking
      socket.on('unblock-seats', (data) => {
        this.handleUnblockSeats(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleJoinShow(socket, data) {
    try {
      const { showId } = data;
      
      if (!showId) {
        socket.emit('error', { message: 'Show ID is required' });
        return;
      }

      // Leave previous show room if any
      const clientData = this.connectedClients.get(socket.id);
      if (clientData && clientData.showId) {
        this.leaveShowRoom(socket, clientData.showId);
      }

      // Join new show room
      this.joinShowRoom(socket, showId);
      
      console.log(`User ${socket.userInfo.name} joined show ${showId}`);
      
      // Send current seat availability
      this.sendSeatAvailability(socket, showId);
      
    } catch (error) {
      console.error('Error joining show:', error);
      socket.emit('error', { message: 'Failed to join show' });
    }
  }

  handleLeaveShow(socket, data) {
    try {
      const { showId } = data;
      const clientData = this.connectedClients.get(socket.id);
      
      if (clientData && clientData.showId === parseInt(showId)) {
        this.leaveShowRoom(socket, showId);
        console.log(`User ${socket.userInfo.name} left show ${showId}`);
      }
    } catch (error) {
      console.error('Error leaving show:', error);
    }
  }

  handleBlockSeats(socket, data) {
    // Call seat hold manager directly
    const seatHoldManager = require('./seatHoldManager');
    
    seatHoldManager.blockSeats(
      socket.userId,
      socket.id,
      data.showId,
      data.seats
    ).then(result => {
      socket.emit('seat-block-response', result);
    }).catch(error => {
      console.error('Error blocking seats:', error);
      socket.emit('seat-block-response', { success: false, error: error.message });
    });
  }

  handleUnblockSeats(socket, data) {
    // Call seat hold manager directly
    const seatHoldManager = require('./seatHoldManager');
    
    seatHoldManager.unblockSeats(
      socket.userId,
      socket.id,
      data.showId,
      data.seats
    ).then(result => {
      socket.emit('seat-unblock-response', result);
    }).catch(error => {
      console.error('Error unblocking seats:', error);
      socket.emit('seat-unblock-response', { success: false, error: error.message });
    });
  }

  handleDisconnect(socket) {
    console.log(`User ${socket.userInfo.name} disconnected`);
    
    const clientData = this.connectedClients.get(socket.id);
    if (clientData && clientData.showId) {
      this.leaveShowRoom(socket, clientData.showId);
    }
    
    this.connectedClients.delete(socket.id);
    
    // Clean up user's seat holds
    const seatHoldManager = require('./seatHoldManager');
    seatHoldManager.cleanupUserHolds(socket.userId, socket.id);
  }

  joinShowRoom(socket, showId) {
    const roomName = `show-${showId}`;
    socket.join(roomName);
    
    // Update client data
    const clientData = this.connectedClients.get(socket.id);
    if (clientData) {
      clientData.showId = parseInt(showId);
    }
    
    // Update show rooms tracking
    if (!this.showRooms.has(showId)) {
      this.showRooms.set(showId, new Set());
    }
    this.showRooms.get(showId).add(socket.id);
  }

  leaveShowRoom(socket, showId) {
    const roomName = `show-${showId}`;
    socket.leave(roomName);
    
    // Update client data
    const clientData = this.connectedClients.get(socket.id);
    if (clientData) {
      clientData.showId = null;
    }
    
    // Update show rooms tracking
    if (this.showRooms.has(showId)) {
      this.showRooms.get(showId).delete(socket.id);
      if (this.showRooms.get(showId).size === 0) {
        this.showRooms.delete(showId);
      }
    }
  }

  async sendSeatAvailability(socket, showId) {
    try {
      // This would typically fetch from seat hold manager and database
      // For now, emit a request for seat availability
      socket.emit('seat-availability-request', { showId });
    } catch (error) {
      console.error('Error sending seat availability:', error);
    }
  }

  // Broadcast methods for external use
  broadcastToShow(showId, event, data) {
    if (this.io) {
      this.io.to(`show-${showId}`).emit(event, data);
    }
  }

  broadcastSeatUpdate(showId, seatData) {
    this.broadcastToShow(showId, 'seats-updated', seatData);
  }

  broadcastSeatBlocked(showId, seatData) {
    this.broadcastToShow(showId, 'seats-blocked', seatData);
  }

  broadcastSeatUnblocked(showId, seatData) {
    this.broadcastToShow(showId, 'seats-unblocked', seatData);
  }

  broadcastBookingConfirmed(showId, bookingData) {
    this.broadcastToShow(showId, 'booking-confirmed', bookingData);
  }

  broadcastBookingCancelled(showId, bookingData) {
    this.broadcastToShow(showId, 'booking-cancelled', bookingData);
  }

  // Get connected clients for a show
  getShowClients(showId) {
    const roomSockets = this.showRooms.get(showId) || new Set();
    return Array.from(roomSockets).map(socketId => this.connectedClients.get(socketId));
  }

  // Get total connected clients
  getConnectedCount() {
    return this.connectedClients.size;
  }

  // Get shows with active clients
  getActiveShows() {
    return Array.from(this.showRooms.keys());
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;