const Tracking = require('../models/Tracking');
const Booking = require('../models/Booking');

exports.getTrackingStatus = async (req, res, next) => {
  try {
    const tracking = await Tracking.findOne({ booking: req.params.bookingId });
    if (!tracking) {
      return res.status(404).json({ success: false, message: 'No tracking data found' });
    }
    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTrackingStatus = async (req, res, next) => {
  try {
    let tracking = await Tracking.findOne({ booking: req.params.bookingId });
    if (!tracking) {
      tracking = new Tracking({ booking: req.params.bookingId });
    }
    
    Object.assign(tracking, req.body);
    await tracking.save();

    // Update booking status if stage changed
    if (req.body.stage) {
      const stageToStatus = {
        'received': 'confirmed',
        'inspected': 'in_progress',
        'in_service': 'in_progress',
        'quality_check': 'in_progress',
        'ready': 'completed'
      };
      await Booking.findByIdAndUpdate(req.params.bookingId, { status: stageToStatus[req.body.stage] });
    }

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    next(error);
  }
};
