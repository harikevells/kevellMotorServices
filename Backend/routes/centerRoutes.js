const express = require('express');
const router = express.Router();
const centerController = require('../controllers/centerController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { uploadShop } = require('../middleware/upload');

// Public routes
router.get('/', centerController.getAllCenters);
router.get('/:id', centerController.getCenterById);

// Admin routes
router.post('/', 
  verifyToken, 
  isAdmin, 
  uploadShop.single('image'),
  centerController.createCenter
);

router.put('/:id', 
  verifyToken, 
  isAdmin, 
  uploadShop.single('image'),
  centerController.updateCenter
);

router.delete('/:id', verifyToken, isAdmin, centerController.deleteCenter);

module.exports = router;