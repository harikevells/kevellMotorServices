const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus
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

module.exports = router;
