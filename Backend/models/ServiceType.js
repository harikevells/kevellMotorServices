const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Bike', 'Car', 'Heavy', '2 Wheeler', '4 Wheeler']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    default: '1 hr'
  },
  description: {
    type: String
  },
  image: {
    type: String,
    required: false
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);