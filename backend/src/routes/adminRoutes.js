const express = require('express');
const { param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Apply authentication first, then admin role check
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== VALIDATION SCHEMAS ====================

// ID parameter validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a valid positive integer')
];

// ==================== ADMIN-SPECIFIC ROUTES ====================

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalCinemas:
 *               type: integer
 *               description: Total number of cinemas
 *             totalScreens:
 *               type: integer
 *               description: Total number of screens
 *             totalMovies:
 *               type: integer
 *               description: Total number of movies
 *             totalShows:
 *               type: integer
 *               description: Total number of shows
 *             todayBookings:
 *               type: integer
 *               description: Number of bookings made today
 *             totalRevenue:
 *               type: number
 *               format: float
 *               description: Total revenue from all bookings
 *             todayRevenue:
 *               type: number
 *               format: float
 *               description: Revenue generated today
 *         topMovies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               title:
 *                 type: string
 *               _count:
 *                 type: object
 *                 properties:
 *                   shows:
 *                     type: integer
 *         recentBookings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BookingWithDetails'
 *     
 *     BookingWithDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         showId:
 *           type: integer
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *         totalPrice:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         show:
 *           type: object
 *           properties:
 *             movie:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *             screen:
 *               type: object
 *               properties:
 *                 cinema:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *     
 *     SeatLayout:
 *       type: object
 *       properties:
 *         show:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             startTime:
 *               type: string
 *               format: date-time
 *             price:
 *               type: number
 *               format: float
 *             movie:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *             screen:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 cinema:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     city:
 *                       type: string
 *         seatLayout:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, booked, blocked]
 *               user:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *               bookingId:
 *                 type: integer
 *               bookedAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *         stats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of seats
 *             booked:
 *               type: integer
 *               description: Number of booked seats
 *             blocked:
 *               type: integer
 *               description: Number of temporarily blocked seats
 *             available:
 *               type: integer
 *               description: Number of available seats
 *             revenue:
 *               type: number
 *               format: float
 *               description: Total revenue from this show
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     description: Retrieve comprehensive dashboard data including overview statistics, top movies, and recent bookings for admin monitoring
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                   example: "Dashboard data retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AdminDashboard'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. Admin privileges required."
 *                 error:
 *                   type: string
 *                   example: "INSUFFICIENT_PERMISSIONS"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', adminController.getDashboardData);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings with advanced filtering
 *     description: Retrieve all bookings in the system with comprehensive filtering options for admin management and monitoring
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED]
 *         description: Filter by booking status
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by movie ID
 *       - in: query
 *         name: cinemaId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by cinema ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by user ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                   example: "Bookings retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookingWithDetails'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. Admin privileges required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bookings', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['CONFIRMED', 'CANCELLED'])
    .withMessage('Status must be either "CONFIRMED" or "CANCELLED"'),
  query('movieId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Movie ID must be a valid positive integer'),
  query('cinemaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cinema ID must be a valid positive integer'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date')
], adminController.getAllBookings);

/**
 * @swagger
 * /api/admin/shows/{id}/seats:
 *   get:
 *     summary: Get detailed seat layout with user information
 *     description: Retrieve comprehensive seat layout for a specific show including booking status, user details, and occupancy statistics for admin monitoring
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Show ID to get seat details for
 *     responses:
 *       200:
 *         description: Show seat details retrieved successfully
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
 *                   example: "Show seat details retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SeatLayout'
 *             examples:
 *               seatLayoutExample:
 *                 summary: Example seat layout response
 *                 value:
 *                   success: true
 *                   message: "Show seat details retrieved successfully"
 *                   data:
 *                     show:
 *                       id: 1
 *                       startTime: "2025-12-25T19:30:00.000Z"
 *                       price: 250.00
 *                       movie:
 *                         id: 1
 *                         title: "Avengers: Endgame"
 *                       screen:
 *                         id: 1
 *                         name: "Screen 1"
 *                         cinema:
 *                           name: "PVR Cinemas"
 *                           city: "Mumbai"
 *                     seatLayout:
 *                       A1:
 *                         status: "booked"
 *                         user:
 *                           id: 123
 *                           name: "John Doe"
 *                           email: "john@example.com"
 *                         bookingId: 456
 *                         bookedAt: "2025-12-20T10:30:00.000Z"
 *                       A2:
 *                         status: "blocked"
 *                         user:
 *                           id: 789
 *                         expiresAt: "2025-12-20T10:35:00.000Z"
 *                       A3:
 *                         status: "available"
 *                     stats:
 *                       total: 100
 *                       booked: 25
 *                       blocked: 5
 *                       available: 70
 *                       revenue: 6250.00
 *       400:
 *         description: Validation error - Invalid show ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. Admin privileges required."
 *       404:
 *         description: Show not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Show not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/shows/:id/seats', idValidation, adminController.getShowSeatsDetails);

module.exports = router;