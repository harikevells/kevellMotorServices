const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  partNumber: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  stockQty: {
    type: Number,
    default: 0
  },
  brand: {
    type: String,
    trim: true
  },
  warranty: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  description: {
    type: String
  },
  isListed: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Active', 'Inactive'],
    default: 'Available'
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    vendorReply: { type: String },
    repliedAt: { type: Date }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SparePart', sparePartSchema);
