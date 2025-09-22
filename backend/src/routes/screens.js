const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllScreens,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen
} = require('../controllers/screenController');

const router = express.Router();

const screenValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Screen name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Screen name must be between 1 and 50 characters'),
  
  body('cinemaId')
    .isInt({ min: 1 })
    .withMessage('Valid cinema ID is required')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid screen ID is required')
];

router.get('/', getAllScreens);
router.get('/:id', idValidation, getScreenById);
router.post('/', screenValidation, createScreen);
router.put('/:id', [...idValidation, ...screenValidation], updateScreen);
router.delete('/:id', idValidation, deleteScreen);

module.exports = router;