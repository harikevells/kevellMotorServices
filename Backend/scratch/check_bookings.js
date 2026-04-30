const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');

dotenv.config();

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const total = await Booking.countDocuments({});
        console.log(`Total bookings: ${total}`);

        const invalid = await Booking.find({
            $or: [
                { serviceNames: { $exists: false } },
                { serviceNames: null },
                { serviceNames: { $not: { $type: "array" } } }
            ]
        });

        console.log(`Found ${invalid.length} invalid bookings (missing/null/non-array serviceNames)`);
        if (invalid.length > 0) {
            console.log('Sample invalid ID:', invalid[0]._id);
            console.log('serviceNames value:', invalid[0].serviceNames);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkBookings();
