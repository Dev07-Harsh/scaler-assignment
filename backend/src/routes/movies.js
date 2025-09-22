const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/movieController');

const router = express.Router();

const movieValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Movie title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Movie title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('durationMin')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  
  body('posterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Poster URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Poster URL cannot exceed 500 characters')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid movie ID is required')
];

router.get('/', getAllMovies);
router.get('/:id', idValidation, getMovieById);
router.post('/', movieValidation, createMovie);
router.put('/:id', [...idValidation, ...movieValidation], updateMovie);
router.delete('/:id', idValidation, deleteMovie);

module.exports = router;