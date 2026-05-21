// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  pendingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

walletSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (next && typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Wallet', walletSchema);
