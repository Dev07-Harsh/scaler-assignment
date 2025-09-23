const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createBooking,
  getUserBookingHistory,
  getShowSeatAvailability
} = require('../controllers/bookingController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BookingRequest:
 *       type: object
 *       required:
 *         - showId
 *         - seats
 *       properties:
 *         showId:
 *           type: string
 *           description: ID of the show to book
 *           example: "123"
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of seat identifiers (max 6)
 *           example: ["A1", "A2", "B1"]
 *           maxItems: 6
 *           minItems: 1
 *     
 *     BookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         bookingId:
 *           type: string
 *           example: "456"
 *         showId:
 *           type: string
 *           example: "123"
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *           example: ["A1", "A2"]
 *         message:
 *           type: string
 *           example: "Booking Confirmed"
 *     
 *     BookingConflict:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Some seats are already booked"
 *         conflicts:
 *           type: array
 *           items:
 *             type: string
 *           example: ["A1", "B2"]
 *     
 *     BookingHistory:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "456"
 *               show:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   price:
 *                     type: number
 *                     example: 150.00
 *                   screen:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       cinema:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           city:
 *                             type: string
 *               movie:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   durationMin:
 *                     type: integer
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A1", "A2"]
 *               totalPrice:
 *                 type: number
 *                 example: 300.00
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, CANCELLED]
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *     
 *     SeatAvailability:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         show:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             movie:
 *               type: object
 *             screen:
 *               type: object
 *             startTime:
 *               type: string
 *               format: date-time
 *             price:
 *               type: number
 *         seatMap:
 *           type: object
 *           description: 10x10 seat map with availability
 *         bookedSeats:
 *           type: array
 *           items:
 *             type: string
 *           example: ["A1", "B2", "C3"]
 *         totalBookedSeats:
 *           type: integer
 *           example: 15
 *         availableSeats:
 *           type: integer
 *           example: 85
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Book seats for a specific show. Maximum 6 seats allowed. Seats must be in format A1-J10.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input (bad seat format, too many seats, etc.)
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
 *                   example: "Maximum 6 seats can be booked at once"
 *                 invalidSeats:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Z1", "A11"]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Show not found
 *       409:
 *         description: Seat booking conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingConflict'
 *       500:
 *         description: Internal server error
 */
router.post('/',
  authMiddleware,
  [
    body('showId')
      .notEmpty()
      .withMessage('Show ID is required')
      .isNumeric()
      .withMessage('Show ID must be a valid number'),
    body('seats')
      .isArray({ min: 1, max: 6 })
      .withMessage('Seats must be an array with 1-6 elements')
      .custom((seats) => {
        if (!Array.isArray(seats)) return false;
        // Basic format check - detailed validation happens in controller
        const seatPattern = /^[A-Ja-j]([1-9]|10)$/;
        return seats.every(seat => 
          typeof seat === 'string' && seatPattern.test(seat.trim())
        );
      })
      .withMessage('Each seat must be in format A1-J10 (e.g., A1, B5, J10)')
  ],
  createBooking
);

/**
 * @swagger
 * /api/bookings/history:
 *   get:
 *     summary: Get user's booking history
 *     description: Retrieve all bookings made by the authenticated user, sorted by most recent first
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingHistory'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/history',
  authMiddleware,
  getUserBookingHistory
);

/**
 * @swagger
 * /api/bookings/seats/{showId}:
 *   get:
 *     summary: Get seat availability for a show
 *     description: Retrieve the seat map and availability for a specific show
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: showId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The show ID to check seat availability for
 *     responses:
 *       200:
 *         description: Seat availability retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatAvailability'
 *       404:
 *         description: Show not found
 *       500:
 *         description: Internal server error
 */
router.get('/seats/:showId',
  [
    param('showId')
      .isNumeric()
      .withMessage('Show ID must be a valid number')
  ],
  getShowSeatAvailability
);

module.exports = router;