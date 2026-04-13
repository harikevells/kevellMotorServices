const ServiceType = require('../models/ServiceType');
const fs = require('fs');
const path = require('path');

// @desc    Create new service
// @route   POST /api/services
exports.createService = async (req, res, next) => {
  try {
    const { serviceName, category, price, duration, description, status } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/services/${req.file.filename}`;
    }

    const service = await ServiceType.create({
      serviceName,
      category,
      price: Number(price),
      duration,
      description,
      image: imageUrl,
      status: status === 'Active' || status === 'true' || status === true
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// @desc    Get all services
// @route   GET /api/services
exports.getAllServices = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'All') {
      filter.status = status === 'Active';
    }

    if (search) {
      filter.serviceName = { $regex: search, $options: 'i' };
    }

    const services = await ServiceType.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
exports.getServiceCategories = async (req, res, next) => {
  try {
    const categories = await ServiceType.distinct('category', { status: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await ServiceType.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
exports.updateService = async (req, res, next) => {
  try {
    let service = await ServiceType.findById(req.params.id);
    if (!service) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const updateData = { ...req.body };
    
    // Handle status conversion
    if (updateData.status) {
        updateData.status = updateData.status === 'Active' || updateData.status === 'true' || updateData.status === true;
    }

    if (req.file) {
      // Remove old image if exists
      if (service.image) {
        const oldPath = path.join(__dirname, '..', service.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    service = await ServiceType.findByIdAndUpdate(req.params.id, updateData, { 
      new: true, 
      runValidators: true 
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
exports.deleteService = async (req, res, next) => {
  try {
    const service = await ServiceType.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.image) {
      const imagePath = path.join(__dirname, '..', service.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Service Status
// @route   PATCH /api/services/:id/toggle
exports.toggleServiceStatus = async (req, res, next) => {
    try {
        const service = await ServiceType.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        service.status = !service.status;
        await service.save();

        res.json({ success: true, message: `Service turned ${service.status ? 'Active' : 'Inactive'}`, data: service });
    } catch (error) {
        next(error);
    }
};