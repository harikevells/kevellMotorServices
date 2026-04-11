const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profileImage: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin', 'delivery boy'],
    default: 'user'
  },
  phone: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  // Address fields
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' }
  },
  // Default delivery address
  defaultAddress: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);