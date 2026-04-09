const ServiceType = require('../models/ServiceType');
const ServiceCenter = require('../models/ServiceCenter');
const fs = require('fs');
const path = require('path');

exports.createService = async (req, res, next) => {
  try {
    const { name, center, category, durationMinutes, price, description, activeStatus } = req.body;

    const centerExists = await ServiceCenter.findById(center);
    if (!centerExists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Service Center not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Service image is required' });
    }

    const imageUrl = `/uploads/services/${req.file.filename}`;

    const service = await ServiceType.create({
      name,
      center,
      category,
      image: imageUrl,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      description,
      activeStatus: activeStatus === 'true' || activeStatus === true
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

exports.getAllServices = async (req, res, next) => {
  try {
    const { category, vehicle_category, fuel_type, search, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active === 'false') {
       // if active status filter is needed
    } else {
       filter.is_active = true;
    }
    
    if (vehicle_category) {
      filter.applicable_vehicle_cat = { $in: [vehicle_category, 'all'] };
    }
    
    if (fuel_type) {
      filter.applicable_fuel_types = { $in: [fuel_type, 'all'] };
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const services = await ServiceType.find(filter);

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceCategories = async (req, res, next) => {
  try {
    const categories = await ServiceType.distinct('category', { is_active: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};


exports.getServiceById = async (req, res, next) => {
  try {
    const service = await ServiceType.findById(req.params.id).populate('center', 'name address phone');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    let service = await ServiceType.findById(req.params.id);
    if (!service) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      if (service.image) {
        const oldPath = path.join(__dirname, '..', service.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    service = await ServiceType.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

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