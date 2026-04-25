const Vendor = require('../models/vendor');
const Order = require('../models/Booking');  // ✅ Changed from 'Order'
const Service = require('../models/ServiceType'); // ✅ Changed from 'Service'
const Document = require('../models/Document');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Shop = require('../models/ServiceCenter'); // ✅ Changed from 'Shop'
const User = require('../models/User');           // ✅ Added
const DeliveryBoy = require('../models/DeliveryBoy'); // ✅ Moved to top
const bcrypt = require('bcryptjs');                // ✅ Added
const jwt = require('jsonwebtoken');                // ✅ Added
const fs = require('fs');
const path = require('path');
const { createNotification } = require('./notificationController');

// ============= VENDOR REGISTRATION & PROFILE =============

// Register as vendor
exports.registerVendor = async (req, res, next) => {
  try {
    console.log("=== REQUEST BODY ===");
    console.log(req.body);
    console.log("=== REQUEST FILE ===");
    console.log(req.file);

    const {
      shopName, email, phone, password,
      street, city, state, pincode, country,
      latitude, longitude,
      defaultTimings
    } = req.body;

    console.log("Email value:", email);

    // Check if user already has a vendor profile
    const existingVendor = await Vendor.findOne({ user: req.user.id });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'You already have a vendor profile'
      });
    }

    // Check if email already exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if shop image uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Shop image is required'
      });
    }

    // ✅ Create new user account for vendor
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: shopName,
      email: email,
      password: hashedPassword,
      role: 'vendor',
      phone: phone
    });

    // Create vendor profile linked to new user
    const vendor = await Vendor.create({
      user: newUser._id,  // ✅ Link to new user account
      shopName,
      email,
      phone,
      address: { street, city, state, pincode, country },
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      defaultTimings: defaultTimings ? JSON.parse(defaultTimings) : { openingTime: '09:00 AM', closingTime: '06:00 PM' },
      shopImage: `/uploads/shops/${req.file.filename}`,
      status: 'pending',
      isApproved: false
    });

    // Generate token for new vendor
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Also create a ServiceCenter entry so users can find and order from this vendor
    const shop = await Shop.create({
      vendor: vendor._id,
      center_name: shopName, // ✅ Updated field
      email,
      phone_number: phone, // ✅ Updated field
      address: street, // ✅ Updated field (simplified)
      city, // ✅ Added field
      state, // ✅ Added field
      pincode, // ✅ Added field
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      opening_time: defaultTimings ? JSON.parse(defaultTimings).openingTime : '09:00 AM', // ✅ Updated field
      closing_time: defaultTimings ? JSON.parse(defaultTimings).closingTime : '06:00 PM', // ✅ Updated field
      profile_image_url: `/uploads/shops/${req.file.filename}`, // ✅ Updated field
      is_active: false // ✅ Updated field (Start as inactive until admin approval)
    });

    // --- Generate Notification to Admin ---
    await createNotification({
      title: 'New Vendor Registration',
      message: `A new vendor has registered: ${shopName}. Pending verification.`,
      type: 'registration',
      recipientRole: 'admin',
      data: { vendorId: vendor._id }
    });

    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted for approval',
      token,  // ✅ Send token for auto-login
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      vendor,
      shop
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Get vendor profile
exports.getVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id })
      .populate('user', 'profileImage name email')
      .populate('services');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.json({
      success: true,
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Update vendor profile
exports.updateVendorProfile = async (req, res, next) => {
  try {
    let vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const {
      shopName, email, phone,
      street, city, state, pincode, country,
      latitude, longitude,
      defaultTimings, workingDays
    } = req.body;

    // Update fields
    if (shopName) vendor.shopName = shopName;
    if (email) vendor.email = email;
    if (phone) vendor.phone = phone;

    // Update address if provided
    if (street || city || state || pincode || country) {
      vendor.address = {
        street: street || vendor.address.street,
        city: city || vendor.address.city,
        state: state || vendor.address.state,
        pincode: pincode || vendor.address.pincode,
        country: country || vendor.address.country
      };
    }

    // Update location if provided
    if (latitude && longitude) {
      vendor.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Update timings if provided
    if (defaultTimings) {
      vendor.defaultTimings = JSON.parse(defaultTimings);
    }

    if (workingDays) {
      vendor.workingDays = JSON.parse(workingDays);
    }

    // Update shop image if uploaded
    if (req.file) {
      // Delete old image
      if (vendor.shopImage) {
        const oldImagePath = path.join(__dirname, '..', vendor.shopImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      vendor.shopImage = `/uploads/shops/${req.file.filename}`;
    }

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor profile updated',
      vendor
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Upload vendor documents
// Upload vendor documents
exports.uploadDocuments = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    console.log("req.files:", req.files); // Debug log

    // ✅ Fix: Check if files exist and handle correctly
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one document'
      });
    }

    // Initialize documents object if not exists
    if (!vendor.documents) vendor.documents = {};

    // ✅ Fix: Convert files object to array and iterate
    const fileFields = Object.keys(req.files);
    const documentIds = {};

    for (const fieldName of fileFields) {
      const fileArray = req.files[fieldName];

      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        const fileUrl = `/uploads/documents/${file.filename}`;

        // Create a Document entry so it can be used in cart
        const newDoc = await Document.create({
          user: req.user.id,
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          totalPages: 1, // Default for now
          status: 'uploaded'
        });

        documentIds[fieldName] = newDoc._id;

        // Delete old document file if exists
        if (vendor.documents[fieldName]) {
          const oldPath = path.join(__dirname, '..', vendor.documents[fieldName]);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        vendor.documents[fieldName] = fileUrl;
        console.log(`Uploaded ${fieldName}:`, fileUrl, "ID:", newDoc._id);
      }
    }

    await vendor.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: vendor.documents,
      documentIds // Returning IDs as requested
    });
  } catch (error) {
    console.error("Upload error:", error);
    next(error);
  }
};

