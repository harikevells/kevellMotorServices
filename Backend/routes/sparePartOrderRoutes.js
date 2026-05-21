const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  updatePaymentDetails,
  cancelOrder
} = require('../controllers/sparePartOrderController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

router.use(verifyToken);

router
  .route('/')
  .get(isAdmin, getAllOrders)
  .post(createOrder);

router.get('/my-orders', getMyOrders);

router.put('/:id/status', isAdmin, updateOrderStatus);

router.put('/:id/payment', updatePaymentDetails);

router.put('/:id/cancel', cancelOrder);

module.exports = router;
