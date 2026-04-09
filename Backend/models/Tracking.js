const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  stage: {
    type: String,
    enum: ['received', 'inspected', 'in_service', 'quality_check', 'ready'],
    default: 'received'
  },
  notes: {
    type: String
  },
  mechanic: {
    name: String,
    rating: Number,
    phone: String
  },
  estimatedCompletion: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tracking', trackingSchema);
