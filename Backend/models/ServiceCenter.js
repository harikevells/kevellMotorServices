const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: false // Optional for existing centers
  },
  center_name: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true
  },
  owner_name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone_number: {
    type: String,
    required: [true, 'Phone number is required']
  },
  whatsapp_number: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: [true, 'Full address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0.0
  },
  total_reviews: {
    type: Number,
    default: 0
  },
  opening_time: {
    type: String,
    default: "09:00 AM"
  },
  closing_time: {
    type: String,
    default: "06:00 PM"
  },
  is_open_sunday: {
    type: Boolean,
    default: false
  },
  profile_image_url: {
    type: String,
    required: false
  },
  specializations: [{
    type: String,
    enum: ['2_wheeler', '4_wheeler', 'heavy', 'electric', 'petrol', 'diesel', 'cng', 'hybrid']
  }],
  supported_brands: [{
    type: String
  }],
  amenities: [{
    type: String,
    enum: ['waiting_area', 'wifi', 'restroom', 'cafeteria', 'pickup_drop']
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

serviceCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
