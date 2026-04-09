const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  fileType: {
    type: String, // pdf, doc, etc
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  selectedPages: {
    type: String, // "1,4,5,6,7,10" as shown in screenshot
    default: 'all'
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'cancelled'],
    default: 'uploaded'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);