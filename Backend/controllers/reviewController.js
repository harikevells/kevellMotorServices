const Review = require('../models/Review');
const Order = require('../models/Booking');  // ✅ Changed from 'Order'
const Shop = require('../models/ServiceCenter'); // ✅ Changed from 'Shop'

// Get all reviews (admin only) - ✅ ADD THIS
// Get all reviews (admin only)
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    let filter = {};
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { 'comment': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log("Fetching all reviews with filter:", filter);

    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('shop', 'center_name address') // ✅ Updated field
      .populate('order', 'bookingRef') // ✅ Updated field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Review.countDocuments(filter);
    
    console.log(`Found ${reviews.length} reviews (total: ${total})`);
    
    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews
    });
    
  } catch (error) {
    console.error('Get all reviews error:', error);
    next(error);
  }
};

// Add a review
exports.addReview = async (req, res, next) => {
  try {
    const { shopId, orderId, rating, comment, images } = req.body;

    console.log("Adding review:", { shopId, orderId, rating, comment });
    console.log("User ID:", req.user.id);

    // Check if user has already reviewed this shop
    const existingReview = await Review.findOne({
      user: req.user.id,
      shop: shopId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this shop'
      });
    }

    // If orderId provided, check if order exists and belongs to user
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
    }

    // Check if shop exists in Shop model
    const shop = await Shop.findById(shopId);
    console.log("Shop found:", shop ? "Yes" : "No");
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Create review
    const review = await Review.create({
      user: req.user.id,
      shop: shopId,
      order: orderId,
      rating,
      comment,
      images: images || []
    });

    // Update shop rating in Shop model
    const newTotalRating = (shop.rating * shop.total_reviews) + rating; // ✅ Updated field
    shop.total_reviews += 1; // ✅ Updated field
    shop.rating = newTotalRating / shop.total_reviews; // ✅ Updated field
    await shop.save();

    // Populate details
    await review.populate('user', 'name email');
    await review.populate('shop', 'center_name email phone'); // ✅ Updated field
    if (orderId) {
      await review.populate('order', 'bookingRef'); // ✅ Updated field
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });

  } catch (error) {
    console.error('Add review error:', error);
    next(error);
  }
};

// Get reviews for a shop
exports.getShopReviews = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if shop exists in Shop model
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Get reviews
    const reviews = await Review.find({ shop: shopId })
      .populate('user', 'name email')
      .populate('order', 'bookingRef') // ✅ Updated field
      .populate('shop', 'center_name') // ✅ Updated field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ shop: shopId });

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { shop: shopId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    res.json({
      success: true,
      shop: {
        id: shop._id,
        name: shop.center_name, // ✅ Updated field
        rating: shop.rating,
        totalReviews: shop.total_reviews // ✅ Updated field
      },
      statistics: ratingStats[0] || { averageRating: 0, totalReviews: 0 },
      distribution,
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Get shop reviews error:', error);
    next(error);
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: req.user.id })
      .populate('shop', 'center_name email phone') // ✅ Updated field
      .populate('order', 'bookingRef') // ✅ Updated field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    next(error);
  }
};

// Update review
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment, images } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Store old rating for shop update
    const oldRating = review.rating;

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.images = images || review.images;
    await review.save();

    // Update shop rating
    const shop = await Shop.findById(review.shop);
    if (shop) {
      // Recalculate shop rating
      const allReviews = await Review.find({ shop: shop._id });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      shop.rating = totalRating / allReviews.length;
      shop.total_reviews = allReviews.length; // ✅ Updated field
      await shop.save();
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });

  } catch (error) {
    console.error('Update review error:', error);
    next(error);
  }
};

// Delete review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const shopId = review.shop;
    await review.deleteOne();

    // Update shop rating
    const shop = await Shop.findById(shopId);
    if (shop && shop.total_reviews > 1) {
      const allReviews = await Review.find({ shop: shopId });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      shop.rating = totalRating / allReviews.length;
      shop.total_reviews = allReviews.length; // ✅ Updated field
      await shop.save();
    } else if (shop) {
      shop.rating = 0;
      shop.total_reviews = 0; // ✅ Updated field
      await shop.save();
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    next(error);
  }
};

// Vendor reply to review
exports.replyToReview = async (req, res, next) => {
  try {
    const { reply } = req.body;

    // Find vendor's shop
    const vendorShops = await Shop.find({ user: req.user.id });
    
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if the review belongs to this vendor's shop
    const shop = await Shop.findById(review.shop);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    review.vendorReply = {
      text: reply,
      repliedAt: new Date()
    };
    await review.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      review
    });

  } catch (error) {
    console.error('Reply to review error:', error);
    next(error);
  }
};