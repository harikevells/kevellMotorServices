const SparePart = require('../models/SparePart');

// @desc    Get all spare parts
// @route   GET /api/spare-parts
exports.getAllSpareParts = async (req, res, next) => {
  try {
    const spareParts = await SparePart.find().sort({ createdAt: -1 });
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
    const sparePart = await SparePart.create(req.body);

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

    sparePart = await SparePart.findByIdAndUpdate(req.params.id, req.body, {
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

    await sparePart.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
