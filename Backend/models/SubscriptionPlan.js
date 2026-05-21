const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Basic', 'Pro', 'Enterprise', 'Custom'],
    default: 'Basic'
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly', 'custom'],
    default: 'monthly'
  },
  features: [{
    type: String
  }],
  autoRenewal: {
    type: Boolean,
    default: true
  },
  expiryNotifications: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    default: 'vendor'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
