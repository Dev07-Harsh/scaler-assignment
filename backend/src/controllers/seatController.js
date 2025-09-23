const { validationResult } = require('express-validator');
const seatHoldManager = require('../utils/seatHoldManager');
const socketManager = require('../utils/socketManager');

/**
 * Block seats temporarily
 * POST /api/bookings/block-seats/:showId
 */
const blockSeats = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { showId } = req.params;
    const { seats } = req.body;
    const userId = req.user.id;

    // Get user's socket ID (this is tricky, we'll use a workaround)
    const socketId = req.headers['x-socket-id'] || `api-${userId}-${Date.now()}`;

    const result = await seatHoldManager.blockSeats(userId, socketId, showId, seats);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          blocked: result.blocked,
          conflicts: result.conflicts
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        errors: result.invalidSeats || []
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Unblock seats
 * POST /api/bookings/unblock-seats/:showId
 */
const unblockSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { seats } = req.body; // Optional: specific seats to unblock
    const userId = req.user.id;
    const socketId = req.headers['x-socket-id'] || `api-${userId}-${Date.now()}`;

    const result = await seatHoldManager.unblockSeats(userId, socketId, showId, seats);

    res.json({
      success: true,
      message: result.message,
      data: {
        unblocked: result.unblocked
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get seat availability including holds
 * GET /api/bookings/availability/:showId
 */
const getSeatAvailability = async (req, res, next) => {
  try {
    const { showId } = req.params;
    
    // Get temporary holds
    const holds = seatHoldManager.getShowHolds(showId);
    
    // Get user's holds
    const userHolds = seatHoldManager.getUserHolds(req.user.id, showId);

    res.json({
      success: true,
      data: {
        showId: parseInt(showId),
        holds,
        userHolds,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get seat hold statistics (for debugging/monitoring)
 * GET /api/bookings/stats
 */
const getSeatHoldStats = async (req, res, next) => {
  try {
    const stats = seatHoldManager.getStats();
    const socketStats = {
      connectedClients: socketManager.getConnectedCount(),
      activeShows: socketManager.getActiveShows()
    };

    res.json({
      success: true,
      data: {
        seatHolds: stats,
        sockets: socketStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  blockSeats,
  unblockSeats,
  getSeatAvailability,
  getSeatHoldStats
};