const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Booking = require('./models/Booking');

async function checkBills() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const bookingsWithBills = await Booking.find({ bill: { $exists: true, $ne: null } });
        console.log(`Found ${bookingsWithBills.length} bookings with bills:`);
        bookingsWithBills.forEach(b => {
            console.log(`ID: ${b._id}, Ref: ${b.bookingRef}, Bill: "${b.bill}"`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBills();
