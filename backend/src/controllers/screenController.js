const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');
const { getPaginationParams, formatPaginationResponse } = require('../utils/paginationHelper');

const getAllScreens = async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPaginationParams(req.query);

    const [screens, total] = await Promise.all([
      prisma.screen.findMany({
        include: {
          cinema: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          _count: {
            select: {
              shows: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        },
        skip,
        take
      }),
      prisma.screen.count()
    ]);

    const response = formatPaginationResponse(screens, total, page, limit);

    res.json({
      success: true,
      message: 'Screens retrieved successfully',
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

const getScreenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const screen = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        shows: {
          select: {
            id: true,
            startTime: true,
            price: true,
            movie: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    res.json({
      success: true,
      message: 'Screen retrieved successfully',
      data: screen
    });
  } catch (error) {
    next(error);
  }
};

const createScreen = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, cinemaId } = req.body;

    // Check if cinema exists
    const cinema = await prisma.cinema.findUnique({
      where: { id: cinemaId }
    });

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found'
      });
    }

    const screen = await prisma.screen.create({
      data: {
        name,
        cinemaId
      },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Screen created successfully',
      data: screen
    });
  } catch (error) {
    next(error);
  }
};

const updateScreen = async (req, res, next) => {
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
    const { name, cinemaId } = req.body;

    // Check if cinema exists
    const cinema = await prisma.cinema.findUnique({
      where: { id: cinemaId }
    });

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found'
      });
    }

    const screen = await prisma.screen.update({
      where: { id: parseInt(id) },
      data: {
        name,
        cinemaId
      },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Screen updated successfully',
      data: screen
    });
  } catch (error) {
    next(error);
  }
};

const deleteScreen = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if screen has shows
    const screenWithShows = await prisma.screen.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            shows: true
          }
        }
      }
    });

    if (!screenWithShows) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    if (screenWithShows._count.shows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete screen with existing shows'
      });
    }

    await prisma.screen.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Screen deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllScreens,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen
};