// Update bank details
exports.updateBankDetails = async (req, res, next) => {
  try {
    const {
      accountHolderName, accountNumber,
      ifscCode, bankName, branch, upiId
    } = req.body;

    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    vendor.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branch,
      upiId
    };

    await vendor.save();

    res.json({
      success: true,
      message: 'Bank details updated',
      bankDetails: vendor.bankDetails
    });
  } catch (error) {
    next(error);
  }
};

// Complete vendor profile (for multi-step registration)
exports.completeVendorProfile = async (req, res, next) => {
  try {
    console.log("=== COMPLETE PROFILE REQUEST ===");
    console.log("User ID:", req.user?.id);
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const {
      ownerName, dob, whatsappNumber, emergencyNumber, bloodGroup, languages,
      shopName, street, city, state, pincode, country, latitude, longitude
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    let vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      // Create new vendor profile
      vendor = new Vendor({
        user: req.user.id,
        phone: user.phone,
        email: user.email,
        shopName: shopName || 'My Shop', // Interim name
        status: 'pending',
        isApproved: false
      });
    }

    // Update personal info
    if (ownerName) {
      vendor.ownerName = ownerName;
      // Also update User account name for consistency
      await User.findByIdAndUpdate(req.user.id, { name: ownerName });
    }
    if (dob) vendor.dob = dob;
    if (whatsappNumber) vendor.whatsappNumber = whatsappNumber;
    if (emergencyNumber) vendor.emergencyNumber = emergencyNumber;
    if (bloodGroup) vendor.bloodGroup = bloodGroup;

    if (languages) {
      vendor.languages = Array.isArray(languages) ? languages : JSON.parse(languages);
    }

    // Update shop info
    if (shopName) vendor.shopName = shopName;

    // Address
    if (street || city || state || pincode || country) {
      if (!vendor.address) vendor.address = {};

      if (street) vendor.address.street = street;
      if (city) vendor.address.city = city;
      if (state) vendor.address.state = state;
      if (pincode) vendor.address.pincode = pincode;
      if (country) vendor.address.country = country;
    }

    // Location
    if (latitude && longitude) {
      vendor.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    } else if (!vendor.location?.coordinates) {
      // Fallback for required field if not provided
      vendor.location = {
        type: 'Point',
        coordinates: [0, 0]
      };
    }

    // Handle files
    const documentIds = {};
    if (req.files) {
      if (req.files.profilePicture) {
        const file = req.files.profilePicture[0];
        const fileUrl = `/uploads/profilePictures/${file.filename}`;
        vendor.profilePicture = fileUrl;

        const doc = await Document.create({
          user: req.user.id,
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          totalPages: 1,
          status: 'uploaded'
        });
        documentIds.profilePicture = doc._id;
      }
      if (req.files.shopImage) {
        const file = req.files.shopImage[0];
        const fileUrl = `/uploads/shops/${file.filename}`;
        vendor.shopImage = fileUrl;

        const doc = await Document.create({
          user: req.user.id,
          fileName: file.filename,
          originalName: file.originalname,
          fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          totalPages: 1,
          status: 'uploaded'
        });
        documentIds.shopImage = doc._id;
      }

      // Handle documents
      const fileFields = ['gstCertificate', 'panCard', 'addressProof', 'aadharCard'];
      for (const field of fileFields) {
        if (req.files[field]) {
          const file = req.files[field][0];
          const fileUrl = `/uploads/documents/${file.filename}`;

          if (!vendor.documents) vendor.documents = {};
          vendor.documents[field] = fileUrl;

          const doc = await Document.create({
            user: req.user.id,
            fileName: file.filename,
            originalName: file.originalname,
            fileUrl,
            fileSize: file.size,
            fileType: file.mimetype,
            totalPages: 1,
            status: 'uploaded'
          });
          documentIds[field] = doc._id;
        }
      }
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully',
      vendor,
      documentIds // Including IDs here as well
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    next(error);
  }
};

// ============= ORDER MANAGEMENT =============

// Get vendor orders
exports.getVendorOrders = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const { status, fromDate, toDate, page = 1, limit = 20 } = req.query;

    // Find the shop ID directly from the vendor profile
    const filter = { 'center': vendor._id };

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('vehicle') 
      .populate('services', 'name price') 
      .populate('center', 'shopName ownerName phone email') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Calculate statistics (unified with getOrderStatistics logic)
    const allOrders = await Order.find({ 'center': vendor._id });
    const statistics = {
      totalOrders: allOrders.length,
      completedOrders: allOrders.filter(o => ['completed', 'delivered'].includes(o.status)).length,
      pendingOrders: allOrders.filter(o => ['pending', 'confirmed', 'on_the_way', 'received', 'inspected', 'in_service', 'quality_check', 'ready', 'out_for_delivery'].includes(o.status)).length,
      cancelledOrders: allOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: allOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      statistics
    });
  } catch (error) {
    next(error);
  }
};

