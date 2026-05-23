const SparePartOrder = require('../models/SparePartOrder');
const SparePart = require('../models/SparePart');
const UserSubscription = require('../models/UserSubscription');
const { createNotification } = require('./notificationController');

// @desc    Create new spare part order
// @route   POST /api/spare-part-orders
exports.createOrder = async (req, res, next) => {
  try {
    const { sparePartId, quantity, totalAmount, shippingAddress, offerCode, offerDiscount } = req.body;

    const sparePart = await SparePart.findById(sparePartId);
    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    if (sparePart.stockQty < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
    }

    const deliveryCharge = 50;
    
    // Apply 10% discount if the user is a vendor
    let vendorDiscount = 0;
    if (req.user && req.user.role === 'vendor') {
      vendorDiscount = (sparePart.amount * quantity) * 0.10;
    }

    // Apply dynamic subscription discount if the user has an active subscription
    let subscriptionDiscount = 0;
    if (req.user) {
      const activeSub = await UserSubscription.findOne({ 
        user: req.user.id, 
        status: 'active',
        expiryDate: { $gt: new Date() }
      }).populate('plan');
      
      if (activeSub && activeSub.plan && activeSub.plan.features) {
        let discountPercentage = 0;
        
        for (const feature of activeSub.plan.features) {
          const match = feature.match(/(\d+)%\s*off\s*on\s*spare\s*part/i);
          if (match) {
            discountPercentage = parseInt(match[1], 10);
            break;
          }
        }

        if (discountPercentage > 0) {
          subscriptionDiscount = (sparePart.amount * quantity) * (discountPercentage / 100);
          
          // Increment usage immediately
          if (!activeSub.usageTrackers) activeSub.usageTrackers = {};
          activeSub.usageTrackers.sparePartsUsed = (activeSub.usageTrackers.sparePartsUsed || 0) + 1;
          await activeSub.save();
        }
      }
    }
    
    let totalDiscount = vendorDiscount + subscriptionDiscount;
    // Cap total discount at 100% of the part amount
    if (totalDiscount > (sparePart.amount * quantity)) {
      totalDiscount = (sparePart.amount * quantity);
    }
    
    const computedTotalAmount = (sparePart.amount * quantity) - totalDiscount + deliveryCharge;
    const finalTotalAmount = totalAmount || computedTotalAmount;

    const orderData = {
      user: req.user.id,
      sparePart: sparePartId,
      quantity,
      totalAmount: finalTotalAmount,
      deliveryCharge,
      shippingAddress,
      vendorDiscount: vendorDiscount,
      subscriptionDiscount: subscriptionDiscount
    };

    if (offerCode || offerDiscount) {
      orderData.offerDetails = {
        offerCode: offerCode || null,
        discountAmount: offerDiscount || 0
      };
    }

    const order = await SparePartOrder.create(orderData);

    // Update stock
    sparePart.stockQty -= quantity;
    if (sparePart.stockQty === 0) {
      sparePart.status = 'Out of Stock';
    }
    await sparePart.save();

    // Notify Admin about the new order
    await createNotification({
      title: 'New Spare Part Order',
      message: `A new order has been placed for ${quantity}x ${sparePart.name}.`,
      type: 'status_update',
      recipientRole: 'admin',
      data: { orderId: order._id }
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/spare-part-orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await SparePartOrder.find()
      .populate('user', 'name email role')
      .populate('sparePart', 'name image partNumber amount')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = [...new Set(orders.map(o => o.user?._id).filter(Boolean))];
    const UserSubscription = require('../models/UserSubscription');
    const activeSubs = await UserSubscription.find({
      user: { $in: userIds },
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    const subscribedUserIds = new Set(activeSubs.map(sub => sub.user.toString()));

    orders.forEach(order => {
      if (order.user) {
        order.user.hasActiveSubscription = subscribedUserIds.has(order.user._id.toString());
      }
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's orders
// @route   GET /api/spare-part-orders/my-orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await SparePartOrder.find({ user: req.user.id })
      .populate('sparePart', '_id name image partNumber amount reviews brand category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/spare-part-orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await SparePartOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('sparePart').populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Notification to User
    if (order.user) {
      await createNotification({
        title: 'Spare Part Order Update',
        message: `Your order for ${order.sparePart?.name || 'spare part'} is now ${status}.`,
        type: 'status_update',
        recipientRole: order.user.role || 'user',
        recipientId: order.user._id,
        data: { orderId: order._id }
      });
    }

    // Notification to Admin
    await createNotification({
      title: 'Spare Part Order Status',
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} updated to ${status}.`,
      type: 'status_update',
      recipientRole: 'admin',
      data: { orderId: order._id }
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order payment details
// @route   PUT /api/spare-part-orders/:id/payment
exports.updatePaymentDetails = async (req, res, next) => {
  try {
    const { paymentId, paymentStatus } = req.body;

    if (!paymentId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID and Payment Status are required'
      });
    }

    const order = await SparePartOrder.findById(req.params.id).populate('sparePart').populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update payment details
    order.paymentId = paymentId;
    order.paymentStatus = paymentStatus;

    // If payment is successful, update order status to Confirmed
    if (paymentStatus === 'Paid') {
      order.status = 'Confirmed';
    }

    await order.save();

    // To user
    if (order.user && paymentStatus === 'Paid') {
      await createNotification({
        title: 'Payment Successful',
        message: `Payment for your order ${order.sparePart?.name || ''} was successful!`,
        type: 'payment',
        recipientRole: order.user.role || 'user',
        recipientId: order.user._id,
        data: { orderId: order._id }
      });
    }

    // To Admin
    if (paymentStatus === 'Paid') {
      await createNotification({
        title: 'Payment Received',
        message: `Payment received for order #${order._id.toString().slice(-6).toUpperCase()}`,
        type: 'payment',
        recipientRole: 'admin',
        data: { orderId: order._id }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel spare part order
// @route   PUT /api/spare-part-orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Cancel reason is required'
      });
    }

    const order = await SparePartOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order can be cancelled (only Pending and Confirmed orders can be cancelled)
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Order is already cancelled'
      });
    }

    if (order.status === 'Shipped' || order.status === 'Out of delivery' || order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel order that is already shipped or delivered'
      });
    }

    // Update order status and cancel reason
    order.status = 'Cancelled';
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();

    // Restore stock
    const sparePart = await SparePart.findById(order.sparePart);
    if (sparePart) {
      sparePart.stockQty += order.quantity;
      if (sparePart.status === 'Out of Stock') {
        sparePart.status = 'In Stock';
      }
      await sparePart.save();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
