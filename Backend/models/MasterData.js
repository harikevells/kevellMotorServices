const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['city', 'language'],
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    activeStatus: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Create a unique index for type and name combination
masterDataSchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MasterData', masterDataSchema);
