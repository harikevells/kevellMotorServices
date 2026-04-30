const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('../models/vendor');

dotenv.config();

async function checkVendors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const vendors = await Vendor.find({});
        console.log(`Found ${vendors.length} vendors`);

        for (const v of vendors) {
            if (!v.address || !v.address.street) {
                console.log(`❌ Vendor ID: ${v._id}, Name: ${v.shopName} has MISSING STREET`);
                console.log('Address:', v.address);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkVendors();
