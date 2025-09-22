const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');

const getAllCinemas = async (req, res, next) => {
  try {
    const cinemas = await prisma.cinema.findMany({
      include: {
        screens: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            screens: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Cinemas retrieved successfully',
      data: cinemas
    });
  } catch (error) {
    next(error);
  }
};

const getCinemaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const cinema = await prisma.cinema.findUnique({
      where: { id: parseInt(id) },
      include: {
        screens: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found'
      });
    }

    res.json({
      success: true,
      message: 'Cinema retrieved successfully',
      data: cinema
    });
  } catch (error) {
    next(error);
  }
};

const createCinema = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, city } = req.body;

    const cinema = await prisma.cinema.create({
      data: {
        name,
        city
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cinema created successfully',
      data: cinema
    });
  } catch (error) {
    next(error);
  }
};

const updateCinema = async (req, res, next) => {
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
    const { name, city } = req.body;

    const cinema = await prisma.cinema.update({
      where: { id: parseInt(id) },
      data: {
        name,
        city
      }
    });

    res.json({
      success: true,
      message: 'Cinema updated successfully',
      data: cinema
    });
  } catch (error) {
    next(error);
  }
};

const deleteCinema = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if cinema has screens
    const cinemaWithScreens = await prisma.cinema.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            screens: true
          }
        }
      }
    });

    if (!cinemaWithScreens) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found'
      });
    }

    if (cinemaWithScreens._count.screens > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete cinema with existing screens'
      });
    }

    await prisma.cinema.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cinema deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema
};