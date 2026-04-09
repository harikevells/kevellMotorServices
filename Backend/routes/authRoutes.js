const express = require('express');
const router = express.Router();
const { register, login, getProfile, sendOTP, verifyOTP } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected route (any logged in user)
router.get('/profile', verifyToken, getProfile);

module.exports = router;