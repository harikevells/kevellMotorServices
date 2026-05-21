const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();
const app = express();

// ✅ FIXED CORS - Remove the app.options('*') line
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Remove this line - it's causing the error
// app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url.includes('services') || req.url.includes('toggle')) {
      console.log(`[ROUTING-DEBUG] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
    } else {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Explicit Root-level /services Catch-all for Debugging
app.use('/services', (req, res, next) => {
  console.log(`[CRITICAL-DEBUG] Hit root /services with: ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('🔥 MongoDB connected');
    createDefaultAdmin();
  })
  .catch(err => console.log('❌ MongoDB error:', err));

// Function to create default admin
async function createDefaultAdmin() {
  try {
    const User = require('./models/User');

    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      const admin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Default admin created successfully!');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('✅ Admin already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/vendors', require('./routes/adminvendorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/centers', require('./routes/centerRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/razorpay', require('./routes/razorpayRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/master', require('./routes/masterRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/spare-parts', require('./routes/sparePartRoutes'));
app.use('/api/spare-part-orders', require('./routes/sparePartOrderRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
