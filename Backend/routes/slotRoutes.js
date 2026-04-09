const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const verifyToken = require('../middleware/auth');

router.get('/:centerId', slotController.getSlots);
router.post('/', verifyToken, slotController.createSlot); // Admin/Vendor only usually

module.exports = router;

