const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, login, getProfile, sendOTP, verifyOTP, faceRegister, faceLogin, forgotPassword, verifyForgotPasswordOTP, resetPassword } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname || '.jpg'));
  }
});
const upload = multer({ storage: storage });

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/face-login', upload.single('faceImage'), faceLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

// Protected route (any logged in user)
router.get('/profile', verifyToken, getProfile);
router.post('/face-register', verifyToken, upload.single('faceImage'), faceRegister);

module.exports = router;