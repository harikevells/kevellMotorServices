const mongoose = require('mongoose');

const sparePartOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sparePart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePart',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    district: String,
    state: String,
    pincode: String
  },
  deliveryCharge: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Out of delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  vendorDiscount: {
    type: Number,
    default: 0
  },
  subscriptionDiscount: {
    type: Number,
    default: 0
  },
  offerDetails: {
    offerCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 }
  },
  cancelReason: {
    type: String,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SparePartOrder', sparePartOrderSchema);
