// scratch/test_complete_booking.js
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Vendor = require('../models/vendor');
const User = require('../models/User');
const { creditWalletIfEligible } = require('../controllers/bookingController');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔥 MongoDB Connected');

    // 1. Find a booking that is not completed
    const booking = await Booking.findOne({ status: { $ne: 'completed' } }).populate('center');
    if (!booking) {
      console.log('No eligible booking found for testing.');
      mongoose.connection.close();
      return;
    }

    console.log('\n--- BEFORE COMPLETION ---');
    console.log('Booking REF:', booking.bookingRef);
    console.log('Current Status:', booking.status);
    console.log('Current PaymentStatus:', booking.paymentStatus);
    console.log('Total Amount:', booking.totalAmount);
    
    const vendorRecord = booking.center;
    if (!vendorRecord) {
      console.log('Booking center/vendor record not found.');
      mongoose.connection.close();
      return;
    }
    
    // Get initial Vendor wallet balance
    let vendorWalletBefore = await Wallet.findOne({ user: vendorRecord.user });
    const balBeforeVendor = vendorWalletBefore ? vendorWalletBefore.balance : 0;
    console.log('Vendor Shop Name:', vendorRecord.shopName);
    console.log('Vendor Wallet Balance Before:', balBeforeVendor);

    // Get initial Admin wallet balance
    const adminUser = await User.findOne({ role: 'admin' });
    let adminWalletBefore = await Wallet.findOne({ user: adminUser._id });
    const balBeforeAdmin = adminWalletBefore ? adminWalletBefore.balance : 0;
    console.log('Admin Wallet Balance Before:', balBeforeAdmin);

    // 2. Set both status & paymentStatus to completed
    booking.status = 'completed';
    booking.paymentStatus = 'completed';
    await booking.save();
    console.log('\n✅ Set booking status and paymentStatus to "completed".');

    // 3. Trigger our wallet eligibility hook
    console.log('Running creditWalletIfEligible...');
    await creditWalletIfEligible(booking._id);

    // 4. Verify wallet balances increased
    let vendorWalletAfter = await Wallet.findOne({ user: vendorRecord.user });
    let adminWalletAfter = await Wallet.findOne({ user: adminUser._id });

    const balAfterVendor = vendorWalletAfter ? vendorWalletAfter.balance : 0;
    const balAfterAdmin = adminWalletAfter ? adminWalletAfter.balance : 0;

    const commissionPercent = vendorRecord.commission || 10;
    const expectedPlatformFee = booking.totalAmount * (commissionPercent / 100);
    const expectedVendorEarning = booking.totalAmount - expectedPlatformFee;

    console.log('\n--- AFTER COMPLETION RESULTS ---');
    console.log('Vendor Wallet Balance After:', balAfterVendor);
    console.log('Vendor Wallet Diff:', balAfterVendor - balBeforeVendor, `(Expected: ₹${expectedVendorEarning})`);
    console.log('Admin Wallet Balance After:', balAfterAdmin);
    console.log('Admin Wallet Diff:', balAfterAdmin - balBeforeAdmin, `(Expected: ₹${expectedPlatformFee})`);

    if (
      balAfterVendor - balBeforeVendor === expectedVendorEarning &&
      balAfterAdmin - balBeforeAdmin === expectedPlatformFee
    ) {
      console.log('\n🎉 SUCCESS: Wallet balances credited perfectly!');
    } else {
      console.log('\n❌ FAILURE: Mismatch in wallet balance changes.');
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Test script error:', err);
  }
}

test();
