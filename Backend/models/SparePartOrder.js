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
    address: String,
    city: String,
    pincode: String
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SparePartOrder', sparePartOrderSchema);
