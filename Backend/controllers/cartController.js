const Cart = require('../models/Cart');
const Document = require('../models/Document');
const Service = require('../models/ServiceType'); // ✅ Changed from 'Service'
const Shop = require('../models/ServiceCenter'); // ✅ Added

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.document', 'fileName originalName fileUrl totalPages selectedPages')
      .populate('items.shop', 'center_name profile_image_url') // ✅ Updated fields
      .populate('items.service', 'name price'); // ✅ Updated fields

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching cart'
    });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { 
      documentId, shopId, serviceId, 
      paperSize, printType, quantity, 
      selectedPages 
    } = req.body;

    console.log("Adding to cart - Request body:", req.body);
    console.log("User ID:", req.user.id);

    // Validate document
    const document = await Document.findOne({
      _id: documentId,
      user: req.user.id
    });
    
    if (!document) {
      console.log("Document not found for ID:", documentId);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    console.log("Document found:", document._id);

    // Validate service
    const service = await Service.findById(serviceId);
    if (!service) {
      console.log("Service not found for ID:", serviceId);
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    console.log("Service found:", service._id, "Price:", service.price);

    // Calculate price
    const pricePerUnit = service.price;
    const totalPrice = pricePerUnit * quantity;

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      console.log("Creating new cart for user:", req.user.id);
      cart = new Cart({ user: req.user.id, items: [] });
    } else {
      console.log("Existing cart found with", cart.items.length, "items");
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      item => item.document.toString() === documentId &&
              item.service.toString() === serviceId &&
              item.paperSize === paperSize &&
              item.printType === printType
    );

    if (existingItemIndex > -1) {
      // Update existing item
      console.log("Updating existing item at index:", existingItemIndex);
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice = 
        cart.items[existingItemIndex].pricePerUnit * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      console.log("Adding new item to cart");
      cart.items.push({
        document: documentId,
        shop: shopId,
        service: serviceId,
        paperSize,
        printType,
        quantity,
        selectedPages: selectedPages || document.selectedPages,
        pricePerUnit,
        totalPrice
      });
    }

    // ✅ MANUALLY CALCULATE TOTALS
    cart.totalItems = cart.items.length;
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    console.log("Before save - Total items:", cart.totalItems, "Subtotal:", cart.subtotal);

    await cart.save();
    console.log("Cart saved successfully");
    
    // Populate references
    await cart.populate('items.document', 'fileName originalName');
    await cart.populate('items.shop', 'center_name'); // ✅ Updated field
    await cart.populate('items.service', 'name price'); // ✅ Updated field

    res.json({
      success: true,
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding item to cart'
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    item.quantity = quantity;
    item.totalPrice = item.pricePerUnit * quantity;
    
    // ✅ RECALCULATE TOTALS AFTER UPDATE
    cart.totalItems = cart.items.length;
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    await cart.save();

    res.json({
      success: true,
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating cart'
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );
    
    // ✅ RECALCULATE TOTALS AFTER REMOVE
    cart.totalItems = cart.items.length;
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing item'
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.totalItems = 0;
      cart.subtotal = 0;
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error clearing cart'
    });
  }
};