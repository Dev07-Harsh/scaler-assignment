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

/**
 * @swagger
 * components:
 *   schemas:
 *     ScreenRequest:
 *       type: object
 *       required:
 *         - name
 *         - cinemaId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Screen name or number
 *         cinemaId:
 *           type: integer
 *           minimum: 1
 *           description: ID of the cinema this screen belongs to
 *       example:
 *         name: "Screen 1"
 *         cinemaId: 1
 */

/**
 * @swagger
 * /api/screens:
 *   get:
 *     summary: Get all screens
 *     description: Retrieve a list of all screens with their cinema details and show counts
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Screens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Screen'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new screen
 *     description: Add a new screen to a cinema
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScreenRequest'
 *     responses:
 *       201:
 *         description: Screen created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Screen'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cinema not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/screens/{id}:
 *   get:
 *     summary: Get screen by ID
 *     description: Retrieve a specific screen with its cinema and shows
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Screen ID
 *     responses:
 *       200:
 *         description: Screen retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Screen'
 *       404:
 *         description: Screen not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update screen
 *     description: Update an existing screen
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Screen ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScreenRequest'
 *     responses:
 *       200:
 *         description: Screen updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Screen'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Screen or cinema not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete screen
 *     description: Delete a screen (only if it has no shows)
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Screen ID
 *     responses:
 *       200:
 *         description: Screen deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete screen with existing shows
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Screen not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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