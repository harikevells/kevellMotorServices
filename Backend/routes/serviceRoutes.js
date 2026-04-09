const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { uploadService } = require('../middleware/upload');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/categories', serviceController.getServiceCategories);
router.get('/:id', serviceController.getServiceById);


// Admin routes
router.post('/', 
  verifyToken, 
  isAdmin, 
  uploadService.single('image'),
  serviceController.createService
);

router.put('/:id', 
  verifyToken, 
  isAdmin, 
  uploadService.single('image'),
  serviceController.updateService
);

router.delete('/:id', verifyToken, isAdmin, serviceController.deleteService);

module.exports = router;