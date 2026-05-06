// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const { uploadShop, uploadService, uploadDocument, uploadProfilePicture, uploadBill } = require('../middleware/upload');
const {
  // Registration & Profile
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  uploadDocuments,
  updateBankDetails,

  // Order Management
  getVendorOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStatistics,

  // Service Management
  addService,
  getVendorServices,
  updateService,
  deleteService,
  toggleServiceStatus,

  // Reviews
  getVendorReviews,
  replyToReview,

  // Dashboard & Reports
  getDashboardData,
  getEarningsReport,
  exportOrders,
  completeVendorProfile,
  updateOrderLocation,
  updateOrderPaymentStatus,
  uploadBookingBill
} = require('../controllers/vendorController');
const verifyToken = require('../middleware/auth');

// All vendor routes are protected and require vendor role
// Note: You might want to add a isVendor middleware to check if user has vendor profile

// ============= REGISTRATION & PROFILE =============
router.post('/register',
  verifyToken,
  uploadShop.single('shopImage'),
  registerVendor
);

router.get('/profile',
  verifyToken,
  getVendorProfile
);

router.put('/profile',
  verifyToken,
  uploadShop.single('shopImage'),
  updateVendorProfile
);

router.post('/documents',
  verifyToken,
  uploadDocument.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 }
  ]),
  uploadDocuments
);

router.post('/bank-details',
  verifyToken,
  updateBankDetails
);

router.post('/complete-profile',
  verifyToken,
  uploadProfilePicture.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'shopImage', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 }
  ]),
  completeVendorProfile
);

// ============= ORDER MANAGEMENT =============
router.get('/orders',
  verifyToken,
  getVendorOrders
);

router.get('/orders/statistics',
  verifyToken,
  getOrderStatistics
);

router.get('/orders/:orderId',
  verifyToken,
  getOrderById
);

router.patch('/orders/:orderId/status',
  verifyToken,
  updateOrderStatus
);

router.patch('/orders/:orderId/location',
  verifyToken,
  updateOrderLocation
);

router.patch('/orders/:orderId/payment-status',
  verifyToken,
  updateOrderPaymentStatus
);

router.post('/orders/:orderId/bill',
  verifyToken,
  uploadBill.single('bill'),
  uploadBookingBill
);


// ============= SERVICE MANAGEMENT =============
router.post('/services',
  verifyToken,
  uploadService.single('serviceImage'),
  addService
);

router.get('/services',
  verifyToken,
  getVendorServices
);

router.put('/services/:serviceId',
  verifyToken,
  uploadService.single('serviceImage'),
  updateService
);

router.delete('/services/:serviceId',
  verifyToken,
  deleteService
);

router.patch('/services/:serviceId/toggle-status',
  (req, res, next) => {
    console.log(`[ROUTING-DEBUG] Hit toggle-status route! ID: ${req.params.serviceId}`);
    next();
  },
  verifyToken,
  toggleServiceStatus
);

router.get('/ping', (req, res) => {
  console.log('[ROUTING-DEBUG] Hit vendor ping route!');
  res.json({ message: 'Vendor API is alive' });
});

// ============= REVIEWS =============
router.get('/reviews',
  verifyToken,
  getVendorReviews
);

router.post('/reviews/:reviewId/reply',
  verifyToken,
  replyToReview
);

// ============= DASHBOARD & REPORTS =============
router.get('/dashboard',
  verifyToken,
  getDashboardData
);

router.get('/reports/earnings',
  verifyToken,
  getEarningsReport
);

router.get('/export/orders',
  verifyToken,
  exportOrders
);

const { createDeliveryBoy, getDeliveryBoys } = require('../controllers/vendorController');
router.post('/delivery-boys', verifyToken, createDeliveryBoy);
router.get('/delivery-boys', verifyToken, getDeliveryBoys);

module.exports = router;