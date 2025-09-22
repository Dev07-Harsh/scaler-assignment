const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');
const { getPaginationParams, formatPaginationResponse } = require('../utils/paginationHelper');

const getAllShows = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);

    const [shows, total] = await Promise.all([
      prisma.show.findMany({
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              durationMin: true
            }
          },
          screen: {
            select: {
              id: true,
              name: true,
              cinema: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              }
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take
      }),
      prisma.show.count()
    ]);

    const response = formatPaginationResponse(shows, total, page, limit);

    res.json({
      success: true,
      message: 'Shows retrieved successfully',
      ...response
    });
  } catch (error) {
    if (error.message.includes('Invalid pagination parameters')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
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
          select: {
            id: true,
            name: true,
            cinema: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        },
        bookings: {
          select: {
            id: true,
            seats: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
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

    res.json({
      success: true,
      message: 'Show retrieved successfully',
      data: show
    });
  } catch (error) {
    next(error);
  }
};

const createShow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { movieId, screenId, startTime, price } = req.body;

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if screen exists
    const screen = await prisma.screen.findUnique({
      where: { id: screenId }
    });

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    // Check for overlapping shows in the same screen
    const showDate = new Date(startTime);
    const movieDuration = movie.durationMin || 120; // Default 2 hours if not specified
    const endTime = new Date(showDate.getTime() + movieDuration * 60000);

    const overlappingShows = await prisma.show.findMany({
      where: {
        screenId,
        OR: [
          {
            AND: [
              { startTime: { lte: showDate } },
              { startTime: { gte: new Date(showDate.getTime() - movieDuration * 60000) } }
            ]
          },
          {
            startTime: {
              gte: showDate,
              lte: endTime
            }
          }
        ]
      }
    });

    if (overlappingShows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Show time conflicts with existing show in the same screen'
      });
    }

    const show = await prisma.show.create({
      data: {
        movieId,
        screenId,
        startTime: showDate,
        price
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            durationMin: true
          }
        },
        screen: {
          select: {
            id: true,
            name: true,
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

    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      data: show
    });
  } catch (error) {
    next(error);
  }
};

const updateShow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { movieId, screenId, startTime, price } = req.body;

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if screen exists
    const screen = await prisma.screen.findUnique({
      where: { id: screenId }
    });

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    const show = await prisma.show.update({
      where: { id: parseInt(id) },
      data: {
        movieId,
        screenId,
        startTime: new Date(startTime),
        price
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            durationMin: true
          }
        },
        screen: {
          select: {
            id: true,
            name: true,
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

    res.json({
      success: true,
      message: 'Show updated successfully',
      data: show
    });
  } catch (error) {
    next(error);
  }
};

const deleteShow = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if show has bookings
    const showWithBookings = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!showWithBookings) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    if (showWithBookings._count.bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete show with existing bookings'
      });
    }

    await prisma.show.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Show deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
};