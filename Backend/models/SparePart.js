const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Bike', 'Car', 'Heavy'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock'],
    default: 'Available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SparePart', sparePartSchema);
