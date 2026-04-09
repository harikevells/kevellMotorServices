const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');


exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, activeStatus } = req.body;


    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
     
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Check if image uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Category image is required'
      });
    }

    // Create image URL (relative path)
    const imageUrl = `/uploads/categories/${req.file.filename}`;

    // Create category
    const category = await Category.create({
      name,
      description,
      categoryImage: imageUrl,
      activeStatus: activeStatus === 'true' || activeStatus === true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    // Delete uploaded image if error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, activeStatus } = req.body;

    // Check if category exists
    let category = await Category.findById(req.params.id);
    if (!category) {
      // Delete uploaded image if category not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being updated, check if it's unique
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        // Delete uploaded image if name conflict
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || category.name,
      description: description || category.description,
      activeStatus: activeStatus !== undefined ? 
        (activeStatus === 'true' || activeStatus === true) : 
        category.activeStatus
    };

    // If new image uploaded
    if (req.file) {
      // Delete old image
      if (category.categoryImage) {
        const oldImagePath = path.join(__dirname, '..', category.categoryImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new image URL
      updateData.categoryImage = `/uploads/categories/${req.file.filename}`;
    }

    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    // Delete uploaded image if error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};


exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete category image from uploads folder
    if (category.categoryImage) {
      const imagePath = path.join(__dirname, '..', category.categoryImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


exports.getAllCategories = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === 'true') {
      filter.activeStatus = true;
    }

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};


exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};


exports.toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.activeStatus = !category.activeStatus;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.activeStatus ? 'activated' : 'deactivated'} successfully`,
      category
    });
  } catch (error) {
    next(error);
  }
};