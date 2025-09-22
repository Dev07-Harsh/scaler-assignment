const { validationResult } = require('express-validator');
const prisma = require('../config/prismaClient');

const getAllMovies = async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        _count: {
          select: {
            shows: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Movies retrieved successfully',
      data: movies
    });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(id) },
      include: {
        shows: {
          select: {
            id: true,
            startTime: true,
            price: true,
            screen: {
              select: {
                name: true,
                cinema: {
                  select: {
                    name: true,
                    city: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie retrieved successfully',
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, durationMin, posterUrl } = req.body;

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        durationMin,
        posterUrl
      }
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
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
    const { title, description, durationMin, posterUrl } = req.body;

    const movie = await prisma.movie.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        durationMin,
        posterUrl
      }
    });

    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if movie has shows
    const movieWithShows = await prisma.movie.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            shows: true
          }
        }
      }
    });

    if (!movieWithShows) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    if (movieWithShows._count.shows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete movie with existing shows'
      });
    }

    await prisma.movie.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};