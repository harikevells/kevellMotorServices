const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  getOwnProfile,
  getAllUsers,
  getUserById,
  getUsersByRole,
  updateUser,
  deleteUser,
  updateAddress,
  getAddresses,
  uploadAvatar
} = require('../controllers/usercontroller');
const verifyToken = require('../middleware/auth');
const { isAdminOrVendor } = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Avatar Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Profile routes (any logged in user)
router.put('/profile', verifyToken, updateProfile);
router.post('/upload-avatar', verifyToken, upload.single('avatar'), uploadAvatar);
router.get('/me', verifyToken, getOwnProfile);

// Address routes
router.put('/address', verifyToken, updateAddress);
router.get('/address', verifyToken, getAddresses);

// Get all users (with pagination)
router.get('/', verifyToken, isAdminOrVendor, getAllUsers);

// Get users by role
router.get('/role/:role', verifyToken, isAdminOrVendor, getUsersByRole);

// Get user by ID
router.get('/:id', verifyToken, isAdminOrVendor, getUserById);

// Update user
router.put('/:id', verifyToken, updateUser);

// Delete user
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;