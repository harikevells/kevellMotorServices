// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const RefundRequest = require('../models/RefundRequest');
const Booking = require('../models/Booking');
const Vendor = require('../models/vendor');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');

console.log('✅ Wallet Routes Loaded');

// 1. Get Logged-in User's Wallet Balance and Stats
router.get('/my-balance', verifyToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      wallet = new Wallet({
        user: req.user.id,
        balance: 0
      });
      await wallet.save();
    }

    let vendor = null;
    if (req.user.role === 'vendor') {
      vendor = await Vendor.findOne({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      wallet,
      vendorId: vendor ? vendor._id : null
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching wallet balance' });
  }
});

// 2. Get Transaction Log for the User (Paginated)
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0 });
      await wallet.save();
    }

    let query = {};
    if (req.user.role === 'admin') {
      // Admin sees all transactions in the system
      query = {};
    } else {
      // Others see only their own transactions
      query = { wallet: wallet._id };
    }

    const total = await WalletTransaction.countDocuments(query);
    const transactions = await WalletTransaction.find(query)
      .populate({
        path: 'user',
        select: 'name email role'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
});

// 3. Add Funds (Simulated Secure Deposit)
router.post('/add-funds', verifyToken, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid deposit amount' });
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0 });
    }

    wallet.balance += parseFloat(amount);
    await wallet.save();

    const transaction = new WalletTransaction({
      wallet: wallet._id,
      user: req.user.id,
      type: 'add_funds',
      amount: parseFloat(amount),
      status: 'completed',
      description: description || 'Added funds to wallet'
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `Successfully added ₹${amount} to your wallet`,
      wallet
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ success: false, message: 'Server error adding funds' });
  }
});

// 4. Request a Payout / Withdrawal
router.post('/withdraw', verifyToken, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet || (wallet.pendingBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient pending earnings balance to request withdrawal' });
    }

    // Deduct the pending balance immediately to hold funds, status is pending
    wallet.pendingBalance = (wallet.pendingBalance || 0) - parseFloat(amount);
    await wallet.save();

    const detailsStr = bankDetails 
      ? `Bank: ${bankDetails.bankName || ''}, A/C: ${bankDetails.accountNumber || ''}, IFSC: ${bankDetails.ifscCode || ''}` 
      : 'Requested payout to bank account';

    const transaction = new WalletTransaction({
      wallet: wallet._id,
      user: req.user.id,
      type: 'payout',
      amount: parseFloat(amount),
      status: 'pending', // Payout is pending admin verification
      description: `Withdrawal request. Details: ${detailsStr}`
    });
    await transaction.save();

    // Notify Admin
    await createNotification({
      title: 'New Payout Request',
      message: `New payout request of ₹${amount} received.`,
      type: 'payment',
      recipientRole: 'admin',
      data: { transactionId: transaction._id }
    });

    res.status(200).json({
      success: true,
      message: `Withdrawal request of ₹${amount} submitted successfully. Funds are on hold pending approval.`,
      wallet
    });
  } catch (error) {
    console.error('Error initiating withdrawal:', error);
    res.status(500).json({ success: false, message: 'Server error processing withdrawal request' });
  }
});

