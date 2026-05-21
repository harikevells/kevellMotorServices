const SubscriptionPlan = require('../models/SubscriptionPlan');

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
