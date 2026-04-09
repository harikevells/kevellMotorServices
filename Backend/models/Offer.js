const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },

    offerTitle: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true
    },

    discount: {
      type: Number,
      required: [true, 'Discount is required'],
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },

    activeStatus: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter', // ✅ Changed from 'Shop'
      default: null
    }
  },
  {
    timestamps: true
  }
);


// ✅ Validate that endDate is after startDate
offerSchema.pre('save', function () {
  if (this.endDate < this.startDate) {
    throw new Error('End date must be after start date');
  }
});


// ✅ Index for better search performance
offerSchema.index({
  shopName: 'text',
  offerTitle: 'text',
  category: 'text'
});


module.exports = mongoose.model('Offer', offerSchema);