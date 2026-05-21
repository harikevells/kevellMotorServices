// models/WalletTransaction.js
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earning', 'payout', 'refund', 'add_funds', 'platform_fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'completed'
  },
  description: {
    type: String,
    required: true
  },
  referenceId: {
    type: String, // booking ID, Razorpay ID, payout ID, etc.
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
