const mongoose = require('mongoose');
const User = require('./models/User');
const Vendor = require('./models/vendor');
const dotenv = require('dotenv');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printerse');
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('--- ALL USERS ---');
        for (const user of users) {
            console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            const vendor = await Vendor.findOne({ user: user._id });
            if (vendor) {
                console.log(`  -> Has Vendor: ${vendor._id}, ShopName: ${vendor.shopName}`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error listing users:', error);
    }
};

listUsers();
