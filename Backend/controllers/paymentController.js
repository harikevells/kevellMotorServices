const Payment = require('../models/Payment');
const Booking = require('../models/Booking'); // ✅ Changed from 'Order'


exports.processPayPalPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, payerId, transactionId } = req.body;

    const payment = await Payment.findOne({
      order: orderId,
      user: req.user.id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment details
    payment.status = 'completed';
    payment.paypalDetails = {
      paymentId,
      payerId,
      transactionId
    };
    await payment.save();

    // Update order
    await Booking.findByIdAndUpdate(orderId, { // ✅ Updated
      paymentStatus: 'completed',
      status: 'confirmed' // ✅ Updated from orderStatus
    });

    try {
      const { creditWalletIfEligible } = require('./bookingController');
      await creditWalletIfEligible(orderId);
    } catch (err) {
      console.error('Error invoking creditWalletIfEligible in processPayPalPayment:', err);
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment
    });
  } catch (error) {
    next(error);
  }
};


exports.confirmCashPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const payment = await Payment.findOne({
      order: orderId,
      paymentMethod: 'Cash'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = 'completed';
    payment.cashDetails = {
      collectedBy: req.user.id,
      collectedAt: new Date()
    };
    await payment.save();

    await Booking.findByIdAndUpdate(orderId, { // ✅ Updated
      paymentStatus: 'completed',
      status: 'confirmed' // ✅ Updated from orderStatus
    });

    try {
      const { creditWalletIfEligible } = require('./bookingController');
      await creditWalletIfEligible(orderId);
    } catch (err) {
      console.error('Error invoking creditWalletIfEligible in confirmCashPayment:', err);
    }

    res.json({
      success: true,
      message: 'Cash payment confirmed',
      payment
    });
  } catch (error) {
    next(error);
  }
};


exports.getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      order: req.params.orderId,
      user: req.user.id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};