// 5. Admin Payout Moderation (Complete or Reject Payout)
router.post('/payouts/:transactionId/action', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { action } = req.body; // 'complete' or 'reject'
    const transaction = await WalletTransaction.findById(req.transactionId || req.params.transactionId);
    
    if (!transaction || transaction.type !== 'payout') {
      return res.status(404).json({ success: false, message: 'Payout transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This payout transaction has already been processed' });
    }

    if (action === 'complete') {
      transaction.status = 'completed';
      await transaction.save();

      // 1. Credit Vendor's available balance
      let vendorWallet = await Wallet.findById(transaction.wallet);
      if (vendorWallet) {
        vendorWallet.balance = (vendorWallet.balance || 0) + transaction.amount;
        await vendorWallet.save();
      }

      // 2. Deduct from Admin's available balance
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        let adminWallet = await Wallet.findOne({ user: adminUser._id });
        if (adminWallet) {
          adminWallet.balance = (adminWallet.balance || 0) - transaction.amount;
          await adminWallet.save();

          // Log transaction for Admin
          const adminTx = new WalletTransaction({
            wallet: adminWallet._id,
            user: adminUser._id,
            type: 'payout',
            amount: transaction.amount,
            status: 'completed',
            description: `Settled vendor payout (Payout ID: ${transaction._id})`
          });
          await adminTx.save();
        }
      }

      // Notify Vendor
      await createNotification({
        title: 'Payout Approved',
        message: `Your payout request of ₹${transaction.amount} has been approved.`,
        type: 'payment',
        recipientRole: 'vendor',
        recipientId: transaction.user,
        data: { transactionId: transaction._id }
      });

      return res.status(200).json({ success: true, message: 'Payout marked as completed', transaction });
    } else if (action === 'reject') {
      transaction.status = 'rejected';
      await transaction.save();

      // Return the money to Vendor's pending balance
      let vendorWallet = await Wallet.findById(transaction.wallet);
      if (vendorWallet) {
        vendorWallet.pendingBalance = (vendorWallet.pendingBalance || 0) + transaction.amount;
        await vendorWallet.save();
      }

      // Notify Vendor
      await createNotification({
        title: 'Payout Rejected',
        message: `Your payout request of ₹${transaction.amount} was rejected. Funds returned to pending.`,
        type: 'payment',
        recipientRole: 'vendor',
        recipientId: transaction.user,
        data: { transactionId: transaction._id }
      });

      return res.status(200).json({ success: true, message: 'Payout rejected. Funds returned to pending balance.', transaction });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be complete or reject' });
    }
  } catch (error) {
    console.error('Error moderating payout:', error);
    res.status(500).json({ success: false, message: 'Server error processing payout moderation' });
  }
});

// 6. Admin Overview Panel
router.get('/admin/overview', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Get statistics
    const adminUser = await User.findOne({ role: 'admin' });

    // 1. Total platform fee collected
    const feeTrans = await WalletTransaction.find({ type: 'platform_fee', status: 'completed' });
    const totalFees = feeTrans.reduce((sum, t) => sum + t.amount, 0);

    // 2. Total payouts processed (Sum only admin's ledger entries to avoid double counting)
    let totalPayouts = 0;
    if (adminUser) {
      const payoutTrans = await WalletTransaction.find({ type: 'payout', status: 'completed', user: adminUser._id });
      totalPayouts = payoutTrans.reduce((sum, t) => sum + t.amount, 0);
    }

    // 3. Current active balances holding in wallets
    const allWallets = await Wallet.find({});
    const totalWalletHolding = allWallets.reduce((sum, w) => sum + w.balance + (w.pendingBalance || 0), 0);

    // 4. Pending refund count
    const pendingRefundCount = await RefundRequest.countDocuments({ status: 'pending' });

    // 5. Total Booking Revenue (Admin's actual held wallet balance)
    let adminWalletBalance = 0;
    if (adminUser) {
      const adminWallet = await Wallet.findOne({ user: adminUser._id });
      if (adminWallet) {
        adminWalletBalance = adminWallet.balance;
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalFees,
        totalPayouts,
        totalWalletHolding,
        pendingRefundCount,
        adminWalletBalance
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ success: false, message: 'Server error fetching admin overview statistics' });
  }
});

// 7. Get Refund Requests (List)
router.get('/refunds', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'vendor') {
      // Find this user's Vendor record
      const vendor = await Vendor.findOne({ user: req.user.id });
      if (!vendor) {
        return res.status(200).json({ success: true, refunds: [] });
      }
      query = { vendor: vendor._id };
    } else if (req.user.role !== 'admin') {
      // Customers see their own refund requests
      query = { user: req.user.id };
    }

    const refunds = await RefundRequest.find(query)
      .populate({
        path: 'booking',
        select: 'bookingRef totalAmount paymentMethod status createdAt'
      })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'vendor',
        select: 'shopName ownerName phone email'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      refunds
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ success: false, message: 'Server error fetching refund requests' });
  }
});

