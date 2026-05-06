const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kevellMotorServices';

async function checkOrders() {
  await mongoose.connect(dbUri);
  console.log('Connected to DB');

  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
  const Vendor = mongoose.model('Vendor', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const user = await User.findOne({ email: 'max@gmail.com' });
  if (user) {
    console.log(`\nUser max@gmail.com ID: ${user._id}`);
    const vendor = await Vendor.findOne({ user: user._id });
    if (vendor) {
      console.log(`Vendor for Max: ID: ${vendor._id}, ShopName: ${vendor.shopName}`);
      const vendorOrders = await Booking.find({ center: vendor._id }).sort({ createdAt: -1 });
      console.log(`Orders for this vendor: ${vendorOrders.length}`);
      vendorOrders.forEach(o => console.log(` - Order ID: ${o._id}, bookingDate: ${o.bookingDate}, Status: ${o.status}`));
    } else {
      console.log('No vendor profile found for Max');
    }
  } else {
    console.log('User max@gmail.com not found');
  }

  await mongoose.disconnect();
}

checkOrders().catch(console.error);
