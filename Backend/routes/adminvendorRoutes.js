// routes/adminVendorRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  suspendVendor,
  verifyVendor,
  updateCommission,
  deleteVendor,
  getPendingVendors,
  getVendorEarnings,
  updateVendor
} = require('../controllers/adminvendorController');
const verifyToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All routes are protected and require admin
router.use(verifyToken, isAdmin);

// Request logger for this specific router
router.use((req, res, next) => {
  console.log(`[ADMIN-VENDOR-ROUTER] ${req.method} ${req.path}`);
  next();
});

// Vendor management
console.log('[DEBUG] Initializing Admin Vendor Routes...');
router.patch('/:id', updateVendor);
router.get('/', getAllVendors);
router.get('/pending', getPendingVendors);
router.get('/:id', getVendorById);

// Vendor actions
router.patch('/:id/approve', approveVendor);
router.patch('/:id/reject', rejectVendor);
router.patch('/:id/suspend', suspendVendor);
router.patch('/:id/verify', verifyVendor);
router.patch('/:id/commission', updateCommission);

// Earnings
router.get('/:id/earnings', getVendorEarnings);

// Delete vendor
router.delete('/:id', deleteVendor);

module.exports = router;