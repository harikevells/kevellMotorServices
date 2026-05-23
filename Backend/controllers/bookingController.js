const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Vendor = require('../models/vendor');
const ServiceType = require('../models/ServiceType');
const Slot = require('../models/Slot');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const UserSubscription = require('../models/UserSubscription');
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

    console.log('User booking - Lat:', latitude, 'Lng:', longitude);

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

    let subtotal = serviceDetails.reduce((sum, s) => sum + s.price, 0);

    let discountAmount = 0;
    let appliedOffer = null;
    if (couponCode) {
      const Offer = require('../models/Offer');
      appliedOffer = await Offer.findOne({ couponCode: couponCode.toUpperCase(), activeStatus: true });
      if (appliedOffer) {
        if (appliedOffer.discountType === 'percentage') {
          discountAmount = (subtotal * appliedOffer.discount) / 100;
        } else {
          discountAmount = appliedOffer.discount;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
        subtotal -= discountAmount;
      }
    }

    // Apply dynamic subscription discount if active subscription exists
    let subscriptionDiscount = 0;
    const activeSub = await UserSubscription.findOne({ 
      user: req.user.id, 
      status: 'active',
      expiryDate: { $gt: new Date() }
    }).populate('plan');
    
    if (activeSub && activeSub.plan && activeSub.plan.features) {
      // Find a feature matching e.g., "3 service Booking 20%"
      let limit = 0;
      let discountPercentage = 0;
      
      for (const feature of activeSub.plan.features) {
        const match = feature.match(/(\d+)\s*service[^\d]*(\d+)%/i);
        if (match) {
          limit = parseInt(match[1], 10);
          discountPercentage = parseInt(match[2], 10);
          break; // Stop at first match
        }
      }

      if (discountPercentage > 0) {
        const currentUsage = activeSub.usageTrackers?.servicesUsed || 0;
        if (currentUsage < limit) {
          subscriptionDiscount = (subtotal * discountPercentage) / 100;
          subtotal -= subscriptionDiscount;
          
          // Increment usage immediately
          if (!activeSub.usageTrackers) activeSub.usageTrackers = {};
          activeSub.usageTrackers.servicesUsed = currentUsage + 1;
          await activeSub.save();
        }
      }
    }

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
        email: centerExists.email || 'Unknown',
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
      specialInstructions,
      
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      discountAmount,
      subscriptionDiscount,
      totalAmount,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      appliedOffer: appliedOffer ? appliedOffer._id : null,
      status: 'pending'
    });

    // 6. Update Slot Count
    slot.bookedCount += 1;
    await slot.save();

    // 6.5 Update Offer
    if (appliedOffer) {
      appliedOffer.timesRedeemed = (appliedOffer.timesRedeemed || 0) + 1;
      appliedOffer.revenueGenerated = (appliedOffer.revenueGenerated || 0) + totalAmount;
      await appliedOffer.save();
    }

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

    const { reason } = req.body;

    booking.status = 'cancelled';
    if (reason) {
      booking.cancelReason = reason;
    }
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
      message: `Booking ${booking.bookingRef} has been cancelled by the user. Reason: ${reason || 'Not provided'}`,
      type: 'booking',
      recipientRole: 'admin',
      data: { bookingId: booking._id }
    });

    // To Vendor
    const vendor = await Vendor.findById(booking.center);
    if (vendor) {
      await createNotification({
        title: 'Booking Cancelled',
        message: `Booking ${booking.bookingRef} has been cancelled by the customer. Reason: ${reason || 'Not provided'}`,
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
    console.log('User Role:', req.user?.role);

    let query = {};

    // If user is a vendor, only show their own bookings
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user.id });
      if (!vendor) {
        console.error(`[AUTH-FILTER] Vendor profile not found for user ${req.user.id}`);
        return res.status(404).json({ success: false, message: 'Vendor profile not found' });
      }
      query.center = vendor._id;
      console.log(`[AUTH-FILTER] Successfully applied center filter: ${vendor._id} (${vendor.shopName})`);
    }

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
      .sort({ createdAt: -1 })
      .lean();

    // Check subscriptions for unique users
    const userIds = [...new Set(bookings.map(b => b.user?._id).filter(Boolean))];
    const UserSubscription = require('../models/UserSubscription');
    const activeSubs = await UserSubscription.find({
      user: { $in: userIds },
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    const subscribedUserIds = new Set(activeSubs.map(sub => sub.user.toString()));

    bookings.forEach(booking => {
      if (booking.user) {
        if (!booking.userDetails) booking.userDetails = {};
        booking.userDetails.hasActiveSubscription = subscribedUserIds.has(booking.user._id.toString());
      }
    });

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

    // Automatically trigger wallet crediting if status and paymentStatus are completed
    await exports.creditWalletIfEligible(booking._id);

    const statusMsg = status.charAt(0).toUpperCase() + status.slice(1);
    
    // To User
    if (booking.user) {
      await createNotification({
        title: 'Booking Status Update',
        message: `Your booking (${booking.bookingRef}) status has been updated to ${statusMsg}.`,
        type: 'status_update',
        recipientRole: 'user',
        recipientId: booking.user._id,
        data: { bookingId: booking._id }
      });
    }

    // To Vendor
    if (booking.center && booking.center.user) {
      await createNotification({
        title: 'Booking Status Update',
        message: `Booking (${booking.bookingRef}) status changed to ${statusMsg}.`,
        type: 'status_update',
        recipientRole: 'vendor',
        recipientId: booking.center.user,
        data: { bookingId: booking._id }
      });
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

    // Notify Admin
    await createNotification({
      title: 'New Service Review',
      message: `A new review was added for booking ${booking.bookingRef || 'a service'} with a ${rating}-star rating.`,
      type: 'status_update',
      recipientRole: 'admin',
      data: { bookingId: booking._id }
    });

    // Notify Vendor
    if (center && center.user) {
      await createNotification({
        title: 'New Review on your Service',
        message: `A customer added a ${rating}-star review for booking ${booking.bookingRef || 'your service'}.`,
        type: 'status_update',
        recipientRole: 'vendor',
        recipientId: center.user,
        data: { bookingId: booking._id }
      });
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

exports.replyBookingReview = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.review || !booking.review.rating) {
      return res.status(400).json({ success: false, message: 'No review found for this booking' });
    }

    booking.review.reply = reply;
    booking.review.repliedByRole = req.user.role || 'vendor'; // Fallback if req.user.role is somehow missing
    booking.markModified('review');
    await booking.save();

    // Notify User
    if (booking.user) {
      await createNotification({
        title: 'Reply to your Review',
        message: `The vendor replied to your review on booking ${booking.bookingRef || 'your service'}.`,
        type: 'status_update',
        recipientRole: 'user',
        recipientId: booking.user,
        data: { bookingId: booking._id }
      });
    }

    // Notify Admin
    await createNotification({
      title: 'Review Reply Added',
      message: `A vendor replied to the review on booking ${booking.bookingRef || 'a service'}.`,
      type: 'status_update',
      recipientRole: 'admin',
      data: { bookingId: booking._id }
    });

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

exports.getCenterReviews = async (req, res, next) => {
  try {
    const { centerId } = req.params;
    const bookings = await Booking.find({ 
      center: centerId, 
      'review.rating': { $exists: true } 
    })
    .populate('user', 'name email profileImage')
    .sort({ 'review.createdAt': -1 });

    const reviews = bookings.map(b => ({
      _id: b._id,
      user: {
        name: b.userDetails?.name || b.user?.name || 'Anonymous',
        email: b.user?.email || '',
        image: b.user?.profileImage || ''
      },
      rating: b.review.rating,
      comment: b.review.comment,
      createdAt: b.review.createdAt || b.updatedAt
    }));

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

exports.creditWalletIfEligible = async (bookingId) => {
  try {
    const Booking = require('../models/Booking');
    const Vendor = require('../models/vendor');
    const User = require('../models/User');
    const Wallet = require('../models/Wallet');
    const WalletTransaction = require('../models/WalletTransaction');

    const booking = await Booking.findById(bookingId).populate('center');
    if (!booking) return;

    console.log(`[WALLET-CHECK] Booking: ref=${booking.bookingRef}, status=${booking.status}, paymentStatus=${booking.paymentStatus}`);

    // Wallet should be credited as soon as payment is completed.
    if (booking.paymentStatus === 'completed') {
      // Safety check to avoid double-crediting
      const existingTx = await WalletTransaction.findOne({ 
        referenceId: booking._id.toString(), 
        type: 'earning' 
      });

      if (!existingTx) {
        const vendorRecord = booking.center;
        if (vendorRecord) {
          // 1. Credit Vendor Wallet with pendingBalance
          let vendorWallet = await Wallet.findOne({ user: vendorRecord.user });
          if (!vendorWallet) {
            vendorWallet = new Wallet({ user: vendorRecord.user, balance: 0, pendingBalance: 0 });
          }
          
          const commissionPercent = vendorRecord.commission || 10;
          const platformFee = booking.totalAmount * (commissionPercent / 100);
          const vendorEarning = booking.totalAmount - platformFee;
          
          vendorWallet.pendingBalance = (vendorWallet.pendingBalance || 0) + vendorEarning;
          await vendorWallet.save();
          
          const vendorTx = new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendorRecord.user,
            type: 'earning',
            amount: vendorEarning,
            status: 'pending',
            description: `Pending earnings from booking service ${booking.bookingRef} (Awaiting withdrawal)`,
            referenceId: booking._id.toString()
          });
          await vendorTx.save();
          
          // 2. Credit Admin Wallet with full booking total amount
          const adminUser = await User.findOne({ role: 'admin' });
          if (adminUser) {
            let adminWallet = await Wallet.findOne({ user: adminUser._id });
            if (!adminWallet) {
              adminWallet = new Wallet({ user: adminUser._id, balance: 0, pendingBalance: 0 });
            }
            adminWallet.balance += booking.totalAmount;
            await adminWallet.save();
            
            const adminTxFee = new WalletTransaction({
              wallet: adminWallet._id,
              user: adminUser._id,
              type: 'platform_fee',
              amount: platformFee,
              status: 'completed',
              description: `Commission from booking Ref: ${booking.bookingRef} (Total: ₹${booking.totalAmount})`,
              referenceId: booking._id.toString()
            });
            await adminTxFee.save();

            const adminTxVendorShare = new WalletTransaction({
              wallet: adminWallet._id,
              user: adminUser._id,
              type: 'add_funds',
              amount: vendorEarning,
              status: 'completed',
              description: `Vendor share held for booking Ref: ${booking.bookingRef} (Vendor: ${vendorRecord.shopName})`,
              referenceId: booking._id.toString()
            });
            await adminTxVendorShare.save();
          }
          console.log(`[WALLET-CREDIT] Successfully credited ₹${vendorEarning} to Vendor (${vendorRecord.shopName}) and ₹${platformFee} to Admin for booking ${booking.bookingRef}`);
        }
      } else {
        console.log(`[WALLET-CHECK] Booking ${booking.bookingRef} already credited.`);
      }
    }
  } catch (err) {
    console.error('Error crediting wallet in helper:', err);
  }
};

