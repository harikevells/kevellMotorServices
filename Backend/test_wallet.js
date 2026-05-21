const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const { creditWalletIfEligible } = require('./controllers/bookingController');
require('dotenv').config();

const testWallet = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/EVService');
    
    // Find latest pending booking
    const latestBooking = await Booking.findOne({ bookingRef: 'EV2026228090' });
    if (!latestBooking) {
      console.log('Booking not found');
      return;
    }

    console.log('Simulating payment completion for:', latestBooking.bookingRef);
    latestBooking.paymentStatus = 'completed';
    await latestBooking.save();

    // Trigger wallet function
    await creditWalletIfEligible(latestBooking._id);

    console.log('✅ Wallet crediting function executed!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};
testWallet();
