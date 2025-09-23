const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema
} = require('../controllers/cinemaController');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CinemaRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Cinema name
 *         city:
 *           type: string
 *           maxLength: 50
 *           description: City where cinema is located
 *       example:
 *         name: "PVR Cinemas"
 *         city: "Mumbai"
 */

/**
 * @swagger
 * /api/cinemas:
 *   get:
 *     summary: Get all cinemas
 *     description: Retrieve a list of all cinemas with their screen counts
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cinemas retrieved successfully
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
 *                     $ref: '#/components/schemas/Cinema'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new cinema (Admin Only)
 *     description: Add a new cinema to the system. Requires admin privileges.
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CinemaRequest'
 *     responses:
 *       201:
 *         description: Cinema created successfully
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
 *                   $ref: '#/components/schemas/Cinema'
 *       400:
 *         description: Validation error
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
 * /api/cinemas/{id}:
 *   get:
 *     summary: Get cinema by ID
 *     description: Retrieve a specific cinema with its screens
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema retrieved successfully
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
 *                   $ref: '#/components/schemas/Cinema'
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
 *   put:
 *     summary: Update cinema (Admin Only)
 *     description: Update an existing cinema. Requires admin privileges.
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Cinema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CinemaRequest'
 *     responses:
 *       200:
 *         description: Cinema updated successfully
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
 *                   $ref: '#/components/schemas/Cinema'
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
 *   delete:
 *     summary: Delete cinema (Admin Only)
 *     description: Delete a cinema (only if it has no screens). Requires admin privileges.
 *     tags: [Cinemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema deleted successfully
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
 *         description: Cannot delete cinema with existing screens
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

// Public read access for authenticated users
router.get('/', getAllCinemas);
router.get('/:id', idValidation, getCinemaById);

// Admin-only write access
router.post('/', adminMiddleware, cinemaValidation, createCinema);
router.put('/:id', adminMiddleware, [...idValidation, ...cinemaValidation], updateCinema);
router.delete('/:id', adminMiddleware, idValidation, deleteCinema);

module.exports = router;