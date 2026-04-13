const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, bookingController.createBooking);
router.get('/', verifyToken, bookingController.getUserBookings);
router.get('/admin/all', bookingController.getAllBookingsAdmin); // Temporary bypass for debugging
router.get('/:id', verifyToken, bookingController.getBookingById);
router.patch('/:id/cancel', verifyToken, bookingController.cancelBooking);

module.exports = router;