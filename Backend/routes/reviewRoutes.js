const express = require('express');
const router = express.Router();
const {
  addReview,
  getShopReviews,
  getUserReviews,
  getAllReviews,  // ✅ Add this
  updateReview,
  deleteReview,
  replyToReview
} = require('../controllers/reviewController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');  // ✅ Add this

// Public routes
router.get('/shop/:shopId', getShopReviews);

// Protected routes (user)
router.post('/', verifyToken, addReview);
router.get('/user/me', verifyToken, getUserReviews);
router.put('/:id', verifyToken, updateReview);
router.delete('/:id', verifyToken, deleteReview);

// ✅ Admin route - Get all reviews
router.get('/', verifyToken, isAdmin, getAllReviews);

// Vendor reply route
router.post('/:id/reply', verifyToken, replyToReview);

module.exports = router;