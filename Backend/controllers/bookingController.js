const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Vendor = require('../models/vendor');
const ServiceType = require('../models/ServiceType');
const Slot = require('../models/Slot');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification } = require('./notificationController');

const generateBookingRef = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `EV${year}${random}`;
};

exports.createBooking = async (req, res, next) => {
  try {
    const { 
      vehicle, center, services, bookingDate, timeSlot, 
      paymentMethod, specialInstructions, couponCode,
      // User details and location
      userName, userPhone, userAddress, latitude, longitude
    } = req.body;

    // 1. Validate Vehicle
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists || vehicleExists.user.toString() !== req.user.id) {
      console.error('[Booking Error] Invalid vehicle selection:', { vehicle, userId: req.user.id });
      return res.status(400).json({ success: false, message: 'Invalid vehicle selection' });
    }

    // 2. Validate Center (Vendor)
    const centerExists = await Vendor.findById(center);
    if (!centerExists) {
      console.error('[Booking Error] Vendor (Service center) not found:', center);
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // 3. Validate Slot Availability
    let slot = await Slot.findOne({ center, date: bookingDate, time: timeSlot });

    // Auto-create slot if it hasn't been initialized yet
    if (!slot) {
      slot = await Slot.create({
        center,
        date: bookingDate,
        time: timeSlot,
        maxCapacity: 5,
        bookedCount: 0,
        isActive: true
      });
    }

    if (slot.bookedCount >= slot.maxCapacity || !slot.isActive) {
      console.error('[Booking Error] Time slot unavailable:', { center, bookingDate, timeSlot, slot });
      return res.status(400).json({ success: false, message: 'Selected time slot is no longer available' });
    }

    // 4. Calculate Pricing
    const { serviceNames: manualServiceNames } = req.body;
    const serviceDetails = services && services.length > 0 
      ? await ServiceType.find({ _id: { $in: services } }) 
      : [];

    if (serviceDetails.length === 0 && (!manualServiceNames || manualServiceNames.length === 0)) {
      console.error('[Booking Error] No valid services selected:', { services, manualServiceNames });
      return res.status(400).json({ success: false, message: 'No valid services selected' });
    }

    const subtotal = serviceDetails.reduce((sum, s) => sum + s.price, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const totalAmount = subtotal + tax;

    const finalServiceNames = [
      ...serviceDetails.map(s => s.serviceName),
      ...(manualServiceNames || [])
    ];

    // Build denormalized snapshots for historical context
    const fullUser = await User.findById(req.user.id);
    const finalUserName = userName || fullUser?.name || 'Unknown';
    const finalUserPhone = userPhone || fullUser?.phone || 'Unknown';
    const finalUserAddress = userAddress || (fullUser?.address?.street ? `${fullUser.address.street}, ${fullUser.address.city || ''}` : '');
    
    const vendorAddressString = centerExists.address?.street ? `${centerExists.address.street}, ${centerExists.address.city || ''}` : '';

    // 5. Create Booking
    const booking = await Booking.create({
      bookingRef: generateBookingRef(),
      user: req.user.id,
      vehicle,
      center,
      services,
      
      // Store snapshots
      userDetails: {
        name: finalUserName,
        phone: finalUserPhone,
        address: finalUserAddress,
        latitude: latitude || 0,
        longitude: longitude || 0
      },
      vendorDetails: {
        vendorName: centerExists.ownerName || 'Unknown',
        shopName: centerExists.shopName,
        phone: centerExists.phone || centerExists.whatsappNumber || 'Unknown',
        address: vendorAddressString
      },
      vehicleDetails: {
        vehicle_category: vehicleExists.vehicle_category,
        brand: vehicleExists.brand,
        model: vehicleExists.model,
        year: vehicleExists.year,
        registration_no: vehicleExists.registration_no,
        fuel_type: vehicleExists.fuel_type
      },
      serviceNames: finalServiceNames,

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


    // Re-fetch with populated fields to fulfill frontend requirements for Vendor and User details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', '-password')
      .populate('center')
      .populate('vehicle')
      .populate('services');

    // --- Generate Notifications ---
    // 1. To Admin
    await createNotification({
      title: 'Booking services',
      message: `A new booking has been received and is awaiting confirmation. Ref: ${booking.bookingRef}`,
      type: 'booking',
      recipientRole: 'admin',
      data: { bookingId: booking._id }
    });

    // 2. To Vendor
    await createNotification({
      title: 'New Booking Received',
      message: `You have received a new booking from ${fullUser?.name || 'a customer'}. Ref: ${booking.bookingRef}`,
      type: 'booking',
      recipientRole: 'vendor',
      recipientId: centerExists.user, // The user account linked to vendor
      data: { bookingId: booking._id }
    });

    // 3. To User
    await createNotification({
      title: 'Booking Confirmed',
      message: `Your booking for ${vehicleExists.brand} ${vehicleExists.model} has been received. Ref: ${booking.bookingRef}`,
      type: 'booking',
      recipientRole: 'user',
      recipientId: req.user.id,
      data: { bookingId: booking._id }
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('user', '-password')
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
      .populate('user', '-password')
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

    // --- Generate Notifications ---
    // To Admin
    await createNotification({
      title: 'Booking Cancelled',
      message: `Booking ${booking.bookingRef} has been cancelled by the user.`,
      type: 'booking',
      recipientRole: 'admin',
      data: { bookingId: booking._id }
    });

    // To Vendor
    const vendor = await Vendor.findById(booking.center);
    if (vendor) {
      await createNotification({
        title: 'Booking Cancelled',
        message: `Booking ${booking.bookingRef} has been cancelled by the customer.`,
        type: 'booking',
        recipientRole: 'vendor',
        recipientId: vendor.user,
        data: { bookingId: booking._id }
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllBookingsAdmin = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    console.log('--- ADMIN BOOKING FETCH ---');
    console.log('Query Params:', { search, status });

    let query = {};

    if (search) {
      query.bookingRef = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('user', '-password')
      .populate('vehicle')
      .populate('center')
      .populate('services')
      .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings`);

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('BACKEND ERROR IN ADMIN BOOKING FETCH:', error);
    next(error);
  }
};

exports.updateBookingStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user', '-password')
      .populate('vehicle')
      .populate('center')
      .populate('services');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

exports.addBookingReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    // Allow updating existing review
    // if (booking.review && booking.review.rating) {
    //   return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    // }

    booking.review = {
      rating,
      comment,
      createdAt: new Date()
    };
    
    booking.markModified('review');

    await booking.save();

    // Optionally update the shop rating
    const center = await Vendor.findById(booking.center);
    if (center) {
      const shopBookings = await Booking.find({ 
        center: booking.center, 
        'review.rating': { $exists: true } 
      });
      
      const totalRating = shopBookings.reduce((sum, b) => sum + b.review.rating, 0);
      center.rating = totalRating / shopBookings.length;
      center.totalReviews = shopBookings.length; // Fixed from total_reviews
      await center.save();
    }

    res.json({
      success: true,
      message: 'Review added successfully',
      data: booking
    });

  } catch (error) {
    next(error);
  }
};

