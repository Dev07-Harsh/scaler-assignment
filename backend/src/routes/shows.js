const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ShowRequest:
 *       type: object
 *       required:
 *         - movieId
 *         - screenId
 *         - startTime
 *         - price
 *       properties:
 *         movieId:
 *           type: integer
 *           minimum: 1
 *           description: ID of the movie being shown
 *         screenId:
 *           type: integer
 *           minimum: 1
 *           description: ID of the screen where the show will be held
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Show start time (must be in the future)
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Ticket price for the show
 *       example:
 *         movieId: 1
 *         screenId: 1
 *         startTime: "2025-12-25T19:30:00.000Z"
 *         price: 250.00
 */

/**
 * @swagger
 * /api/shows:
 *   get:
 *     summary: Get all shows
 *     description: Retrieve a list of all shows with complete details including movie, screen, and cinema information
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shows retrieved successfully
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
 *                     $ref: '#/components/schemas/Show'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new show (Admin Only)
 *     description: Schedule a new movie show. Requires admin privileges. Validates movie/screen existence and prevents time conflicts.
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShowRequest'
 *     responses:
 *       201:
 *         description: Show created successfully
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
 *                   $ref: '#/components/schemas/Show'
 *       400:
 *         description: Validation error or show time conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Movie or screen not found
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
 * /api/shows/{id}:
 *   get:
 *     summary: Get show by ID
 *     description: Retrieve a specific show with complete details including bookings
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Show ID
 *     responses:
 *       200:
 *         description: Show retrieved successfully
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
 *                   $ref: '#/components/schemas/Show'
 *       404:
 *         description: Show not found
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
 *     summary: Update show (Admin Only)
 *     description: Update an existing show. Requires admin privileges.
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Show ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShowRequest'
 *     responses:
 *       200:
 *         description: Show updated successfully
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
 *                   $ref: '#/components/schemas/Show'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Show, movie, or screen not found
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
 *     summary: Delete show (Admin Only)
 *     description: Delete a show (only if it has no bookings). Requires admin privileges.
 *     tags: [Shows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Show ID
 *     responses:
 *       200:
 *         description: Show deleted successfully
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
 *         description: Cannot delete show with existing bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Show not found
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

// Public read access for authenticated users
router.get('/', getAllShows);
router.get('/:id', idValidation, getShowById);

// Admin-only write access
router.post('/', adminMiddleware, showValidation, createShow);
router.put('/:id', adminMiddleware, [...idValidation, ...showValidation], updateShow);
router.delete('/:id', adminMiddleware, idValidation, deleteShow);

module.exports = router;