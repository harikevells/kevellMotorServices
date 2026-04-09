const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',  // ✅ Changed from 'Shop'
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'  // ✅ Changed from 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  images: [{
    type: String
  }],
  vendorReply: {
    text: String,
    repliedAt: Date
  }
}, {
  timestamps: true
});

reviewSchema.index({ user: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);