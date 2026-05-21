const SparePartOrder = require('../models/SparePartOrder');
const SparePart = require('../models/SparePart');

// @desc    Create new spare part order
// @route   POST /api/spare-part-orders
exports.createOrder = async (req, res, next) => {
  try {
    const { sparePartId, quantity, shippingAddress } = req.body;

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

    const totalAmount = sparePart.amount * quantity;

    const order = await SparePartOrder.create({
      user: req.user.id,
      sparePart: sparePartId,
      quantity,
      totalAmount,
      shippingAddress
    });

    // Update stock
    sparePart.stockQty -= quantity;
    if (sparePart.stockQty === 0) {
      sparePart.status = 'Out of Stock';
    }
    await sparePart.save();

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
      .populate('user', 'name email')
      .populate('sparePart', 'name image partNumber')
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
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

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

    const order = await SparePartOrder.findById(req.params.id);

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

    // Restore stock if payment was not completed
    if (order.paymentStatus !== 'Paid') {
      const sparePart = await SparePart.findById(order.sparePart);
      if (sparePart) {
        sparePart.stockQty += order.quantity;
        if (sparePart.status === 'Out of Stock') {
          sparePart.status = 'In Stock';
        }
        await sparePart.save();
      }
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
