const mongoose = require('mongoose');

// models/Booking.js
const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',
    required: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType'
  }],
  bookingDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  timeSlot: {
    type: String, // "09:00 AM"
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'received', 'inspected', 
      'in_service', 'quality_check', 'ready', 'completed', 'cancelled'
    ],
    default: 'pending'
  },

  paymentMethod: {
    type: String,
    enum: ['Cash', 'GPay', 'Card', 'Razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String
  },
  specialInstructions: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);