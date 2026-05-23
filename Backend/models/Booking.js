const mongoose = require('mongoose');

// models/Booking.js
const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType'
  }],
  // --- Denormalized Snapshots ---
  userDetails: {
    name: String,
    phone: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  vendorDetails: {
    vendorName: String,
    shopName: String,
    phone: String,
    email: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  vehicleDetails: {
    vehicle_category: String,
    brand: String,
    model: String,
    year: Number,
    registration_no: String,
    fuel_type: String
  },
  serviceNames: [String],
  // ------------------------------
  bookingDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  timeSlot: {
    type: String, // "09:00 AM"
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'on_the_way', 'received', 'inspected',
      'in_service', 'quality_check', 'ready', 'out_for_delivery', 'completed', 'delivered', 'cancelled'
    ],
    default: 'pending'
  },
  subscriptionDiscount: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'GPay', 'Card', 'Razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String
  },
  specialInstructions: {
    type: String
  },
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date
    },
    reply: {
      type: String
    },
    repliedByRole: {
      type: String
    }
  },
  bill: {
    type: String
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
