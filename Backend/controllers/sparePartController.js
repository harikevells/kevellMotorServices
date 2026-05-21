const SparePart = require('../models/SparePart');
const fs = require('fs');
const path = require('path');

// @desc    Get all spare parts
// @route   GET /api/spare-parts
exports.getAllSpareParts = async (req, res, next) => {
  try {
    const spareParts = await SparePart.find()
      .populate('reviews.user', 'name email profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: spareParts.length,
      data: spareParts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single spare part
// @route   GET /api/spare-parts/:id
exports.getSparePart = async (req, res, next) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new spare part
// @route   POST /api/spare-parts
exports.createSparePart = async (req, res, next) => {
  try {
    const sparePartData = { ...req.body };
    
    if (req.file) {
      sparePartData.image = `/uploads/spareparts/${req.file.filename}`;
    }

    // Convert string boolean/numbers if coming from FormData
    if (sparePartData.amount) sparePartData.amount = Number(sparePartData.amount);
    if (sparePartData.stockQty) sparePartData.stockQty = Number(sparePartData.stockQty);
    if (sparePartData.isListed) sparePartData.isListed = sparePartData.isListed === 'true' || sparePartData.isListed === true;

    const sparePart = await SparePart.create(sparePartData);

    res.status(201).json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update spare part
// @route   PUT /api/spare-parts/:id
exports.updateSparePart = async (req, res, next) => {
  try {
    let sparePart = await SparePart.findById(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old image if exists
      if (sparePart.image) {
        const oldImagePath = path.join(__dirname, '..', sparePart.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/spareparts/${req.file.filename}`;
    }

    // Convert string boolean/numbers if coming from FormData
    if (updateData.amount) updateData.amount = Number(updateData.amount);
    if (updateData.stockQty) updateData.stockQty = Number(updateData.stockQty);
    if (updateData.isListed !== undefined) updateData.isListed = updateData.isListed === 'true' || updateData.isListed === true;

    sparePart = await SparePart.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete spare part
// @route   DELETE /api/spare-parts/:id
exports.deleteSparePart = async (req, res, next) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    // Delete image file if exists
    if (sparePart.image) {
      const imagePath = path.join(__dirname, '..', sparePart.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await sparePart.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to spare part
// @route   POST /api/spare-parts/:id/reviews
exports.addSparePartReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please log in again.'
      });
    }

    const sparePart = await SparePart.findById(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    // Add new review (Allowing multiple as requested)
    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };
    
    sparePart.reviews.push(review);

    // Calculate average rating
    sparePart.averageRating = 
      sparePart.reviews.reduce((acc, item) => item.rating + acc, 0) / sparePart.reviews.length;

    await sparePart.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to a review
// @route   POST /api/spare-parts/:partId/reviews/:reviewId/respond
exports.respondToReview = async (req, res, next) => {
  try {
    const { message } = req.body;
    const sparePart = await SparePart.findById(req.params.partId);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Spare part not found'
      });
    }

    const review = sparePart.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    review.vendorReply = message;
    review.repliedAt = Date.now();

    await sparePart.save();

    res.status(200).json({
      success: true,
      message: 'Response sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
