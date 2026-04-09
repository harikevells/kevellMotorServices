const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  brand: {
    type: String,
    required: [true, 'Brand is required']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  registration_no: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true
  },
  odometer_reading: {
    type: Number,
    required: false
  },
  saveThisVehicle: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

