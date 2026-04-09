const Slot = require('../models/Slot');
const mongoose = require('mongoose');

exports.getSlots = async (req, res, next) => {
  try {
    const { centerId } = req.params;
    const { date } = req.query;

    if (!centerId) {
      return res.status(400).json({ success: false, message: 'Center ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ success: false, message: 'Invalid Center ID format' });
    }

    const query = { 
      center: new mongoose.Types.ObjectId(centerId),
      date: date || { $gte: new Date().toISOString().split('T')[0] }
    };

    console.log('Slots Query (Raw):', query);
    const slots = await Slot.find(query).sort({ time: 1 });
    console.log(`Found ${slots.length} slots for query:`, JSON.stringify(query));

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid Center ID' });
    }
    next(error);
  }
};

exports.createSlot = async (req, res, next) => {
  try {
    const slot = await Slot.create(req.body);
    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};
