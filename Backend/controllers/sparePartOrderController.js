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
      .populate('sparePart', '_id name image partNumber amount reviews')
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
