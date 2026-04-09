const express = require('express');
const router = express.Router();
const {
  processPayPalPayment,
  confirmCashPayment,
  getPaymentStatus
} = require('../controllers/paymentController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

router.post('/paypal', verifyToken, processPayPalPayment);
router.post('/cash/confirm', verifyToken, isAdmin, confirmCashPayment);
router.get('/:orderId', verifyToken, getPaymentStatus);

module.exports = router;