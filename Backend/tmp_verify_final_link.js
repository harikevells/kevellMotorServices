const mongoose = require('mongoose');
const Shop = require('./models/Shop');
const Vendor = require('./models/vendor');
const dotenv = require('dotenv');

dotenv.config();

const verifyFinalLink = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printerse');
        console.log('Connected to MongoDB');

        const vendorId = '69bd3beb2181ef56d6eb6120';
        const shop = await Shop.findOne({ vendor: vendorId });
        
        if (shop) {
            console.log(`FOUND LINKED SHOP: ${shop.shopName} (ID: ${shop._id})`);
            console.log(`VENDOR ID IN SHOP: ${shop.vendor}`);
        } else {
            console.log(`NO SHOP FOUND LINKED TO VENDOR ${vendorId}`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error verifying link:', error);
    }
};

verifyFinalLink();
