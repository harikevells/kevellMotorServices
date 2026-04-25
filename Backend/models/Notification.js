const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['booking', 'registration', 'payment', 'system', 'status_update'],
    default: 'system'
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'user', 'vendor', 'all'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means all users of that role (or all users if role is 'all')
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object, // Extra data like bookingId, vendorId, etc.
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
