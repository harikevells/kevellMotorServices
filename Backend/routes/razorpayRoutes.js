// routes/razorpayRoutes.js
const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  refundPayment,
  razorpayWebhook
} = require('../controllers/razorpayController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public webhook endpoint (no auth)
router.post('/webhook', razorpayWebhook);

// Protected routes
router.post('/create-order', verifyToken, createRazorpayOrder);
router.post('/verify', verifyToken, verifyRazorpayPayment);
router.get('/status/:orderId', verifyToken, getPaymentStatus);

// Admin routes
router.post('/refund/:paymentId', verifyToken, isAdmin, refundPayment);

module.exports = router;