const User = require('../models/User');

// Update own profile (both admin and user)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, gender, address, profileImage } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prepare strict update object for Mongoose
    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (phone) updatePayload.phone = phone;
    if (gender) updatePayload.gender = gender;
    if (profileImage !== undefined) updatePayload.profileImage = profileImage;
    
    if (address) {
      updatePayload.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        country: address.country || 'India'
      };
      updatePayload.defaultAddress = { ...updatePayload.address }; // Keep primary in sync
    }

    console.log(`[DATABASE-LIFECYCLE-DEBUG] 🔄 Atomic Update for ${user.email}`);
    
    // Using findByIdAndUpdate with { new: true } is the most robust way to ensure
    // nested objects are exactly as we want them in MongoDB.
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatePayload },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found during update' });
    }

    console.log(`[DATABASE-LIFECYCLE-DEBUG] ✅ UPDATE VERIFIED. New Street in DB: "${updatedUser.address.street}"`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        defaultAddress: updatedUser.defaultAddress
      }
    });
  } catch (error) {
    console.error('[DATABASE-LIFECYCLE-ERROR] ❌ Critical Failure:', error);
    next(error);
  }
};

// Update user avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    console.log(`[UPLOAD-AVATAR] Request from user: ${req.user?.id}`);
    
    if (!req.file) {
      console.log('[UPLOAD-AVATAR] ❌ No file received in req.file');
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    console.log(`[UPLOAD-AVATAR] ✅ File received: ${req.file.originalname} (${req.file.size} bytes)`);
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log(`[UPLOAD-AVATAR] ❌ User ${req.user.id} not found in database`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.profileImage = imageUrl;
    await user.save();
    console.log(`[UPLOAD-AVATAR] 💾 Database updated for user ${user.email} with ${imageUrl}`);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      profileImage: imageUrl
    });
  } catch (error) {
    console.error('[UPLOAD-AVATAR] ❌ Generic Error:', error);
    next(error);
  }
};

// Get own profile
exports.getOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Update user address
exports.updateAddress = async (req, res, next) => {
  try {
    const { street, city, state, pincode, country, setAsDefault } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update address
    const newAddress = {
      street: street || user.address?.street || '',
      city: city || user.address?.city || '',
      state: state || user.address?.state || '',
      pincode: pincode || user.address?.pincode || '',
      country: country || user.address?.country || 'India'
    };
    
    user.address = newAddress;
    
    // Set as default if requested
    if (setAsDefault) {
      user.defaultAddress = newAddress;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      address: user.address,
      defaultAddress: user.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get user addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('address defaultAddress');
    
    res.json({
      success: true,
      address: user.address || null,
      defaultAddress: user.defaultAddress || null
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (with pagination, search, role filter)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role; // Optional: filter by role (admin/user)
    
    const skip = (page - 1) * limit;
    
    // Build search query
    let searchQuery = {};
    
    // Add role filter if provided
    if (role) {
      searchQuery.role = role;
    }
    
    // Add search functionality
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.pincode': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get users
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get total count
    const total = await User.countDocuments(searchQuery);
    
    res.json({
      success: true,
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Get users by role (admin, user, or vendor)
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    // Validate role
    if (!['admin', 'user', 'vendor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin", "user" or "vendor"'
      });
    }
    
    const skip = (page - 1) * limit;
    
    // Build search query
    let searchQuery = { role };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.pincode': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get users
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get total count
    const total = await User.countDocuments(searchQuery);
    
    res.json({
      success: true,
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === 'admin') { // Only admin can change role
      user.role = role;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
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