// Get single order details
exports.getOrderById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      'center': vendor._id
    })
      .populate('user', 'name email phone')
      .populate('vehicle')
      .populate('services')
      .populate('center', 'shopName ownerName phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, estimatedCompletion } = req.body;
    
    const validStatuses = [
      'pending', 'confirmed', 'on_the_way', 'received', 'inspected', 
      'in_service', 'quality_check', 'ready', 'out_for_delivery', 'completed', 'delivered', 'cancelled'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      'center': vendor._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if status update is allowed
    if (order.status === 'completed' || order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}`
      });
    }

    order.status = status; // ✅ Updated
    if (estimatedCompletion) {
      order.estimatedCompletion = new Date(estimatedCompletion);
    }
    if (status === 'completed' || status === 'delivered') {
      order.completedAt = new Date();

      // Update vendor earnings with NaN checks
      vendor.totalOrders = (vendor.totalOrders || 0) + 1;
      vendor.totalEarnings = (vendor.totalEarnings || 0) + order.totalAmount * (1 - (vendor.commission || 0) / 100);
      await vendor.save();
    }
    await order.save();

    // --- Generate Notifications ---
    // 1. To User
    await createNotification({
      title: 'Order Status Updated',
      message: `Your order ${order.bookingRef} status has been updated to ${status}.`,
      type: 'status_update',
      recipientRole: 'user',
      recipientId: order.user,
      data: { bookingId: order._id, status }
    });

    // 2. To Admin
    await createNotification({
      title: 'Order Status Updated',
      message: `Order ${order.bookingRef} status updated to ${status} by vendor ${vendor.shopName}.`,
      type: 'status_update',
      recipientRole: 'admin',
      data: { bookingId: order._id, status }
    });

    // Re-fetch populated order to send back to frontend
    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('vehicle')
      .populate('services')
      .populate('center', 'shopName ownerName phone email');

    res.json({
      success: true,
      message: 'Order status updated',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Get order statistics
exports.getOrderStatistics = async (req, res, next) => {
  console.log(`[DEBUG] getOrderStatistics hit for user: ${req.user?.id}`);
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const { period = 'all', year } = req.query; // week, month, year, all, custom year

    let dateFilter = {};
    const now = new Date();
    const currentYear = year ? parseInt(year) : now.getFullYear();

    if (period === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      dateFilter = { $gte: monthAgo };
    } else if (period === 'year' && !year) {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      dateFilter = { $gte: yearAgo };
    }

    const query = { 'center': vendor._id };
    if (year) {
      const start = new Date(currentYear, 0, 1);
      const end = new Date(currentYear, 11, 31, 23, 59, 59);
      query.createdAt = { $gte: start, $lte: end };
    } else if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const orders = await Order.find(query);

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length; 
    const pendingOrders = orders.filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status)).length; 
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length; 

    // Count Total Delivery Boys for this vendor
    const totalDeliveryBoys = await DeliveryBoy.countDocuments({ vendorId: req.user.id });

    // Aggregate Monthly Revenue for the Selected Year (12 Months)
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyAggregation = await Order.aggregate([
      { 
        $match: { 
          center: vendor._id, 
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          status: { $nin: ['pending', 'cancelled'] } 
        } 
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          total: { $sum: { $ifNull: ["$totalAmount", 0] } }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // Format into a 12-month array (Jan=0, Dec=11)
    const monthlyRevenue = Array(12).fill(0);
    monthlyAggregation.forEach(item => {
      monthlyRevenue[item._id.month - 1] = item.total;
    });

    // Group by date
    const ordersByDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { count: 0, revenue: 0 };
      }
      ordersByDate[date].count += 1;
      ordersByDate[date].revenue += order.totalAmount;
    });

    res.json({
      success: true,
      statistics: {
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalDeliveryBoys,
        monthlyRevenue, // Array of 12 values
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        commissionPaid: totalRevenue * (vendor.commission / 100),
        netEarnings: totalRevenue * (1 - vendor.commission / 100)
      },
      ordersByDate: Object.entries(ordersByDate).map(([date, data]) => ({
        date,
        ...data
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ============= SERVICE MANAGEMENT =============

// Add service
exports.addService = async (req, res, next) => {
  try {
    const { serviceType, price, description } = req.body;

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Check if image uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Service image is required'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Create service
    const service = await Service.create({
      shopName: vendor.shopName,
      shop: shop._id,
      category: req.body.category,
      serviceImage: `/uploads/services/${req.file.filename}`,
      serviceType,
      price: Number(price),
      description,
      activeStatus: true
    });

    // Add service to vendor's services array
    vendor.services.push(service._id);
    await vendor.save();

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      service
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Get vendor services
exports.getVendorServices = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.json({
        success: true,
        count: 0,
        services: []
      });
    }

    const services = await Service.find({ shop: shop._id });

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
};

// Update service
exports.updateService = async (req, res, next) => {
  try {
    const { serviceType, price, description, activeStatus } = req.body;

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find the shop associated with this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found for this vendor'
      });
    }

    let service = await Service.findOne({
      _id: req.params.serviceId,
      shop: shop._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Update fields
    if (serviceType) service.serviceType = serviceType;
    if (price) service.price = price;
    if (description) service.description = description;
    if (activeStatus !== undefined) service.activeStatus = activeStatus;

    // Update image if uploaded
    if (req.file) {
      // Delete old image
      if (service.serviceImage) {
        const oldImagePath = path.join(__dirname, '..', service.serviceImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      service.serviceImage = `/uploads/services/${req.file.filename}`;
    }

    await service.save();

    res.json({
      success: true,
      message: 'Service updated',
      service
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Delete service
exports.deleteService = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find the shop associated with this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found for this vendor'
      });
    }

    const service = await Service.findOne({
      _id: req.params.serviceId,
      shop: shop._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Delete service image
    if (service.serviceImage) {
      const imagePath = path.join(__dirname, '..', service.serviceImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove from vendor's services array
    vendor.services = vendor.services.filter(
      s => s.toString() !== req.params.serviceId
    );
    await vendor.save();

    // Delete service
    await Service.findByIdAndDelete(req.params.serviceId);

    res.json({
      success: true,
      message: 'Service deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle service status
exports.toggleServiceStatus = async (req, res, next) => {
  console.log(`[CONTROLLER-DEBUG] toggleServiceStatus starting for ID: ${req.params.serviceId}`);
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find the shop associated with this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found for this vendor'
      });
    }

    const service = await Service.findOne({
      _id: req.params.serviceId,
      shop: shop._id
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.activeStatus = !service.activeStatus;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.activeStatus ? 'activated' : 'deactivated'}`,
      service
    });
  } catch (error) {
    next(error);
  }
};

