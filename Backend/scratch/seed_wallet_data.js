// scratch/seed_wallet_data.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Vendor = require('../models/vendor');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Booking = require('../models/Booking');
const RefundRequest = require('../models/RefundRequest');

async function seed() {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔥 Connected to MongoDB');

    // 1. Seed Admin Wallet
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      let adminWallet = await Wallet.findOne({ user: admin._id });
      if (!adminWallet) {
        adminWallet = new Wallet({
          user: admin._id,
          balance: 24500.50
        });
        await adminWallet.save();
        console.log('✅ Admin Wallet created with ₹24,500.50');
      }

      // Seed some transactions for Admin (e.g. platform fee earnings)
      const adminTransCount = await WalletTransaction.countDocuments({ wallet: adminWallet._id });
      if (adminTransCount === 0) {
        const trans = [
          new WalletTransaction({
            wallet: adminWallet._id,
            user: admin._id,
            type: 'platform_fee',
            amount: 450.00,
            status: 'completed',
            description: 'Platform fee for booking #BK-9801'
          }),
          new WalletTransaction({
            wallet: adminWallet._id,
            user: admin._id,
            type: 'platform_fee',
            amount: 600.00,
            status: 'completed',
            description: 'Platform fee for booking #BK-9752'
          }),
          new WalletTransaction({
            wallet: adminWallet._id,
            user: admin._id,
            type: 'add_funds',
            amount: 20000.00,
            status: 'completed',
            description: 'Initial balance funding'
          }),
          new WalletTransaction({
            wallet: adminWallet._id,
            user: admin._id,
            type: 'platform_fee',
            amount: 3450.50,
            status: 'completed',
            description: 'Bulk platform commissions settlement'
          })
        ];
        await WalletTransaction.insertMany(trans);
        console.log('✅ Seeded 4 admin transactions');
      }
    } else {
      console.log('⚠️ Admin user not found');
    }

    // 2. Seed Vendor Wallets
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors in DB`);

    for (const vendor of vendors) {
      let vendorWallet = await Wallet.findOne({ user: vendor.user });
      if (!vendorWallet) {
        vendorWallet = new Wallet({
          user: vendor.user,
          balance: 15800.00
        });
        await vendorWallet.save();
        console.log(`✅ Vendor Wallet created for shop "${vendor.shopName}" with ₹15,800.00`);
      }

      // Seed transactions for Vendor
      const vendorTransCount = await WalletTransaction.countDocuments({ wallet: vendorWallet._id });
      if (vendorTransCount === 0) {
        const trans = [
          new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendor.user,
            type: 'earning',
            amount: 4500.00,
            status: 'completed',
            description: 'Earnings for General Service booking #BK-9801'
          }),
          new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendor.user,
            type: 'earning',
            amount: 6000.00,
            status: 'completed',
            description: 'Earnings for Brake & Clutch repair booking #BK-9752'
          }),
          new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendor.user,
            type: 'payout',
            amount: 5000.00,
            status: 'completed',
            description: 'Bank transfer payout ref: TXN8937402'
          }),
          new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendor.user,
            type: 'add_funds',
            amount: 10300.00,
            status: 'completed',
            description: 'Promotional funds added for spare parts purchasing'
          }),
          new WalletTransaction({
            wallet: vendorWallet._id,
            user: vendor.user,
            type: 'payout',
            amount: 2500.00,
            status: 'pending',
            description: 'Withdrawal request to SBI bank A/C ending in 4920'
          })
        ];
        await WalletTransaction.insertMany(trans);
        console.log(`✅ Seeded 5 transactions for vendor "${vendor.shopName}"`);
      }

      // 3. Seed Refund Requests if there is a booking
      const refundCount = await RefundRequest.countDocuments({ vendor: vendor._id });
      if (refundCount === 0) {
        // Find a booking for this vendor
        const booking = await Booking.findOne({ center: vendor._id });
        if (booking) {
          const refund = new RefundRequest({
            booking: booking._id,
            user: booking.user,
            vendor: vendor._id,
            amount: booking.totalAmount * 0.5, // 50% refund request
            reason: 'Vehicle cleaning not done properly. Scratches on bumper.',
            status: 'pending',
            disputeNotes: 'Customer claims engine oil was not changed, but technician claims it was.'
          });
          await refund.save();
          console.log(`✅ Seeded 1 pending refund request for booking "${booking.bookingRef}"`);
        } else {
          console.log(`No bookings found for vendor "${vendor.shopName}", skipping refund seed`);
        }
      }
    }

    console.log('🌟 Seeding finished successfully');
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
