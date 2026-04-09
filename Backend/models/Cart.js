const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter', // ✅ Changed from 'Shop'
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType', // ✅ Changed from 'Service'
    required: true
  },
  paperSize: {
    type: String,
    enum: ['A3 Sheet', 'A4 Sheet', 'A5 Sheet', 'A2 Sheet'],
    required: true
  },
  printType: {
    type: String,
    enum: ['Single', 'Double'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  selectedPages: {
    type: String,
    default: 'all'
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ❌ REMOVE THIS COMPLETELY - No middleware
// cartSchema.pre('save', function(next) {
//   this.totalItems = this.items.length;
//   this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
//   next();
// });

module.exports = mongoose.model('Cart', cartSchema);