// ============= REVIEWS & RATINGS =============

// Get vendor reviews
exports.getVendorReviews = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find the shop associated with this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.json({
        success: true,
        reviews: [],
        total: 0,
        page: parseInt(page),
        pages: 0,
        stats: { averageRating: 0, totalReviews: 0 }
      });
    }

    const reviews = await Review.find({ shop: shop._id })
      .populate('user', 'name')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ shop: shop._id });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { shop: shop._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    res.json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats: ratingStats[0] || { averageRating: 0, totalReviews: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Reply to review
exports.replyToReview = async (req, res, next) => {
  try {
    const { reply } = req.body;

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find the shop associated with this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found for this vendor'
      });
    }

    const review = await Review.findOne({
      _id: req.params.reviewId,
      shop: shop._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.vendorReply = {
      text: reply,
      repliedAt: new Date()
    };
    await review.save();

    res.json({
      success: true,
      message: 'Reply added',
      review
    });
  } catch (error) {
    next(error);
  }
};

// ============= DASHBOARD & REPORTS =============

// Get dashboard data
exports.getDashboardData = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.json({
        success: true,
        dashboard: {
          overview: {
            totalOrders: 0,
            completedOrders: 0,
            totalEarnings: 0,
            rating: vendor.rating || 0,
            totalReviews: vendor.totalReviews || 0,
            pendingOrders: 0,
            todayOrders: 0,
            todayEarnings: 0
          },
          recentOrders: [],
          popularServices: [],
          monthlyEarnings: [],
          vendor
        }
      });
    }

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.find({
      'center': vendor._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get total orders
    const totalOrders = await Order.countDocuments({ 'center': vendor._id });

    // Get total earnings (from confirmed and beyond)
    const totalEarningsResult = await Order.aggregate([
      {
        $match: {
          'center': vendor._id,
          status: { $nin: ['pending', 'cancelled'] }
        }
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } } } }
    ]);
    const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    // Get pending orders
    const pendingOrdersCount = await Order.countDocuments({
      'center': vendor._id,
      status: { $in: ['pending', 'confirmed', 'on_the_way', 'received', 'inspected', 'in_service', 'quality_check', 'ready', 'out_for_delivery'] }
    });

    // Get completed orders
    const completedOrdersCount = await Order.countDocuments({
      'center': vendor._id,
      status: { $in: ['completed', 'delivered'] }
    });

    // Get cancelled orders
    const cancelledOrdersCount = await Order.countDocuments({
      'center': vendor._id,
      status: 'cancelled'
    });

    // Get recent orders
    const recentOrders = await Order.find({ 'center': vendor._id })
      .populate('user', 'name')
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get popular services (Aggregated from the serviceNames snapshot array)
    const popularServices = await Order.aggregate([
      { $match: { center: vendor._id } },
      { $unwind: '$serviceNames' },
      {
        $group: {
          _id: '$serviceNames',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get monthly earnings
    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          'center': vendor._id,
          status: { $nin: ['pending', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: { $sum: { $ifNull: ["$totalAmount", 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    // Get delivery boy count
    const totalDeliveryBoys = await DeliveryBoy.countDocuments({ vendorId: req.user.id });

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalOrders: totalOrders,
          completedOrders: completedOrdersCount,
          pendingOrders: pendingOrdersCount,
          cancelledOrders: cancelledOrdersCount,
          totalEarnings: totalEarnings,
          totalDeliveryBoys: totalDeliveryBoys,
          rating: vendor.rating || 0,
          totalReviews: vendor.totalReviews || 0,
          todayOrders: todayOrders.length,
          todayEarnings: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
        },
        recentOrders,
        popularServices,
        monthlyEarnings,
        vendor
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate earnings report
exports.getEarningsReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const filter = { 'center': vendor._id };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const orders = await Order.find(filter).sort({ createdAt: 1 });

    const report = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      commissionPaid: orders.reduce((sum, o) => sum + (o.totalAmount * vendor.commission / 100), 0),
      netEarnings: orders.reduce((sum, o) => sum + (o.totalAmount * (1 - vendor.commission / 100)), 0),
      ordersByStatus: {},
      dailyBreakdown: []
    };

    // Group by status
    orders.forEach(order => {
      report.ordersByStatus[order.status] = (report.ordersByStatus[order.status] || 0) + 1;
    });

    // Daily breakdown
    const dailyMap = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { orders: 0, revenue: 0, netEarnings: 0 };
      }
      dailyMap[date].orders += 1;
      dailyMap[date].revenue += order.totalAmount;
      dailyMap[date].netEarnings += order.totalAmount * (1 - vendor.commission / 100);
    });

    report.dailyBreakdown = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data
    }));

    res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

// Export orders
exports.exportOrders = async (req, res, next) => {
  try {
    const { fromDate, toDate, status } = req.query;

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const filter = { 'center': vendor._id };

    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Create CSV data
    const csvData = [];
    csvData.push([
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Order Date',
      'Items',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Delivery Address',
      'Estimated Completion'
    ]);

    orders.forEach(order => {
      csvData.push([
        order.orderNumber,
        order.user?.name || 'N/A',
        order.user?.email || 'N/A',
        order.user?.phone || 'N/A',
        new Date(order.createdAt).toLocaleString(),
        order.items.length,
        order.totalAmount,
        order.paymentMethod,
        order.paymentStatus,
        order.status,
        `${order.deliveryAddress?.doorNo || ''}, ${order.deliveryAddress?.areaStreet || ''}`,
        order.estimatedCompletion ? new Date(order.estimatedCompletion).toLocaleString() : 'N/A'
      ]);
    });

    const csvString = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csvString);
  } catch (error) {
    next(error);
  }
};

