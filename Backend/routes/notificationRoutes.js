const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const verifyToken = require('../middleware/auth');

// All notification routes are protected
router.use(verifyToken);

router.get('/', getNotifications);
router.put('/mark-read/:id', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
