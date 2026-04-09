const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, getCart);
router.post('/items', verifyToken, addToCart);
router.put('/items/:itemId', verifyToken, updateCartItem);
router.delete('/items/:itemId', verifyToken, removeFromCart);
router.delete('/', verifyToken, clearCart);

module.exports = router;