const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyToken = require('../middleware/auth');
console.log('✅ Booking Routes Loaded');

router.patch('/admin/:id/status', verifyToken, bookingController.updateBookingStatusAdmin);
router.get('/admin/all', bookingController.getAllBookingsAdmin);
router.post('/', verifyToken, bookingController.createBooking);
router.get('/', verifyToken, bookingController.getUserBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);
router.patch('/:id/cancel', verifyToken, bookingController.cancelBooking);
router.post('/:id/review', verifyToken, bookingController.addBookingReview);
router.get('/center/:centerId/reviews', bookingController.getCenterReviews);

module.exports = router;
