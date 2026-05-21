const Slot = require('../models/Slot');
const mongoose = require('mongoose');

exports.getSlots = async (req, res, next) => {
  try {
    const { centerId } = req.params;
    const { date, all } = req.query;

    if (!centerId) {
      return res.status(400).json({ success: false, message: 'Center ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ success: false, message: 'Invalid Center ID format' });
    }

    const Vendor = require('../models/vendor');
    const centerObjId = new mongoose.Types.ObjectId(centerId);

    // Find if centerId is either the Vendor _id or the User _id of the vendor
    const vendorDocs = await Vendor.find({
      $or: [
        { _id: centerObjId },
        { user: centerObjId }
      ]
    });

    const matchedIds = [centerObjId];
    vendorDocs.forEach(v => {
      if (v._id) matchedIds.push(v._id);
      if (v.user) matchedIds.push(v.user);
    });

    const query = { 
      center: { $in: matchedIds }
    };
    
    if (date) {
      query.date = date;
    } else if (all !== 'true') {
      query.date = { $gte: new Date().toISOString().split('T')[0] };
    }

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
    const Vendor = require('../models/vendor');
    
    // Guard: If center in req.body is a User ID, map it to the corresponding Vendor ID
    if (req.body.center && mongoose.Types.ObjectId.isValid(req.body.center)) {
      const centerObjId = new mongoose.Types.ObjectId(req.body.center);
      const vendorDoc = await Vendor.findOne({ user: centerObjId });
      if (vendorDoc) {
        req.body.center = vendorDoc._id;
      }
    }

    const slot = await Slot.create(req.body);
    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

exports.deleteSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.status(200).json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
};