// Update order live location (for real-time tracking)
exports.updateOrderLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Find shop
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Update order with current location
    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId,
        'center': vendor._id,
        status: { $in: ['confirmed', 'on_the_way', 'received', 'inspected', 'in_service', 'quality_check', 'ready', 'out_for_delivery'] } 
      },
      {
        $set: {
          currentVendorLocation: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not in a trackable status'
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      currentLocation: order.currentVendorLocation
    });
  } catch (error) {
    next(error);
  }
};

// ============= DELIVERY BOY MANAGEMENT =============

exports.createDeliveryBoy = async (req, res, next) => {
  console.log("=== [DEBUG] createDeliveryBoy START ===");
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      console.log("[DEBUG] Vendor not found for user:", req.user.id);
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { name, email, phone, password, address, aadharNo } = req.body;
    console.log("[DEBUG] Form Data Received:", { name, email, phone, address, aadharNo, hasPassword: !!password });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("[DEBUG] User already exists with email:", email);
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    console.log("[DEBUG] Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Create User account for login
    console.log("[DEBUG] Creating User record...");
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'delivery boy',
      phone
    });
    console.log("[DEBUG] User record created! ID:", newUser._id);

    // 2. Create the DeliveryBoy profile linked to the User
    console.log("[DEBUG] Creating DeliveryBoy profile...");
    const deliveryBoy = await DeliveryBoy.create({
      name,
      email,
      phone,
      address,
      aadharNo,
      userId: newUser._id,
      vendorId: req.user.id,
      vendorName: vendor.shopName
    });
    console.log("[DEBUG] DeliveryBoy profile created! ID:", deliveryBoy._id);

    res.status(201).json({
      success: true,
      message: 'Delivery boy and user account created successfully',
      deliveryBoy,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("=== [ERROR] createDeliveryBoy ===");
    console.error(error);
    next(error);
  }
};

exports.getDeliveryBoys = async (req, res, next) => {
  try {
    const deliveryBoys = await DeliveryBoy.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      deliveryBoys
    });
  } catch (error) {
    next(error);
  }
};

