const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');

dotenv.config();

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const allBookings = await Booking.find({});
        console.log(`Total bookings: ${allBookings.length}`);

        for (const b of allBookings) {
            if (!Array.isArray(b.serviceNames)) {
                console.log(`❌ Booking ID: ${b._id} has invalid serviceNames:`, b.serviceNames);
            }
        }
        
        console.log('Check complete.');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkBookings();
