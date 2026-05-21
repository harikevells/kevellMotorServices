const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Wallet = require('./models/Wallet');
const WalletTransaction = require('./models/WalletTransaction');

require('dotenv').config();

const checkDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/EVService');
    console.log('--- LATEST BOOKINGS ---');
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(3);
    for (const b of bookings) {
      console.log(`Ref: ${b.bookingRef}, totalAmount: ${b.totalAmount}, status: ${b.status}, paymentStatus: ${b.paymentStatus}, method: ${b.paymentMethod}`);
    }

    console.log('\n--- WALLETS ---');
    const wallets = await Wallet.find().populate('user', 'name role email');
    for (const w of wallets) {
      console.log(`User: ${w.user?.name} (${w.user?.role}) | Balance: ₹${w.balance} | Pending: ₹${w.pendingBalance}`);
    }

    console.log('\n--- WALLET TRANSACTIONS ---');
    const txs = await WalletTransaction.find().sort({ createdAt: -1 }).limit(5);
    for (const t of txs) {
      console.log(`Type: ${t.type}, Amount: ₹${t.amount}, Status: ${t.status}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};
checkDb();
