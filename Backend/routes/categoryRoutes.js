const express = require('express');
const router = express.Router();
const { uploadCategory } = require('../middleware/upload');  
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} = require('../controllers/categoryController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin routes with image upload
router.post('/', 
  verifyToken, 
  uploadCategory.single('categoryImage'),  
  createCategory
);

router.put('/:id', 
  verifyToken, 
  uploadCategory.single('categoryImage'), 
  updateCategory
);

router.delete('/:id', verifyToken,  deleteCategory);
router.patch('/:id/toggle-status', verifyToken,toggleCategoryStatus);

module.exports = router;