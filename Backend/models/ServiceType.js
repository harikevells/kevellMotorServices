const mongoose = require('mongoose');


const serviceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'general', 'battery', 'brake', 'engine', 'electrical', 
      'ac', 'body', 'software', 'washing', 'emergency'
    ]
  },
  applicable_fuel_types: [{
    type: String,
    enum: ['electric', 'petrol', 'diesel', 'cng', 'hybrid', 'all'],
    required: true
  }],
  applicable_vehicle_cat: [{
    type: String,
    enum: ['2_wheeler', '4_wheeler', 'heavy', 'all'],
    required: true
  }],
  duration_minutes: {
    type: Number,
    required: [true, 'Duration is required'],
    default: 60
  },
  base_price: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String
  },
  icon_url: {
    type: String,
    required: false
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
