// scratch/diagnostic.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/vendor');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const RefundRequest = require('../models/RefundRequest');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motorservice');
    console.log('🔥 MongoDB Connected');

    const userCount = await User.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const walletCount = await Wallet.countDocuments();
    const txCount = await WalletTransaction.countDocuments();
    const refundCount = await RefundRequest.countDocuments();

    console.log('\n--- COLLECTION COUNTS ---');
    console.log('Users:', userCount);
    console.log('Vendors:', vendorCount);
    console.log('Bookings:', bookingCount);
    console.log('Wallets:', walletCount);
    console.log('Transactions:', txCount);
    console.log('Refund Requests:', refundCount);

    if (bookingCount > 0) {
      console.log('\n--- SAMPLE BOOKING ---');
      const sampleBooking = await Booking.findOne().populate('center');
      if (sampleBooking) {
        console.log('Ref:', sampleBooking.bookingRef);
        console.log('Status:', sampleBooking.status);
        console.log('PaymentStatus:', sampleBooking.paymentStatus);
        console.log('TotalAmount:', sampleBooking.totalAmount);
        console.log('Center:', sampleBooking.center ? {
          _id: sampleBooking.center._id,
          shopName: sampleBooking.center.shopName,
          user: sampleBooking.center.user
        } : 'None');
      }
    }

    if (walletCount > 0) {
      console.log('\n--- SAMPLE WALLET ---');
      const sampleWallet = await Wallet.findOne().populate('user', 'name email role');
      if (sampleWallet) {
        console.log('User:', sampleWallet.user);
        console.log('Balance:', sampleWallet.balance);
      }
    }

    if (txCount > 0) {
      console.log('\n--- SAMPLE TRANSACTIONS ---');
      const sampleTxs = await WalletTransaction.find().limit(3).populate('user', 'name email role');
      sampleTxs.forEach((tx, idx) => {
        console.log(`[${idx}] Type:`, tx.type, 'Amount:', tx.amount, 'Status:', tx.status, 'User:', tx.user?.email);
      });
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Diagnostic error:', err);
  }
}

run();
