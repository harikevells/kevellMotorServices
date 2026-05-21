// controllers/offerController.js
const Offer = require('../models/Offer');
const Shop = require('../models/ServiceCenter'); // ✅ Changed from 'Shop'

/**
 * Create a new offer
 */
exports.createOffer = async (req, res, next) => {  // Add 'next' parameter back
  try {
    const { 
      shopName, offerTitle, discount, category, startDate, endDate, activeStatus,
      discountType, couponCode, usageLimitPerUser, totalRedemptionLimit, 
      minimumBookingValue, applicableServices, planTier
    } = req.body;

    console.log('Creating offer with data:', req.body);
    console.log('User:', req.user);

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Find shop by name (optional)
    let shopId = null;
    const shop = await Shop.findOne({ center_name: { $regex: new RegExp(`^${shopName}$`, 'i') } }); // ✅ Updated field
    if (shop) {
      shopId = shop._id;
    }

    const offer = await Offer.create({
      shopName,
      offerTitle,
      discount: Number(discount),
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      activeStatus: activeStatus === true || activeStatus === 'true',
      createdBy: req.user.id,
      shopId,
      discountType: discountType || 'percentage',
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      usageLimitPerUser: Number(usageLimitPerUser) || 1,
      totalRedemptionLimit: totalRedemptionLimit ? Number(totalRedemptionLimit) : null,
      minimumBookingValue: Number(minimumBookingValue) || 0,
      applicableServices: applicableServices || [],
      planTier: planTier || 'Basic'
    });

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Create offer error:', error);
    // Pass error to the error handler middleware
    next(error);
  }
};

// Update all other controller functions to include 'next' parameter
exports.getAllOffers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      status,
      category,
      fromDate,
      toDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    // Search by shop name or offer title
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { offerTitle: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status === 'active') {
      filter.activeStatus = true;
    } else if (status === 'inactive') {
      filter.activeStatus = false;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by date range
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Get offers
    const offers = await Offer.find(filter)
      .populate('createdBy', 'name email')
      .populate('shopId', 'center_name email phone_number') // ✅ Updated field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Offer.countDocuments(filter);

    // Get unique categories for filter
    const categories = await Offer.distinct('category');

    res.json({
      success: true,
      offers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      categories,
      filters: {
        search,
        status,
        category,
        fromDate,
        toDate
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('shopId', 'center_name email phone_number'); // ✅ Updated field

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      offer
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOffer = async (req, res, next) => {
  try {
    const { 
      shopName, offerTitle, discount, category, startDate, endDate, activeStatus,
      discountType, couponCode, usageLimitPerUser, totalRedemptionLimit, 
      minimumBookingValue, applicableServices, planTier
    } = req.body;

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Validate dates if both are provided
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Update fields
    if (shopName) offer.shopName = shopName;
    if (offerTitle) offer.offerTitle = offerTitle;
    if (discount) offer.discount = Number(discount);
    if (category) offer.category = category;
    if (startDate) offer.startDate = new Date(startDate);
    if (endDate) offer.endDate = new Date(endDate);
    if (activeStatus !== undefined) {
      offer.activeStatus = activeStatus === true || activeStatus === 'true';
    }
    if (discountType) offer.discountType = discountType;
    if (couponCode !== undefined) offer.couponCode = couponCode ? couponCode.toUpperCase() : null;
    if (usageLimitPerUser !== undefined) offer.usageLimitPerUser = Number(usageLimitPerUser);
    if (totalRedemptionLimit !== undefined) offer.totalRedemptionLimit = totalRedemptionLimit ? Number(totalRedemptionLimit) : null;
    if (minimumBookingValue !== undefined) offer.minimumBookingValue = Number(minimumBookingValue);
    if (applicableServices !== undefined) offer.applicableServices = applicableServices;
    if (planTier) offer.planTier = planTier;

    // Update shopId if shop name changed
    if (shopName && shopName !== offer.shopName) {
      const shop = await Shop.findOne({ center_name: { $regex: new RegExp(`^${shopName}$`, 'i') } }); // ✅ Updated field
      offer.shopId = shop ? shop._id : null;
    }

    await offer.save();

    res.json({
      success: true,
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    await Offer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleOfferStatus = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.activeStatus = !offer.activeStatus;
    await offer.save();

    res.json({
      success: true,
      message: `Offer ${offer.activeStatus ? 'activated' : 'deactivated'} successfully`,
      offer
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Offer.distinct('category');
    
    // Also get from Category model if you have one
    const Category = require('../models/Category');
    const dbCategories = await Category.find({ activeStatus: true }).select('name');
    
    const allCategories = [...new Set([...categories, ...dbCategories.map(c => c.name)])];

    res.json({
      success: true,
      categories: allCategories
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveOffers = async (req, res, next) => {
  try {
    const now = new Date();
    
    const offers = await Offer.find({
      activeStatus: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ discount: -1, createdAt: -1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

exports.getOffersByShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    
    // ✅ Updated model
    const shop = await Shop.findById(shopId);
    
    const offers = await Offer.find({
      $or: [
        { shopId },
        { shopName: shop ? { $regex: new RegExp(`^${shop.center_name}$`, 'i') } : null } // ✅ Updated field
      ].filter(Boolean)
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

exports.getOfferAnalytics = async (req, res, next) => {
  try {
    const totalOffers = await Offer.countDocuments();
    
    const stats = await Offer.aggregate([
      {
        $group: {
          _id: null,
          totalRedeemed: { $sum: '$timesRedeemed' },
          totalRevenue: { $sum: '$revenueGenerated' }
        }
      }
    ]);

    const topOffers = await Offer.find()
      .sort({ timesRedeemed: -1 })
      .limit(5)
      .select('offerTitle couponCode timesRedeemed revenueGenerated');

    res.json({
      success: true,
      data: {
        totalOffers,
        totalRedeemed: stats.length > 0 ? stats[0].totalRedeemed : 0,
        totalRevenue: stats.length > 0 ? stats[0].totalRevenue : 0,
        topOffers
      }
    });
  } catch (error) {
    next(error);
  }
};