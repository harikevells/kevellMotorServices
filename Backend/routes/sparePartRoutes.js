const express = require('express');
const router = express.Router();
const {
  getAllSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  addSparePartReview,
  respondToReview
} = require('../controllers/sparePartController');
const { uploadSparePart } = require('../middleware/upload');
const verifyToken = require('../middleware/auth');
const { isAdmin, isAdminOrVendor } = require('../middleware/roleCheck');

router
  .route('/')
  .get(verifyToken, getAllSpareParts)
  .post(verifyToken, isAdmin, uploadSparePart.array('images', 20), createSparePart);

router
  .route('/:id')
  .get(verifyToken, getSparePart)
  .put(verifyToken, isAdmin, uploadSparePart.array('images', 20), updateSparePart)
  .delete(verifyToken, isAdmin, deleteSparePart);

router.post('/:id/reviews', verifyToken, addSparePartReview);
router.post('/:partId/reviews/:reviewId/respond', verifyToken, isAdminOrVendor, respondToReview);

module.exports = router;
