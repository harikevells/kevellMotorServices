const mongoose = require('mongoose');

const vehicleBrandSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  vehicle_category: {
    type: String,
    enum: ['2_wheeler', '4_wheeler', 'heavy'],
    required: [true, 'Vehicle category is required']
  },
  fuel_type: {
    type: String,
    enum: ['electric', 'petrol', 'diesel', 'cng', 'hybrid', 'other'],
    required: [true, 'Fuel type is required']
  },
  logo_url: {
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

module.exports = mongoose.model('VehicleBrand', vehicleBrandSchema);
