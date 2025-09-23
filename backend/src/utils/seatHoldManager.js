const prisma = require('../config/prismaClient');
const { validateSeats, dbSeatsToLabels, seatsToDbFormat } = require('./seats');

class SeatHoldManager {
  constructor() {
    // In-memory storage: showId -> { seatLabel: { userId, socketId, expiresAt, createdAt } }
    this.seatHolds = new Map();
    
    // Hold duration in milliseconds (2 minutes)
    this.holdDuration = 2 * 60 * 1000; // 2 minutes
    
    // Cleanup interval (30 seconds)
    this.cleanupInterval = 30 * 1000; // 30 seconds
    
    // Socket manager reference
    this.socketManager = null;
    
    // Start cleanup timer
    this.startCleanupTimer();
    
    console.log('SeatHoldManager initialized');
  }

  setSocketManager(socketManager) {
    this.socketManager = socketManager;
  }

  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredHolds();
    }, this.cleanupInterval);
  }

  async blockSeats(userId, socketId, showId, seatLabels) {
    try {
      // Validate seats
      const validation = validateSeats(seatLabels);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
          invalidSeats: validation.invalidSeats
        };
      }

      // Normalize seat labels
      const normalizedSeats = seatLabels.map(seat => seat.toUpperCase());
      
      // Check if show exists
      const show = await prisma.show.findUnique({
        where: { id: parseInt(showId) },
        select: { id: true }
      });

      if (!show) {
        return {
          success: false,
          message: 'Show not found'
        };
      }

      // Get current time and expiry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.holdDuration);

      // Initialize show holds if not exists
      if (!this.seatHolds.has(showId)) {
        this.seatHolds.set(showId, new Map());
      }

      const showHolds = this.seatHolds.get(showId);
      const conflicts = [];
      const blocked = [];

      // Check for conflicts and available seats
      for (const seatLabel of normalizedSeats) {
        const existingHold = showHolds.get(seatLabel);
        
        if (existingHold) {
          // Check if hold is expired
          if (existingHold.expiresAt <= now) {
            // Remove expired hold
            showHolds.delete(seatLabel);
          } else if (existingHold.userId !== userId) {
            // Seat is held by another user
            conflicts.push(seatLabel);
            continue;
          }
        }

        // Check if seat is permanently booked in database
        const isBooked = await this.isSeatBooked(showId, seatLabel);
        if (isBooked) {
          conflicts.push(seatLabel);
          continue;
        }

        // Block the seat
        showHolds.set(seatLabel, {
          userId,
          socketId,
          expiresAt,
          createdAt: now
        });
        blocked.push(seatLabel);
      }

      // Persist temporary holds to database for backup
      if (blocked.length > 0) {
        await this.persistHolds(userId, showId, blocked, expiresAt);
      }

      // Broadcast updates if socket manager is available
      if (this.socketManager && blocked.length > 0) {
        this.socketManager.broadcastSeatBlocked(showId, {
          seats: blocked,
          userId,
          expiresAt
        });
      }

      return {
        success: true,
        blocked,
        conflicts,
        message: conflicts.length > 0 
          ? `${blocked.length} seats blocked, ${conflicts.length} conflicts`
          : `${blocked.length} seats blocked successfully`
      };

    } catch (error) {
      console.error('Error blocking seats:', error);
      return {
        success: false,
        message: 'Failed to block seats'
      };
    }
  }

  async unblockSeats(userId, socketId, showId, seatLabels = null) {
    try {
      if (!this.seatHolds.has(showId)) {
        return {
          success: true,
          unblocked: [],
          message: 'No holds found for this show'
        };
      }

      const showHolds = this.seatHolds.get(showId);
      const unblocked = [];

      if (seatLabels) {
        // Unblock specific seats
        const normalizedSeats = seatLabels.map(seat => seat.toUpperCase());
        
        for (const seatLabel of normalizedSeats) {
          const hold = showHolds.get(seatLabel);
          if (hold && hold.userId === userId) {
            showHolds.delete(seatLabel);
            unblocked.push(seatLabel);
          }
        }
      } else {
        // Unblock all seats for this user
        for (const [seatLabel, hold] of showHolds.entries()) {
          if (hold.userId === userId) {
            showHolds.delete(seatLabel);
            unblocked.push(seatLabel);
          }
        }
      }

      // Clean up empty show holds
      if (showHolds.size === 0) {
        this.seatHolds.delete(showId);
      }

      // Remove from database
      if (unblocked.length > 0) {
        await this.removePersistedHolds(userId, showId, unblocked);
      }

      // Broadcast updates
      if (this.socketManager && unblocked.length > 0) {
        this.socketManager.broadcastSeatUnblocked(showId, {
          seats: unblocked,
          userId
        });
      }

      return {
        success: true,
        unblocked,
        message: `${unblocked.length} seats unblocked`
      };

    } catch (error) {
      console.error('Error unblocking seats:', error);
      return {
        success: false,
        message: 'Failed to unblock seats'
      };
    }
  }

  async isSeatBooked(showId, seatLabel) {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          showId: parseInt(showId),
          status: 'CONFIRMED'
        },
        select: {
          seats: true
        }
      });

      // Check if seat is in any confirmed booking
      for (const booking of bookings) {
        const bookedSeats = dbSeatsToLabels(booking.seats);
        if (bookedSeats.includes(seatLabel)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking seat booking status:', error);
      return false;
    }
  }

  async persistHolds(userId, showId, seatLabels, expiresAt) {
    try {
      // Convert seat labels to database format
      const dbSeats = seatsToDbFormat(seatLabels);

      // Delete existing holds for this user and show
      await prisma.seatHold.deleteMany({
        where: {
          userId,
          showId: parseInt(showId)
        }
      });

      // Create new hold record
      await prisma.seatHold.create({
        data: {
          userId,
          showId: parseInt(showId),
          seats: dbSeats,
          expiresAt
        }
      });

    } catch (error) {
      console.error('Error persisting holds:', error);
    }
  }

  async removePersistedHolds(userId, showId, seatLabels = null) {
    try {
      if (seatLabels) {
        // Remove specific seats (this is complex with JSON, so we'll remove all and re-add remaining)
        const currentHold = await prisma.seatHold.findFirst({
          where: {
            userId,
            showId: parseInt(showId)
          }
        });

        if (currentHold) {
          const currentSeats = dbSeatsToLabels(currentHold.seats);
          const remainingSeats = currentSeats.filter(seat => 
            !seatLabels.map(s => s.toUpperCase()).includes(seat.toUpperCase())
          );

          // Delete current hold
          await prisma.seatHold.deleteMany({
            where: {
              userId,
              showId: parseInt(showId)
            }
          });

          // Re-create with remaining seats if any
          if (remainingSeats.length > 0) {
            const dbSeats = seatsToDbFormat(remainingSeats);
            await prisma.seatHold.create({
              data: {
                userId,
                showId: parseInt(showId),
                seats: dbSeats,
                expiresAt: currentHold.expiresAt
              }
            });
          }
        }
      } else {
        // Remove all holds for user and show
        await prisma.seatHold.deleteMany({
          where: {
            userId,
            showId: parseInt(showId)
          }
        });
      }
    } catch (error) {
      console.error('Error removing persisted holds:', error);
    }
  }

  cleanupExpiredHolds() {
    const now = new Date();
    let totalCleaned = 0;

    for (const [showId, showHolds] of this.seatHolds.entries()) {
      const expiredSeats = [];
      
      for (const [seatLabel, hold] of showHolds.entries()) {
        if (hold.expiresAt <= now) {
          showHolds.delete(seatLabel);
          expiredSeats.push(seatLabel);
          totalCleaned++;
        }
      }

      // Clean up empty show holds
      if (showHolds.size === 0) {
        this.seatHolds.delete(showId);
      }

      // Broadcast expired seats
      if (this.socketManager && expiredSeats.length > 0) {
        this.socketManager.broadcastSeatUnblocked(showId, {
          seats: expiredSeats,
          reason: 'expired'
        });
      }
    }

    if (totalCleaned > 0) {
      console.log(`Cleaned up ${totalCleaned} expired seat holds`);
    }

    // Also cleanup database holds
    this.cleanupDatabaseHolds();
  }

  async cleanupDatabaseHolds() {
    try {
      const result = await prisma.seatHold.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired database holds`);
      }
    } catch (error) {
      console.error('Error cleaning up database holds:', error);
    }
  }

  // Get current holds for a show
  getShowHolds(showId) {
    const showHolds = this.seatHolds.get(showId);
    if (!showHolds) {
      return {};
    }

    const result = {};
    const now = new Date();

    for (const [seatLabel, hold] of showHolds.entries()) {
      if (hold.expiresAt > now) {
        result[seatLabel] = {
          userId: hold.userId,
          expiresAt: hold.expiresAt,
          remainingTime: hold.expiresAt.getTime() - now.getTime()
        };
      }
    }

    return result;
  }

  // Get user's holds for a show
  getUserHolds(userId, showId) {
    const showHolds = this.seatHolds.get(showId);
    if (!showHolds) {
      return [];
    }

    const userHolds = [];
    const now = new Date();

    for (const [seatLabel, hold] of showHolds.entries()) {
      if (hold.userId === userId && hold.expiresAt > now) {
        userHolds.push({
          seatLabel,
          expiresAt: hold.expiresAt,
          remainingTime: hold.expiresAt.getTime() - now.getTime()
        });
      }
    }

    return userHolds;
  }

  // Clean up all holds for a disconnected user
  cleanupUserHolds(userId, socketId) {
    let totalCleaned = 0;

    for (const [showId, showHolds] of this.seatHolds.entries()) {
      const userSeats = [];
      
      for (const [seatLabel, hold] of showHolds.entries()) {
        if (hold.userId === userId && hold.socketId === socketId) {
          showHolds.delete(seatLabel);
          userSeats.push(seatLabel);
          totalCleaned++;
        }
      }

      // Clean up empty show holds
      if (showHolds.size === 0) {
        this.seatHolds.delete(showId);
      }

      // Broadcast cleanup
      if (this.socketManager && userSeats.length > 0) {
        this.socketManager.broadcastSeatUnblocked(showId, {
          seats: userSeats,
          userId,
          reason: 'user_disconnected'
        });
      }
    }

    if (totalCleaned > 0) {
      console.log(`Cleaned up ${totalCleaned} holds for disconnected user ${userId}`);
    }

    // Also cleanup database holds for this user
    this.removePersistedHolds(userId);
  }

  // Get statistics
  getStats() {
    let totalHolds = 0;
    const showStats = {};

    for (const [showId, showHolds] of this.seatHolds.entries()) {
      showStats[showId] = showHolds.size;
      totalHolds += showHolds.size;
    }

    return {
      totalHolds,
      activeShows: this.seatHolds.size,
      showStats
    };
  }
}

// Create singleton instance
const seatHoldManager = new SeatHoldManager();

module.exports = seatHoldManager;