const Vendor = require('../models/vendor');
const fs = require('fs');
const path = require('path');

exports.createCenter = async (req, res, next) => {
  try {
    const { name, email, phone, address, location, openingTime, closingTime, specializations, activeStatus } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Center image is required' });
    }

    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const parsedSpecs = typeof specializations === 'string' ? JSON.parse(specializations) : specializations;

    const imageUrl = `/uploads/shops/${req.file.filename}`;

    const center = await ServiceCenter.create({
      name,
      email,
      phone,
      address: parsedAddress,
      location: parsedLocation,
      openingTime,
      closingTime,
      specializations: parsedSpecs,
      image: imageUrl,
      activeStatus: activeStatus === 'true' || activeStatus === true
    });

    res.status(201).json({
      success: true,
      message: 'Service Center created successfully',
      data: center
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

exports.getAllCenters = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance = 50, search, specialization, vehicle_category, fuel_type } = req.query;
    const filter = {}; // Relaxing '{ status: "approved" }' for testing purposes

    let centers;
    if (latitude && longitude) {
      centers = await Vendor.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            distanceField: 'distance',
            maxDistance: parseInt(maxDistance) * 1000,
            spherical: true,
            query: filter
          }
        },
        { $sort: { distance: 1 } }
      ]);
    } else {
      centers = await Vendor.find(filter).sort({ rating: -1 });
    }

    // Map vendors to match frontend ServiceCenter interface properties
    const mappedCenters = centers.map(vendor => ({
      _id: vendor._id,
      center_name: vendor.shopName,
      address: vendor.address?.street ? `${vendor.address.street}, ${vendor.address.city}` : 'No address provided',
      city: vendor.address?.city || 'Unknown',
      rating: vendor.rating || 0,
      total_reviews: vendor.totalReviews || 0,
      distance: vendor.distance,
      profile_image_url: vendor.shopImage || vendor.profilePicture,
      specializations: [], // Vendor specifies services differently, skipping specializations array for now.
      location: vendor.location
    }));

    res.json({
      success: true,
      count: mappedCenters.length,
      data: mappedCenters
    });
  } catch (error) {
    next(error);
  }
};


exports.getCenterById = async (req, res, next) => {
  try {
    const center = await Vendor.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const mappedCenter = {
      _id: center._id,
      center_name: center.shopName,
      address: center.address?.street ? `${center.address.street}, ${center.address.city}` : 'No address provided',
      city: center.address?.city || 'Unknown',
      rating: center.rating || 0,
      total_reviews: center.totalReviews || 0,
      profile_image_url: center.shopImage || center.profilePicture,
      specializations: [],
      location: center.location
    };
    res.json({ success: true, data: mappedCenter });
  } catch (error) {
    next(error);
  }
};

exports.updateCenter = async (req, res, next) => {
  try {
    let center = await ServiceCenter.findById(req.params.id);
    if (!center) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Service Center not found' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      if (center.image) {
        const oldPath = path.join(__dirname, '..', center.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/shops/${req.file.filename}`;
    }

    center = await ServiceCenter.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({
      success: true,
      message: 'Service Center updated successfully',
      data: center
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

exports.deleteCenter = async (req, res, next) => {
  try {
    const center = await ServiceCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ success: false, message: 'Service Center not found' });
    }
    if (center.image) {
      const imagePath = path.join(__dirname, '..', center.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await center.deleteOne();
    res.json({ success: true, message: 'Service Center deleted successfully' });
  } catch (error) {
    next(error);
  }
};