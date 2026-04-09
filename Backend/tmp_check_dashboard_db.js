const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('./models/vendor');
const Shop = require('./models/Shop');
const Order = require('./models/Order');

dotenv.config();

async function checkDashboardData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the first vendor for testing, or print all vendors
        const vendors = await Vendor.find({});
        console.log(`Found ${vendors.length} vendors.`);
        
        for (const vendor of vendors) {
            console.log(`\nChecking Vendor: ${vendor.shopName} (ID: ${vendor._id}, User: ${vendor.user})`);
            const shop = await Shop.findOne({ vendor: vendor._id });
            
            if (!shop) {
                console.log('--> ERROR: NO SHOP FOUND FOR THIS VENDOR!');
                continue;
            }
            
            console.log(`--> Found Shop: ${shop.shopName} (ID: ${shop._id})`);
            
            const totalOrders = await Order.countDocuments({ 'items.shop': shop._id });
            const pendingOrders = await Order.countDocuments({ 'items.shop': shop._id, orderStatus: 'pending' });
            const completedOrders = await Order.countDocuments({ 'items.shop': shop._id, orderStatus: 'delivered' });
            
            console.log(`--> Total Orders: ${totalOrders}`);
            console.log(`--> Pending Orders: ${pendingOrders}`);
            console.log(`--> Completed Orders: ${completedOrders}`);
            
            const recentOrders = await Order.find({ 'items.shop': shop._id }).limit(2);
            console.log(`--> Found ${recentOrders.length} recent orders.`);
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkDashboardData();
