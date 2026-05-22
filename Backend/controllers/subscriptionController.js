const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');

// @desc    Create a new subscription plan
// @route   POST /api/subscriptions
// @access  Admin
exports.createPlan = async (req, res) => {
  try {
    const { name, price, billingCycle, features, autoRenewal, expiryNotifications, accessLevel, isActive } = req.body;
    
    const plan = new SubscriptionPlan({
      name,
      price,
      billingCycle,
      features,
      autoRenewal,
      expiryNotifications,
      accessLevel,
      isActive
    });

    const createdPlan = await plan.save();
    res.status(201).json({
      success: true,
      data: createdPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to create plan',
      error: error.message
    });
  }
};

// @desc    Get all subscription plans
// @route   GET /api/subscriptions
// @access  Public / Admin
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({}).sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch plans',
      error: error.message
    });
  }
};

// @desc    Update a subscription plan
// @route   PUT /api/subscriptions/:id
// @access  Admin
exports.updatePlan = async (req, res) => {
  try {
    const { name, price, billingCycle, features, autoRenewal, expiryNotifications, accessLevel, isActive } = req.body;

    let plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.name = name || plan.name;
    plan.price = price !== undefined ? price : plan.price;
    plan.billingCycle = billingCycle || plan.billingCycle;
    plan.features = features || plan.features;
    plan.autoRenewal = autoRenewal !== undefined ? autoRenewal : plan.autoRenewal;
    plan.expiryNotifications = expiryNotifications !== undefined ? expiryNotifications : plan.expiryNotifications;
    plan.accessLevel = accessLevel || plan.accessLevel;
    plan.isActive = isActive !== undefined ? isActive : plan.isActive;

    const updatedPlan = await plan.save();
    
    res.status(200).json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to update plan',
      error: error.message
    });
  }
};

// @desc    Delete a subscription plan
// @route   DELETE /api/subscriptions/:id
// @access  Admin
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Plan removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to delete plan',
      error: error.message
    });
  }
};

// @desc    Get all purchased subscriptions
// @route   GET /api/subscriptions/purchased
// @access  Admin
exports.getPurchasedSubscriptions = async (req, res) => {
  try {
    const purchased = await UserSubscription.find({})
      .populate('user', 'name email phone shopName')
      .populate('plan', 'name price billingCycle')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      data: purchased
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch purchased subscriptions',
      error: error.message
    });
  }
};

// @desc    Purchase a subscription plan
// @route   POST /api/subscriptions/purchase
// @access  Private
exports.purchaseSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const role = req.user.role === 'vendor' ? 'Vendor' : 'User';

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if user already has an active, non-expired plan
    const existingActive = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });

    if (existingActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active plan. You can only purchase a new plan after the current one expires.' 
      });
    }

    // Calculate expiry based on billing cycle
    const expiryDate = new Date();
    if (plan.billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Default monthly
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const newSub = new UserSubscription({
      user: userId,
      userModel: role,
      plan: planId,
      purchaseDate: new Date(),
      expiryDate,
      status: 'active', // Simulating successful payment for now
      paymentStatus: 'completed',
      usageTrackers: { servicesUsed: 0, sparePartsUsed: 0 }
    });

    const savedSub = await newSub.save();
    
    res.status(200).json({
      success: true,
      data: savedSub
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to purchase plan',
      error: error.message
    });
  }
};

// @desc    Get user's active and past subscriptions
// @route   GET /api/subscriptions/my-subscriptions
// @access  Private
exports.getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscriptions = await UserSubscription.find({ user: userId })
      .populate('plan')
      .sort({ purchaseDate: -1 });

    const activeSubscription = subscriptions.find(sub => sub.status === 'active' && new Date(sub.expiryDate) > new Date());

    res.status(200).json({
      success: true,
      active: activeSubscription || null,
      history: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch user subscriptions',
      error: error.message
    });
  }
};
