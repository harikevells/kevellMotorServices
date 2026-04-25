const User = require('../models/User');
const Vendor = require('../models/vendor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Helper to send SMS via Fast2SMS
const sendSMS = async (phone, otp) => {
  console.log(`[REAL-SMS-PROCESS] Initiating SMS for ${phone}...`);
  const isDevMode = String(process.env.DEV_MODE).trim() === 'true';

  if (isDevMode) {
    console.log('\n' + '═'.repeat(40));
    console.log(' 🚀 DEV MODE: SMS Suppressed');
    console.log(` 📱 PHONE: ${phone}`);
    console.log(` 🔑 OTP CODE: ${otp}`);
    console.log('═'.repeat(40) + '\n');
    return { success: true, message: 'Dev Mode: OTP logged to terminal' };
  }

  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey || apiKey === 'your_fast2sms_api_key_here') {
      console.log(`[REAL-SMS-PROCESS] ⚠️ No valid API Key found in .env. Logging OTP locally: ${otp}`);
      return;
    }

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: `Your Printerse OTP is: ${otp}`,
      language: 'english',
      numbers: phone,
    }, {
      headers: {
        'authorization': apiKey
      }
    });

    console.log(`[REAL-SMS-PROCESS] ✅ Fast2SMS Response for ${phone}:`, response.data.message);
    return response.data;
  } catch (error) {
    console.error(`[REAL-SMS-PROCESS] ❌ Error sending SMS to ${phone}:`, error.response?.data || error.message);
  }
};


exports.register = async (req, res, next) => {
  try {
    const {
      name, email, password, role, phone, gender,
      street, city, state, pincode, country,
      shopName, ownerName, location,
      licenseNo, gstNo, capacity
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine final role - avoid defaulting to 'user' if 'vendor' is passed
    let userRole = role; 
    
    console.log(`[REGISTER] Incoming Role: ${role}, email: ${email}`);

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      userRole = 'admin';
      console.log(`[REGISTER] First user detected. Setting role to admin.`);
    } else if (!userRole || (userRole !== 'vendor' && userRole !== 'user')) {
      userRole = 'user';
    }

    // If explicitly setting admin
    if (role === 'admin' && req.body.secretKey === process.env.ADMIN_SECRET) {
      userRole = 'admin';
    }
    
    console.log(`[REGISTER] Final Assigned Role: ${userRole}`);

    // Create user with address
    const userData = {
      name: userRole === 'vendor' ? (ownerName || name) : name,
      email,
      password: hashedPassword,
      role: userRole,
      phone,
      gender: gender || 'Other'
    };

    // Add address if provided
    if (street || city || state || pincode || country || location) {
      userData.address = {
        street: street || location || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        country: country || 'India'
      };
      // Set as default address
      userData.defaultAddress = userData.address;
    }

    const user = await User.create(userData);

    // If role is vendor, create Vendor profile
    if (userRole === 'vendor') {
      await Vendor.create({
        user: user._id,
        shopName: shopName || 'New Shop',
        ownerName: ownerName || name,
        licenseNo: licenseNo || '',
        gstNo: gstNo || '',
        capacity: capacity || 0,
        email: email,
        phone: phone,
        address: {
          street: street || location || 'Address not provided',
          city: city || 'City',
          state: state || 'State',
          pincode: pincode || '123456',
          country: country || 'India'
        },
        location: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates
        }
      });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        profileImage: user.profileImage,
        defaultAddress: user.defaultAddress
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`[LOGIN] Attempting login: email=${email}, expectedRole=${role}, userRole=${user.role}`);

    // Role check - MANDATORY
    if (user.role !== role) {
      console.log(`[LOGIN] Role mismatch: expected ${role} but user is ${user.role}`);
      return res.status(401).json({
        success: false,
        message: `Account is not registered as a ${role}`
      });
    }

    // Verification check for Vendors
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: user._id });
      if (vendor && !vendor.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Your account is not verified. Please contact admin for access.'
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        profileImage: user.profileImage,
        defaultAddress: user.defaultAddress
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.getProfile = async (req, res, next) => {
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

// Update user address
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
      street: street || user.address?.street,
      city: city || user.address?.city,
      state: state || user.address?.state,
      pincode: pincode || user.address?.pincode,
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

// Get user addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('address defaultAddress');

    res.json({
      success: true,
      address: user.address,
      defaultAddress: user.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to phone
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a phone number'
      });
    }

    // Find user by phone
    let user = await User.findOne({ phone });

    // If user doesn't exist, we'll create a new user with 'vendor' role
    if (!user) {
      user = await User.create({
        name: `Vendor_${phone.slice(-4)}`,
        email: `${phone}@printerse.com`,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        phone,
        role: 'vendor'
      });
    }

    // Generate OTP
    let otp;
    if (phone === '9999999999') {
      otp = '123456'; // Bypass for test number
    } else {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send SMS (or log in dev mode)
    await sendSMS(phone, otp);

    const response = {
      success: true,
      message: 'OTP sent successfully'
    };

    // Return OTP in response only if in Dev Mode
    if (String(process.env.DEV_MODE).trim() === 'true') {
      response.devOtp = otp; // Mobile app can catch this and show Alert
    }

    console.log(`[SEND-OTP] Final response for ${phone}:`, JSON.stringify(response));
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    console.log(`[VERIFY-OTP] Attempting to verify: Phone=${phone}, OTP=${otp}`);

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and OTP'
      });
    }

    const user = await User.findOne({
      phone,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`[VERIFY-OTP] Verification failed for ${phone}. User found?`, !!(await User.findOne({phone})));
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    console.log(`[VERIFY-OTP] Success for ${phone}`);

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage, // Added missing field
        defaultAddress: user.defaultAddress
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, gender, address, profileImage } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Update address if provided
    if (address) {
      user.address = {
        street: address.street || user.address?.street || '',
        city: address.city || user.address?.city || '',
        state: address.state || user.address?.state || '',
        pincode: address.pincode || user.address?.pincode || '',
        country: address.country || user.address?.country || 'India'
      };
      // Also update default address if it was set
      user.defaultAddress = user.address;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        profileImage: user.profileImage,
        defaultAddress: user.defaultAddress
      }
    });
  } catch (error) {
    next(error);
  }
};
