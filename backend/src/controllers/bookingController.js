const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');
const { 
  validateSeats, 
  seatsToDbFormat, 
  dbSeatsToLabels, 
  findConflicts 
} = require('../utils/seats');

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = async (req, res, next) => {
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

    const { showId, seats } = req.body;
    const userId = req.user.id;

    // Validate seats format and constraints
    const seatValidation = validateSeats(seats);
    if (!seatValidation.valid) {
      return res.status(400).json({
        success: false,
        message: seatValidation.message,
        invalidSeats: seatValidation.invalidSeats
      });
    }

    // Normalize seat labels to uppercase
    const normalizedSeats = seats.map(seat => seat.toUpperCase());

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if show exists
      const show = await tx.show.findUnique({
        where: { id: parseInt(showId) },
        include: {
          movie: {
            select: {
              id: true,
              title: true
            }
          },
          screen: {
            include: {
              cinema: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!show) {
        throw new Error('SHOW_NOT_FOUND');
      }

      // 2. Check seat holds and validate user has these seats blocked
      const seatHoldManager = require('../utils/seatHoldManager');
      const userHolds = seatHoldManager.getUserHolds(userId, showId);
      const userHeldSeats = userHolds.map(hold => hold.seatLabel);
      
      // Verify user has all requested seats in their holds
      const unheldSeats = normalizedSeats.filter(seat => !userHeldSeats.includes(seat));
      if (unheldSeats.length > 0) {
        throw new Error(`SEATS_NOT_HELD:${JSON.stringify(unheldSeats)}`);
      }

      // 3. Get all confirmed bookings for this show
      const existingBookings = await tx.booking.findMany({
        where: {
          showId: parseInt(showId),
          status: 'CONFIRMED'
        },
        select: {
          seats: true
        }
      });

      // 4. Extract all booked seat labels
      const allBookedSeats = [];
      existingBookings.forEach(booking => {
        const seatLabels = dbSeatsToLabels(booking.seats);
        allBookedSeats.push(...seatLabels);
      });

      // 5. Check for conflicts (double-check even with holds)
      const conflicts = findConflicts(normalizedSeats, allBookedSeats);
      if (conflicts.length > 0) {
        throw new Error(`SEAT_CONFLICT:${JSON.stringify(conflicts)}`);
      }

      // 6. Calculate total price
      const totalPrice = show.price * normalizedSeats.length;

      // 7. Convert seats to database format
      const dbSeats = seatsToDbFormat(normalizedSeats);

      // 8. Create the booking
      const booking = await tx.booking.create({
        data: {
          userId,
          showId: parseInt(showId),
          seats: dbSeats,
          totalPrice,
          status: 'CONFIRMED'
        }
      });

      return {
        booking,
        show,
        seats: normalizedSeats
      };
    });

    // 9. Release user's seat holds for this show
    const seatHoldManager = require('../utils/seatHoldManager');
    await seatHoldManager.unblockSeats(userId, null, showId);

    // 10. Broadcast booking confirmation to all clients
    const socketManager = require('../utils/socketManager');
    socketManager.broadcastBookingConfirmed(parseInt(showId), {
      showId: parseInt(showId),
      bookingId: result.booking.id,
      seats: result.seats,
      userId
    });


    res.status(201).json({
      success: true,
      bookingId: result.booking.id.toString(),
      showId: showId.toString(),
      seats: normalizedSeats,
      message: 'Booking Confirmed'
    });

  } catch (error) {
    
    if (error.message === 'SHOW_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    if (error.message.startsWith('SEATS_NOT_HELD:')) {
      const unheldSeats = JSON.parse(error.message.split(':')[1]);
      return res.status(400).json({
        success: false,
        message: 'You must select and hold seats before booking',
        unheldSeats
      });
    }

    if (error.message.startsWith('SEAT_CONFLICT:')) {
      const conflicts = JSON.parse(error.message.split(':')[1]);
      return res.status(409).json({
        success: false,
        message: 'Some seats are already booked',
        conflicts
      });
    }

    if (error.message.includes('Invalid seat format')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

/**
 * GET /api/bookings/history
 */
const getUserBookingHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        userId
      },
      include: {
        show: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                description: true,
                durationMin: true,
                posterUrl: true
              }
            },
            screen: {
              include: {
                cinema: {
                  select: {
                    id: true,
                    name: true,
                    city: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedBookings = bookings.map(booking => {
      const seatLabels = dbSeatsToLabels(booking.seats);
      
      return {
        bookingId: booking.id.toString(),
        show: {
          id: booking.show.id,
          startTime: booking.show.startTime,
          price: booking.show.price,
          screen: {
            id: booking.show.screen.id,
            name: booking.show.screen.name,
            cinema: booking.show.screen.cinema
          }
        },
        movie: booking.show.movie,
        seats: seatLabels,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt
      };
    });

    res.json({
      success: true,
      data: formattedBookings
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get seat availability for a specific show
 * GET /api/bookings/seats/:showId
 */
const getShowSeatAvailability = async (req, res, next) => {
  try {
    const { showId } = req.params;

    // Check if show exists
    const show = await prisma.show.findUnique({
      where: { id: parseInt(showId) },
      include: {
        movie: {
          select: {
            id: true,
            title: true
          }
        },
        screen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Get all confirmed bookings for this show
    const bookings = await prisma.booking.findMany({
      where: {
        showId: parseInt(showId),
        status: 'CONFIRMED'
      },
      select: {
        seats: true
      }
    });

    // Extract all booked seats
    const bookedSeats = [];
    bookings.forEach(booking => {
      const seatLabels = dbSeatsToLabels(booking.seats);
      bookedSeats.push(...seatLabels);
    });

    // Generate seat map for 10x10 layout
    const seatMap = {};
    for (let row = 1; row <= 10; row++) {
      const rowLetter = String.fromCharCode('A'.charCodeAt(0) + row - 1);
      seatMap[rowLetter] = {};
      
      for (let col = 1; col <= 10; col++) {
        const seatLabel = `${rowLetter}${col}`;
        seatMap[rowLetter][col] = {
          label: seatLabel,
          available: !bookedSeats.includes(seatLabel)
        };
      }
    }

    res.json({
      success: true,
      show: {
        id: show.id,
        movie: show.movie,
        screen: show.screen,
        startTime: show.startTime,
        price: show.price
      },
      seatMap,
      bookedSeats: bookedSeats.sort(),
      totalBookedSeats: bookedSeats.length,
      availableSeats: 100 - bookedSeats.length
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * POST /api/bookings/cancel/:bookingId
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the booking and verify ownership
      const booking = await tx.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
          show: {
            include: {
              movie: {
                select: {
                  id: true,
                  title: true
                }
              },
              screen: {
                include: {
                  cinema: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      if (booking.userId !== userId) {
        throw new Error('UNAUTHORIZED_CANCELLATION');
      }

      if (booking.status === 'CANCELLED') {
        throw new Error('BOOKING_ALREADY_CANCELLED');
      }

      // 2. Check if show has already started (optional business rule)
      const now = new Date();
      if (booking.show.startTime <= now) {
        throw new Error('CANNOT_CANCEL_PAST_SHOW');
      }

      // 3. Update booking status to cancelled
      const updatedBooking = await tx.booking.update({
        where: { id: parseInt(bookingId) },
        data: {
          status: 'CANCELLED'
        }
      });

      return {
        booking: updatedBooking,
        show: booking.show,
        seats: dbSeatsToLabels(booking.seats)
      };
    });

    // 4. Broadcast cancellation to connected clients
    const socketManager = require('../utils/socketManager');
    socketManager.broadcastBookingCancelled(result.show.id, {
      showId: result.show.id,
      bookingId: parseInt(bookingId),
      seats: result.seats,
      userId
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: parseInt(bookingId),
        status: 'CANCELLED',
        refundAmount: result.booking.totalPrice,
        seats: result.seats,
        show: {
          id: result.show.id,
          movie: result.show.movie.title,
          cinema: result.show.screen.cinema.name,
          startTime: result.show.startTime
        }
      }
    });

  } catch (error) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (error.message === 'UNAUTHORIZED_CANCELLATION') {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings'
      });
    }
    
    if (error.message === 'BOOKING_ALREADY_CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    if (error.message === 'CANNOT_CANCEL_PAST_SHOW') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for a show that has already started'
      });
    }

    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookingHistory,
  getShowSeatAvailability,
  cancelBooking
};