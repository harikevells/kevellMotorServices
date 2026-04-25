// models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true
  },
  licenseNo: {
    type: String,
    trim: true
  },
  gstNo: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    default: 0
  },
  ownerName: {
    type: String,
    trim: true
  },
  dob: String,
  whatsappNumber: String,
  emergencyNumber: String,
  bloodGroup: String,
  languages: [String],
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  shopImage: {
    type: String,
    // required: true // Make optional for multi-step registration
  },
  profilePicture: String,
  documents: {
    gstCertificate: { type: String }, // URL to uploaded document
    panCard: { type: String },
    addressProof: { type: String },
    aadharCard: { type: String }
  },
  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    branch: { type: String },
    upiId: { type: String }
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType' // ✅ Changed from 'Service'
  }],
  workingDays: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: { type: Boolean, default: true },
    openingTime: String,
    closingTime: String
  }],
  defaultTimings: {
    openingTime: { type: String, default: '09:00 AM' },
    closingTime: { type: String, default: '06:00 PM' }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number, // Commission percentage for platform
    default: 10   // 10% default
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false // Admin needs to approve vendor
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rejectionReason: String,
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
vendorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vendor', vendorSchema);