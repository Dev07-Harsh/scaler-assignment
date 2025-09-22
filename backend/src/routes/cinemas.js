const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema
} = require('../controllers/cinemaController');

const router = express.Router();

const cinemaValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Cinema name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Cinema name must be between 2 and 100 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid cinema ID is required')
];

router.get('/', getAllCinemas);
router.get('/:id', idValidation, getCinemaById);
router.post('/', cinemaValidation, createCinema);
router.put('/:id', [...idValidation, ...cinemaValidation], updateCinema);
router.delete('/:id', idValidation, deleteCinema);

module.exports = router;