// 8. Submit Refund Request
router.post('/refunds/request', verifyToken, async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;
    if (!bookingId || !reason || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Missing booking ID, amount, or valid reason' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Create refund request
    const refund = new RefundRequest({
      booking: booking._id,
      user: booking.user,
      vendor: booking.center, // booking center maps to Vendor ID
      amount: parseFloat(amount),
      reason,
      status: 'pending'
    });
    await refund.save();

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully. It is now awaiting admin approval.',
      refund
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ success: false, message: 'Server error submitting refund request' });
  }
});

// 9. Moderate Refund Request (Admin Only)
router.post('/refunds/:id/action', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { action, adminNotes } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approved or rejected' });
    }

    const refund = await RefundRequest.findById(req.params.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund request not found' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This refund request has already been processed' });
    }

    refund.status = action;
    refund.adminNotes = adminNotes || '';
    await refund.save();

    const booking = await Booking.findById(refund.booking);

    if (action === 'approved') {
      // 1. Update Booking status
      if (booking) {
        booking.paymentStatus = 'refunded';
        booking.status = 'cancelled';
        await booking.save();
      }

      // 2. Adjust Vendor balance (Deduct from Vendor wallet)
      // First, get the Vendor user ID from Vendor record
      const vendorRecord = await Vendor.findById(refund.vendor);
      if (vendorRecord) {
        let vendorWallet = await Wallet.findOne({ user: vendorRecord.user });
        if (!vendorWallet) {
          vendorWallet = new Wallet({ user: vendorRecord.user, balance: 0 });
        }
        
        vendorWallet.balance -= refund.amount;
        await vendorWallet.save();

        // Log transaction for Vendor
        const vendorTrans = new WalletTransaction({
          wallet: vendorWallet._id,
          user: vendorRecord.user,
          type: 'refund',
          amount: refund.amount,
          status: 'completed',
          description: `Deducted for customer refund of booking ${booking ? booking.bookingRef : 'Ref'}`,
          referenceId: booking ? booking._id.toString() : null
        });
        await vendorTrans.save();
      }

      // 3. Return funds to customer wallet (if customer has a wallet)
      let customerWallet = await Wallet.findOne({ user: refund.user });
      if (!customerWallet) {
        customerWallet = new Wallet({ user: refund.user, balance: 0 });
      }
      customerWallet.balance += refund.amount;
      await customerWallet.save();

      const customerTrans = new WalletTransaction({
        wallet: customerWallet._id,
        user: refund.user,
        type: 'refund',
        amount: refund.amount,
        status: 'completed',
        description: `Refund credited for booking ${booking ? booking.bookingRef : 'Ref'}`,
        referenceId: booking ? booking._id.toString() : null
      });
      await customerTrans.save();
    }

    res.status(200).json({
      success: true,
      message: `Refund request successfully ${action}`,
      refund
    });
  } catch (error) {
    console.error('Error moderating refund:', error);
    res.status(500).json({ success: false, message: 'Server error processing refund request action' });
  }
});

// 10. Admin: Get all Vendor Balances
router.get('/admin/vendor-balances', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Fetch all vendors with their user details
    const vendors = await Vendor.find().populate('user', 'name email phone');
    const vendorBalances = [];

    for (const vendor of vendors) {
      if (!vendor.user) continue; // Skip orphaned records

      let wallet = await Wallet.findOne({ user: vendor.user._id });
      vendorBalances.push({
        vendorId: vendor._id,
        shopName: vendor.shopName,
        ownerName: vendor.ownerName,
        contact: vendor.phone || vendor.whatsappNumber || vendor.user.phone,
        email: vendor.user.email,
        balance: wallet ? wallet.balance : 0,
        pendingBalance: wallet ? (wallet.pendingBalance || 0) : 0
      });
    }

    res.status(200).json({
      success: true,
      vendorBalances
    });
  } catch (error) {
    console.error('Error fetching vendor balances:', error);
    res.status(500).json({ success: false, message: 'Server error fetching vendor balances' });
  }
});

module.exports = router;
