const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const verifyToken = require('../middleware/auth');

router.get('/:bookingId', verifyToken, trackingController.getTrackingStatus);
router.put('/:bookingId', verifyToken, trackingController.updateTrackingStatus); // Vendor only

module.exports = router;

