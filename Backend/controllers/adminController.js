const User = require('../models/User');
const Booking = require('../models/Booking');
const Vendor = require('../models/vendor');

// Get all bookings (admin only)
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('center', 'shopName ownerName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// Create admin (super admin only)
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated',
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentsWithOrders = async (req, res, next) => {
  try {
    const { search, status, fromDate, toDate, shopId } = req.query;
    
    // Build filter for users (only students, not admins)
    const userFilter = { role: 'user' };
    
    // Search by name or email
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get all users/students
    const users = await User.find(userFilter).select('-password').sort({ createdAt: -1 });
    
    // Build order filter
    const orderFilter = {};
    
    // Date range filter
    if (fromDate || toDate) {
      orderFilter.createdAt = {};
      if (fromDate) orderFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) orderFilter.createdAt.$lte = new Date(toDate);
    }
    
    // Status filter
    if (status) {
      orderFilter.orderStatus = status;
    }
    
    // Shop filter
    if (shopId) {
      orderFilter['items.shop'] = shopId;
    }
    
    // Get all orders with populated data
    const orders = await Order.find(orderFilter)
      .populate('user', 'name email')
      .populate('items.shop', 'shopName phone address')
      .populate('items.service', 'shopName price serviceType')
      .populate('items.document', 'fileName totalPages')
      .sort({ createdAt: -1 });
    
    // Group orders by user
    const userOrdersMap = {};
    orders.forEach(order => {
      const userId = order.user._id.toString();
      if (!userOrdersMap[userId]) {
        userOrdersMap[userId] = [];
      }
      userOrdersMap[userId].push(order);
    });
    
    // Combine user data with their orders
    const studentsWithOrders = users.map(user => {
      const userOrders = userOrdersMap[user._id.toString()] || [];
      
      // Calculate total amount for this user
      const totalAmount = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Get unique shops this user ordered from
      const uniqueShops = [...new Set(
        userOrders.flatMap(order => 
          order.items.map(item => item.shop?.shopName)
        ).filter(Boolean)
      )];
      
      // Get latest order date
      const latestOrderDate = userOrders.length > 0 
        ? new Date(Math.max(...userOrders.map(o => new Date(o.createdAt))))
        : null;
      
      // Get order statuses
      const orderStatuses = [...new Set(userOrders.map(o => o.orderStatus))];
      
      return {
        student: {
          id: user._id,
          name: user.name,
          email: user.email,
          joinedDate: user.createdAt,
          totalOrders: userOrders.length,
          totalSpent: totalAmount,
          latestOrderDate,
          orderStatuses,
          shopsOrdered: uniqueShops
        },
        orders: userOrders.map(order => ({
          orderId: order._id,
          orderNumber: order.orderNumber,
          submittedDate: order.createdAt,
          items: order.items.map(item => ({
            shopName: item.shop?.shopName || 'N/A',
            serviceName: item.service?.shopName || 'N/A',
            documentName: item.document?.fileName || 'N/A',
            paperSize: item.paperSize,
            printType: item.printType,
            quantity: item.quantity,
            price: item.totalPrice,
            selectedPages: item.selectedPages
          })),
          deliveryAddress: order.deliveryAddress,
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryCharge: order.deliveryCharge,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          estimatedCompletion: order.estimatedCompletion,
          specialInstructions: order.specialInstructions
        }))
      };
    });
    
    // Filter students who have orders (optional)
    const withOrdersOnly = req.query.withOrders === 'true' 
      ? studentsWithOrders.filter(s => s.orders.length > 0)
      : studentsWithOrders;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedResults = withOrdersOnly.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      count: withOrdersOnly.length,
      totalPages: Math.ceil(withOrdersOnly.length / limit),
      currentPage: page,
      students: paginatedResults,
      summary: {
        totalStudents: users.length,
        studentsWithOrders: studentsWithOrders.filter(s => s.orders.length > 0).length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? (orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length).toFixed(2)
          : 0
      }
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Get user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get user's orders
    const orders = await Order.find({ user: userId })
      .populate('items.shop', 'shopName phone address')
      .populate('items.service', 'shopName price serviceType')
      .populate('items.document', 'fileName totalPages fileUrl')
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = orders.filter(o => o.orderStatus === 'delivered').length;
    const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.orderStatus)).length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;
    
    // Get unique shops
    const shopsOrdered = [...new Set(
      orders.flatMap(order => 
        order.items.map(item => item.shop?._id.toString())
      ).filter(Boolean)
    )];
    
    const shopDetails = await Shop.find({ _id: { $in: shopsOrdered } })
      .select('shopName address phone');
    
    res.json({
      success: true,
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedDate: user.createdAt,
        lastActive: user.updatedAt,
        statistics: {
          totalOrders: orders.length,
          totalSpent,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          averageOrderValue: orders.length > 0 ? (totalSpent / orders.length).toFixed(2) : 0
        },
        shopsOrdered: shopDetails
      },
      orders: orders.map(order => ({
        orderId: order._id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        items: order.items.map(item => ({
          shopName: item.shop?.shopName,
          service: item.service?.shopName,
          document: item.document?.fileName,
          paperSize: item.paperSize,
          quantity: item.quantity,
          price: item.totalPrice
        })),
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        estimatedCompletion: order.estimatedCompletion
      }))
    });
    
  } catch (error) {
    next(error);
  }
};


exports.exportStudentsData = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Build filter
    const orderFilter = {};
    if (fromDate || toDate) {
      orderFilter.createdAt = {};
      if (fromDate) orderFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) orderFilter.createdAt.$lte = new Date(toDate);
    }
    
    const orders = await Order.find(orderFilter)
      .populate('user', 'name email')
      .populate('items.shop', 'shopName')
      .sort({ createdAt: -1 });
    
    // Create CSV data
    const csvData = [];
    csvData.push([
      'Student Name',
      'Email',
      'Shop Name',
      'Order Number',
      'Order Date',
      'Items Count',
      'Total Amount',
      'Payment Method',
      'Order Status',
      'Delivery Address'
    ]);
    
    orders.forEach(order => {
      order.items.forEach(item => {
        csvData.push([
          order.user?.name || 'N/A',
          order.user?.email || 'N/A',
          item.shop?.shopName || 'N/A',
          order.orderNumber,
          new Date(order.createdAt).toLocaleString(),
          item.quantity,
          item.totalPrice,
          order.paymentMethod,
          order.orderStatus,
          `${order.deliveryAddress?.doorNo || ''}, ${order.deliveryAddress?.areaStreet || ''}`
        ]);
      });
    });
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students-data.csv');
    res.send(csvString);
    
  } catch (error) {
    next(error);
  }
};