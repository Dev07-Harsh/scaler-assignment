const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');

const router = express.Router();

const showValidation = [
  body('movieId')
    .isInt({ min: 1 })
    .withMessage('Valid movie ID is required'),
  
  body('screenId')
    .isInt({ min: 1 })
    .withMessage('Valid screen ID is required'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Show start time must be in the future');
      }
      return true;
    }),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid show ID is required')
];

router.get('/', getAllShows);
router.get('/:id', idValidation, getShowById);
router.post('/', showValidation, createShow);
router.put('/:id', [...idValidation, ...showValidation], updateShow);
router.delete('/:id', idValidation, deleteShow);

module.exports = router;