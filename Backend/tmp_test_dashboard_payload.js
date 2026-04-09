const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('./models/vendor');
const Shop = require('./models/Shop');
const Order = require('./models/Order');
const User = require('./models/User');

dotenv.config();

async function checkDashboard() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const vendor = await Vendor.findOne({ shopName: 'Printerese' });
        const shop = await Shop.findOne({ vendor: vendor._id });

        if (!shop) {
             console.log("No shop found!");
             return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayOrders = await Order.find({
          'items.shop': shop._id,
          createdAt: { $gte: today, $lt: tomorrow }
        });

        const totalOrders = await Order.countDocuments({ 'items.shop': shop._id });

        const totalEarningsResult = await Order.aggregate([
          { 
            $match: { 
              'items.shop': shop._id,
              orderStatus: 'delivered'
            } 
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

        const pendingOrders = await Order.countDocuments({
          'items.shop': shop._id,
          orderStatus: 'pending'
        });

        const completedOrders = await Order.countDocuments({
          'items.shop': shop._id,
          orderStatus: 'delivered'
        });

        const recentOrders = await Order.find({ 'items.shop': shop._id })
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .limit(5);

        const payload = {
            success: true,
            dashboard: {
                overview: {
                  totalOrders: totalOrders,
                  completedOrders: completedOrders,
                  totalEarnings: totalEarnings,
                  rating: vendor.rating || 0,
                  totalReviews: vendor.totalReviews || 0,
                  pendingOrders,
                  todayOrders: todayOrders.length,
                  todayEarnings: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
                },
                recentOrders
            }
        };

        console.log(JSON.stringify(payload, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkDashboard();
