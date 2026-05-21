// controllers/adminVendorController.js
const Vendor = require('../models/vendor');
const User = require('../models/User');
const Booking = require('../models/Booking'); // ✅ Changed from 'Order'
const Shop = require('../models/ServiceCenter'); // ✅ Added
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationController');

// Get all vendors (admin only)
exports.getAllVendors = async (req, res, next) => {
  try {
    const {
      status,
      isVerified,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Verified filter
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    // Search filter
    if (search && search.trim() !== "") {

      const searchRegex = new RegExp(search, "i");

      // Find users matching name or phone
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { phone: { $regex: search } } // mobile search
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);

      filter.$or = [
        { shopName: searchRegex },
        { email: searchRegex },
        { phone: { $regex: search } }, // vendor phone search
        { user: { $in: userIds } },
        { 'address.pincode': { $regex: search } },
        { 'address.city': searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch vendors
    const vendors = await Vendor.find(filter)
      .populate('user', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Total count
    const total = await Vendor.countDocuments(filter);

    // Statistics
    const stats = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      vendors,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      statistics: stats
    });

  } catch (error) {
    next(error);
  }
};
// Get vendor by ID (admin only)
exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('user', 'name email')
      .populate('services');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
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

// Approve vendor (admin only)
exports.approveVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'approved';
    vendor.isApproved = true;
    vendor.approvedAt = new Date();
    vendor.approvedBy = req.user.id;
    await vendor.save();

    // Update user role to vendor
    await User.findByIdAndUpdate(vendor.user, { role: 'vendor' });

    // --- Generate Notification ---
    await createNotification({
      title: 'Vendor Approved',
      message: `Your vendor profile for ${vendor.shopName} has been approved. You can now access vendor features.`,
      type: 'registration',
      recipientRole: 'vendor',
      recipientId: vendor.user,
      data: { vendorId: vendor._id }
    });

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Reject vendor (admin only)
exports.rejectVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'rejected';
    vendor.rejectionReason = reason;
    vendor.isApproved = false;
    await vendor.save();

    // --- Generate Notification ---
    await createNotification({
      title: 'Vendor Profile Rejected',
      message: `Your vendor profile for ${vendor.shopName} has been rejected. Reason: ${reason}`,
      type: 'registration',
      recipientRole: 'vendor',
      recipientId: vendor.user,
      data: { vendorId: vendor._id, reason }
    });

    res.json({
      success: true,
      message: 'Vendor rejected',
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Suspend vendor (admin only)
exports.suspendVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'suspended';
    vendor.suspensionReason = reason;
    vendor.suspendedAt = new Date();
    vendor.suspendedBy = req.user.id;
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor suspended',
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Update vendor verification status (admin only)
exports.verifyVendor = async (req, res, next) => {
  try {
    const { isVerified } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.isVerified = isVerified;
    if (isVerified) {
      vendor.verifiedAt = new Date();
      vendor.verifiedBy = req.user.id;
    } else {
      vendor.verifiedAt = null;
      vendor.verifiedBy = null;
    }
    await vendor.save();

    res.json({
      success: true,
      message: `Vendor ${isVerified ? 'verified' : 'unverified'} successfully`,
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Update vendor details (admin only)
exports.updateVendor = async (req, res, next) => {
  try {
    console.log(`[ADMIN-VENDOR] Updating vendor ${req.params.id}:`, req.body);
    const { 
      shopName, ownerName, email, phone, password,
      status, isVerified, licenseNo, gstNo, capacity,
      address, city, street, state, pincode 
    } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update Vendor fields
    if (shopName) vendor.shopName = shopName;
    if (ownerName) vendor.ownerName = ownerName;
    if (email) vendor.email = email;
    if (phone) vendor.phone = phone;
    if (status) vendor.status = status;
    if (isVerified !== undefined) vendor.isVerified = isVerified;
    if (licenseNo !== undefined) vendor.licenseNo = licenseNo;
    if (gstNo !== undefined) vendor.gstNo = gstNo;
    if (capacity !== undefined) vendor.capacity = capacity;
    
    // Flexible address update
    if (!vendor.address) vendor.address = {};
    if (address) {
      vendor.address = { ...vendor.address, ...address };
    }
    if (city) vendor.address.city = city;
    if (street) vendor.address.street = street;
    if (state) vendor.address.state = state;
    if (pincode) vendor.address.pincode = pincode;

    await vendor.save();

    // Also update linked User if needed
    if (vendor.user && (ownerName || email || phone || password)) {
      try {
        const userId = vendor.user._id || vendor.user;
        console.log(`[ADMIN-VENDOR] Updating linked user ${userId}`);
        const userUpdateData = {};
        if (ownerName) userUpdateData.name = ownerName;
        if (email) userUpdateData.email = email;
        if (phone) userUpdateData.phone = phone;
        if (password) {
          userUpdateData.password = await bcrypt.hash(password, 10);
        }
        await User.findByIdAndUpdate(userId, userUpdateData);
      } catch (userError) {
        console.error(`[ADMIN-VENDOR] Failed to update linked user:`, userError);
        // We continue because the vendor itself was updated successfully
      }
    }

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Update vendor commission (admin only)
exports.updateCommission = async (req, res, next) => {
  try {
    const { commission } = req.body;

    if (commission < 0 || commission > 100) {
      return res.status(400).json({
        success: false,
        message: 'Commission must be between 0 and 100'
      });
    }

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.commission = commission;
    await vendor.save();

    res.json({
      success: true,
      message: 'Commission updated',
      vendor
    });
  } catch (error) {
    next(error);
  }
};

// Delete vendor (admin only)
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update user role back to user
    await User.findByIdAndUpdate(vendor.user, { role: 'user' });

    await Vendor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get pending vendors count (admin only)
exports.getPendingVendors = async (req, res, next) => {
  try {
    const count = await Vendor.countDocuments({ status: 'pending' });

    const pendingVendors = await Vendor.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count,
      vendors: pendingVendors
    });
  } catch (error) {
    next(error);
  }
};

// Get vendor earnings (admin only)
exports.getVendorEarnings = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const { fromDate, toDate } = req.query;
    
    // Find the ServiceCenter for this vendor
    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
       return res.json({
        success: true,
        earnings: { totalRevenue: 0, commissionPercentage: vendor.commission, commissionAmount: 0, netEarnings: 0, ordersCount: 0 }
      });
    }
    
    const filter = { 'center': shop._id }; // ✅ Updated from 'items.shop'
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    
    const orders = await Booking.find(filter);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commissionAmount = totalRevenue * (vendor.commission / 100);
    const netEarnings = totalRevenue - commissionAmount;

    res.json({
      success: true,
      earnings: {
        totalRevenue,
        commissionPercentage: vendor.commission,
        commissionAmount,
        netEarnings,
        ordersCount: orders.length
      }
    });
  } catch (error) {
    next(error);
  }
};