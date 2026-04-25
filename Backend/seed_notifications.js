const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./models/Notification');
const User = require('./models/User');

dotenv.config();

const seedNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin user not found. Please create one first.');
      process.exit(1);
    }

    const dummyNotifications = [
      {
        title: 'Booking services',
        message: 'A new booking has been received and is awaiting confirmation.',
        type: 'booking',
        recipientRole: 'admin',
        createdAt: new Date('2026-02-11T00:00:00Z')
      },
      {
        title: 'New Vendor Registration',
        message: 'A new vendor has registered and is pending verification,',
        type: 'registration',
        recipientRole: 'admin',
        createdAt: new Date('2026-02-11T00:00:00Z')
      },
      {
        title: 'Payment',
        message: 'Payment failed for booking #BK1026 – action required',
        type: 'payment',
        recipientRole: 'admin',
        createdAt: new Date('2026-02-11T00:00:00Z')
      },
      {
        title: 'Payment',
        message: 'Immediate action required: Payment failures detected',
        type: 'payment',
        recipientRole: 'admin',
        createdAt: new Date('2026-02-11T00:00:00Z')
      }
    ];

    await Notification.insertMany(dummyNotifications);
    console.log('Successfully seeded 4 notifications');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();
