const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const ServiceCenter = require('../models/ServiceCenter');
const ServiceType = require('../models/ServiceType');
const Slot = require('../models/Slot');
const Tracking = require('../models/Tracking');
const mongoose = require('mongoose');

const generateBookingRef = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `EV${year}${random}`;
};

exports.createBooking = async (req, res, next) => {
  try {
    const { vehicle, center, services, bookingDate, timeSlot, paymentMethod, specialInstructions, couponCode } = req.body;

    // 1. Validate Vehicle
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists || vehicleExists.user.toString() !== req.user.id) {
      console.error('[Booking Error] Invalid vehicle selection:', { vehicle, userId: req.user.id });
      return res.status(400).json({ success: false, message: 'Invalid vehicle selection' });
    }

    // 2. Validate Center
    const centerExists = await ServiceCenter.findById(center);
    if (!centerExists) {
      console.error('[Booking Error] Service center not found:', center);
      return res.status(404).json({ success: false, message: 'Service center not found' });
    }

    // 3. Validate Slot Availability
    const slot = await Slot.findOne({ center, date: bookingDate, time: timeSlot });
    if (!slot || slot.bookedCount >= slot.maxCapacity || !slot.isActive) {
      console.error('[Booking Error] Time slot unavailable:', { center, bookingDate, timeSlot, slot });
      return res.status(400).json({ success: false, message: 'Selected time slot is no longer available' });
    }

    // 4. Calculate Pricing
    const serviceDetails = await ServiceType.find({ _id: { $in: services } });
    if (serviceDetails.length === 0) {
      console.error('[Booking Error] No valid services selected:', services);
      return res.status(400).json({ success: false, message: 'No valid services selected' });
    }

    const subtotal = serviceDetails.reduce((sum, s) => sum + s.base_price, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const totalAmount = subtotal + tax;

    // 5. Create Booking
    const booking = await Booking.create({
      bookingRef: generateBookingRef(),
      user: req.user.id,
      vehicle,
      center,
      services,
      bookingDate,
      timeSlot,
      paymentMethod,
      totalAmount,
      tax,
      couponCode,
      specialInstructions,
      status: 'pending'
    });

    // 6. Update Slot Count
    slot.bookedCount += 1;
    await slot.save();

    // 7. Initialize Tracking
    await Tracking.create({
      booking: booking._id,
      stage: 'received'
    });


    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('vehicle')
      .populate('center')
      .populate('services')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicle')
      .populate('center')
      .populate('services');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'in_progress') {
      return res.status(400).json({ success: false, message: 'Cannot cancel active or completed service' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Revert slot count
    await Slot.findOneAndUpdate(
      { center: booking.center, date: booking.bookingDate, time: booking.timeSlot },
      { $inc: { bookedCount: -1 } }
    );

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    next(error);
  }
};
