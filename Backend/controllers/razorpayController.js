// controllers/razorpayController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking'); // ✅ Changed from 'Order'
const Cart = require('../models/Cart');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 * Step 1: Create order in Razorpay
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Get the order from database
    const order = await Booking.findOne({ // ✅ Updated
      _id: orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      order: orderId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    // Create options for Razorpay
    const options = {
      amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${order.bookingRef}`, // ✅ Updated
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id,
        orderNumber: order.bookingRef // ✅ Updated
      }
    };

    console.log('Creating Razorpay order with options:', options);

    // Create order in Razorpay
    const razorpayOrder = await razorpay.orders.create(options);

    console.log('Razorpay order created:', razorpayOrder);

    // Create or update payment record
    let payment = await Payment.findOne({ order: orderId });
    
    if (payment) {
      payment.paymentMethod = 'Razorpay';
      payment.razorpayDetails = {
        orderId: razorpayOrder.id
      };
      payment.status = 'pending';
    } else {
      payment = await Payment.create({
        order: orderId,
        user: req.user.id,
        paymentMethod: 'Razorpay',
        amount: order.totalAmount,
        status: 'pending',
        razorpayDetails: {
          orderId: razorpayOrder.id
        }
      });
    }

    await payment.save();

    // Update order with payment reference
    order.paymentDetails = payment._id;
    await order.save();

    res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      },
      order: {
        id: order._id,
        orderNumber: order.bookingRef, // ✅ Updated
        amount: order.totalAmount
      }
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    next(error);
  }
};

/**
 * Verify Razorpay Payment
 * Step 2: Verify payment after successful frontend payment
 */
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    console.log('Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    });

    // Find payment record
    const payment = await Payment.findOne({ 
      'razorpayDetails.orderId': razorpay_order_id,
      order: orderId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Generate signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Signature comparison:');
    console.log('Expected:', expectedSignature);
    console.log('Received:', razorpay_signature);

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful
      payment.status = 'completed';
      payment.razorpayDetails.paymentId = razorpay_payment_id;
      payment.razorpayDetails.signature = razorpay_signature;
      payment.transactionDate = new Date();
      await payment.save();

      // Update order
      const order = await Booking.findById(orderId); // ✅ Updated
      if (order) {
        order.paymentStatus = 'completed';
        order.status = 'confirmed'; // ✅ Updated from orderStatus
        order.paymentDetails = payment._id;
        await order.save();

        // Clear cart
        await Cart.findOneAndUpdate(
          { user: req.user.id },
          { $set: { items: [], totalItems: 0, subtotal: 0 } }
        );
      }

      // Fetch payment details from Razorpay to get more info
      try {
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
        payment.razorpayDetails.method = razorpayPayment.method;
        payment.razorpayDetails.bank = razorpayPayment.bank;
        payment.razorpayDetails.cardId = razorpayPayment.card_id;
        payment.razorpayDetails.vpa = razorpayPayment.vpa;
        payment.razorpayDetails.email = razorpayPayment.email;
        payment.razorpayDetails.contact = razorpayPayment.contact;
        await payment.save();
      } catch (fetchError) {
        console.log('Could not fetch payment details:', fetchError);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment: {
          id: payment._id,
          status: payment.status,
          razorpay_payment_id
        }
      });
    } else {
      // Payment verification failed
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    next(error);
  }
};

/**
 * Get Payment Status
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

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

    // If Razorpay payment, fetch latest status from Razorpay
    if (payment.paymentMethod === 'Razorpay' && payment.razorpayDetails?.paymentId) {
      try {
        const razorpayPayment = await razorpay.payments.fetch(payment.razorpayDetails.paymentId);
        
        res.json({
          success: true,
          payment: {
            ...payment.toObject(),
            razorpayStatus: razorpayPayment.status,
            razorpayDetails: {
              ...payment.razorpayDetails,
              method: razorpayPayment.method,
              bank: razorpayPayment.bank,
              vpa: razorpayPayment.vpa
            }
          }
        });
      } catch (error) {
        // If can't fetch from Razorpay, return local data
        res.json({
          success: true,
          payment
        });
      }
    } else {
      res.json({
        success: true,
        payment
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook handler for Razorpay events
 */
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Webhook event:', event);

    switch (event) {
      case 'payment.captured':
        // Handle successful payment
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.notes?.orderId;

        if (orderId) {
          const payment = await Payment.findOne({ 
            'razorpayDetails.orderId': paymentEntity.order_id 
          });

          if (payment) {
            payment.status = 'completed';
            payment.razorpayDetails.paymentId = paymentEntity.id;
            payment.razorpayDetails.method = paymentEntity.method;
            payment.razorpayDetails.bank = paymentEntity.bank;
            payment.razorpayDetails.vpa = paymentEntity.vpa;
            await payment.save();

            await Booking.findByIdAndUpdate(orderId, { // ✅ Updated
              paymentStatus: 'completed',
              status: 'confirmed' // ✅ Updated from orderStatus
            });
          }
        }
        break;

      case 'payment.failed':
        // Handle failed payment
        const failedPayment = payload.payment.entity;
        
        const failedPaymentRecord = await Payment.findOne({
          'razorpayDetails.orderId': failedPayment.order_id
        });

        if (failedPaymentRecord) {
          failedPaymentRecord.status = 'failed';
          await failedPaymentRecord.save();
        }
        break;

      default:
        console.log('Unhandled event:', event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Refund Payment
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    if (!payment.razorpayDetails?.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'No Razorpay payment ID found'
      });
    }

    // Create refund in Razorpay
    const refundAmount = amount || payment.amount * 100; // Convert to paise
    const refund = await razorpay.payments.refund(
      payment.razorpayDetails.paymentId,
      {
        amount: refundAmount,
        notes: {
          reason: reason || 'Customer requested refund',
          originalOrder: payment.order.toString()
        }
      }
    );

    // Update payment record
    payment.status = 'refunded';
    payment.refundDetails = {
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      refundStatus: refund.status,
      refundedAt: new Date(),
      reason: reason || 'Customer requested refund'
    };
    await payment.save();

    // Update order
    await Booking.findByIdAndUpdate(payment.order, { // ✅ Updated
      paymentStatus: 'refunded'
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });

  } catch (error) {
    console.error('Refund error:', error);
    next(error);
  }
};