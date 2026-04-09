// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getCategories,
  getActiveOffers,
  getOffersByShop
} = require('../controllers/offerController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public routes
router.get('/active', getActiveOffers);
router.get('/categories', getCategories);
router.get('/shop/:shopId', getOffersByShop);

// Protected routes (admin only)
router.post('/', verifyToken, isAdmin, createOffer);
router.get('/', verifyToken, isAdmin, getAllOffers);
router.get('/:id', verifyToken, isAdmin, getOfferById);
router.put('/:id', verifyToken, isAdmin, updateOffer);
router.delete('/:id', verifyToken, isAdmin, deleteOffer);
router.patch('/:id/toggle', verifyToken, isAdmin, toggleOfferStatus);

module.exports = router;