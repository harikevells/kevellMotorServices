// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
 
paymentMethod: {
  type: String,
  enum: ['Cash', 'Paypal', 'Razorpay'], 
  required: true
},
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Razorpay specific fields
  razorpayDetails: {
    orderId: String,        // Razorpay order ID
    paymentId: String,      // Razorpay payment ID
    signature: String,      // Payment signature
    method: String,         // card, upi, netbanking, etc.
    bank: String,
    cardId: String,
    vpa: String,            // UPI VPA
    email: String,
    contact: String
  },
  // Cash payment details
  cashDetails: {
    collectedBy: String,
    collectedAt: Date
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundStatus: String,
    refundedAt: Date,
    reason: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);