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

      // 2. Get all confirmed bookings for this show
      const existingBookings = await tx.booking.findMany({
        where: {
          showId: parseInt(showId),
          status: 'CONFIRMED'
        },
        select: {
          seats: true
        }
      });

      // 3. Extract all booked seat labels
      const allBookedSeats = [];
      existingBookings.forEach(booking => {
        const seatLabels = dbSeatsToLabels(booking.seats);
        allBookedSeats.push(...seatLabels);
      });

      // 4. Check for conflicts
      const conflicts = findConflicts(normalizedSeats, allBookedSeats);
      if (conflicts.length > 0) {
        throw new Error(`SEAT_CONFLICT:${JSON.stringify(conflicts)}`);
      }

      // 5. Calculate total price
      const totalPrice = show.price * normalizedSeats.length;

      // 6. Convert seats to database format
      const dbSeats = seatsToDbFormat(normalizedSeats);

      // 7. Create the booking
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
        show
      };
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

module.exports = {
  createBooking,
  getUserBookingHistory,
  getShowSeatAvailability
};