const mongoose = require('mongoose');
const Order = require('./models/Order');
const Vendor = require('./models/vendor');
const Shop = require('./models/Shop');
const dotenv = require('dotenv');

dotenv.config();

const simulateDashboard = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printerse');
        
        const vendorId = '69bd3beb2181ef56d6eb6120';
        const vendor = await Vendor.findById(vendorId);
        const shop = await Shop.findOne({ vendor: vendorId });
        
        if (shop) {
            const totalOrders = await Order.countDocuments({ 'items.shop': shop._id });
            const pendingOrders = await Order.countDocuments({
                'items.shop': shop._id,
                orderStatus: { $in: ['pending', 'confirmed', 'processing'] }
            });

            console.log('--- SIMULATED DASHBOARD ---');
            console.log(`Shop: ${shop.shopName}`);
            console.log(`Total Orders: ${totalOrders}`);
            console.log(`Pending Orders: ${pendingOrders}`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error simulating dashboard:', error);
    }
};

simulateDashboard();
