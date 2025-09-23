const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');
const { dbSeatsToLabels } = require('../utils/seats');

// ==================== ADMIN-SPECIFIC ANALYTICS & MONITORING ====================

/**
 * Get detailed seat layout with user information
 * GET /api/admin/shows/:id/seats
 */
const getShowSeatsDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get show details
    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
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
                name: true,
                city: true
              }
            }
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

    // Get all bookings for this show
    const bookings = await prisma.booking.findMany({
      where: {
        showId: parseInt(id),
        status: 'CONFIRMED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get seat holds (blocked seats)
    const seatHoldManager = require('../utils/seatHoldManager');
    const seatHoldsObj = seatHoldManager.getShowHolds(parseInt(id));

    // Build seat layout
    const seatLayout = {};
    const stats = {
      total: 0,
      booked: 0,
      blocked: 0,
      available: 0,
      revenue: 0
    };

    // Process bookings
    bookings.forEach(booking => {
      const seats = dbSeatsToLabels(booking.seats);
      seats.forEach(seatLabel => {
        seatLayout[seatLabel] = {
          status: 'booked',
          user: {
            id: booking.user.id,
            name: booking.user.name,
            email: booking.user.email
          },
          bookingId: booking.id,
          bookedAt: booking.createdAt
        };
        stats.booked++;
        stats.revenue += show.price;
      });
    });

    // Process seat holds (seatHoldsObj is an object, not an array)
    Object.entries(seatHoldsObj).forEach(([seatLabel, hold]) => {
      if (!seatLayout[seatLabel]) {
        seatLayout[seatLabel] = {
          status: 'blocked',
          user: {
            id: hold.userId
          },
          expiresAt: hold.expiresAt
        };
        stats.blocked++;
      }
    });

    // Generate all possible seats (A1-J10 for example)
    // This should ideally come from a screen configuration
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 10;

    rows.forEach(row => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatLabel = `${row}${i}`;
        stats.total++;
        
        if (!seatLayout[seatLabel]) {
          seatLayout[seatLabel] = {
            status: 'available'
          };
          stats.available++;
        }
      }
    });

    res.json({
      success: true,
      message: 'Show seat details retrieved successfully',
      data: {
        show,
        seatLayout,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching show seat details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch show seat details'
    });
  }
};

/**
 * Get admin dashboard data
 * GET /api/admin/dashboard
 */
const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get overall stats
    const [
      totalCinemas,
      totalScreens,
      totalMovies,
      totalShows,
      todayBookings,
      totalRevenue,
      todayRevenue
    ] = await Promise.all([
      prisma.cinema.count(),
      prisma.screen.count(),
      prisma.movie.count(),
      prisma.show.count(),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'CONFIRMED'
        }
      }),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalPrice: true }
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'CONFIRMED'
        },
        _sum: { totalPrice: true }
      })
    ]);

    // Get top movies by bookings
    const topMovies = await prisma.movie.findMany({
      include: {
        _count: {
          select: {
            shows: {
              where: {
                bookings: {
                  some: {
                    status: 'CONFIRMED'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        shows: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        show: {
          include: {
            movie: {
              select: {
                title: true
              }
            },
            screen: {
              include: {
                cinema: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        overview: {
          totalCinemas,
          totalScreens,
          totalMovies,
          totalShows,
          todayBookings,
          totalRevenue: totalRevenue._sum.totalPrice || 0,
          todayRevenue: todayRevenue._sum.totalPrice || 0
        },
        topMovies,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

/**
 * Get all bookings with filters (for admin)
 * GET /api/admin/bookings
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, movieId, cinemaId, userId, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (movieId) {
      where.show = {
        movieId: parseInt(movieId)
      };
    }
    
    if (cinemaId) {
      where.show = {
        ...where.show,
        screen: {
          cinemaId: parseInt(cinemaId)
        }
      };
    }
    
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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
        },
        skip: offset,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

module.exports = {
  getShowSeatsDetails,
  getDashboardData,
  getAllBookings
};