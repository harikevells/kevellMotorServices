const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/EVService')
.then(async () => {
  const Booking = require('./models/Booking');
  
  // Find bookings with discount but no couponCode
  const bookings = await Booking.find({ discountAmount: { $gt: 0 }, couponCode: { $exists: false } });
  console.log(`Found ${bookings.length} bookings to check`);
  
  for (let b of bookings) {
    b.couponCode = 'OFFER-ISR3C4';
    await b.save();
    console.log(`Updated booking ${b.bookingRef} with couponCode OFFER-ISR3C4`);
  }
  
  // Also check if they were saved as null instead of not existing
  const bookingsNull = await Booking.find({ discountAmount: { $gt: 0 }, couponCode: null });
  console.log(`Found ${bookingsNull.length} bookings with null couponCode`);
  for (let b of bookingsNull) {
    b.couponCode = 'OFFER-ISR3C4';
    await b.save();
    console.log(`Updated booking ${b.bookingRef} with couponCode OFFER-ISR3C4`);
  }

  console.log('Done');
  process.exit(0);
})
.catch(console.error);
