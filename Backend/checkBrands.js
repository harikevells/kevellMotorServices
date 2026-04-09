const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const VehicleBrand = require('./models/VehicleBrand');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vBrands = await VehicleBrand.find({ vehicle_category: '2_wheeler', fuel_type: 'electric', is_active: true });
  console.log('2W Electric Brands (Active):', vBrands.length);
  const first = await VehicleBrand.findOne({ vehicle_category: '2_wheeler', fuel_type: 'electric' });
  console.log('Sample Brand is_active:', first ? first.is_active : 'none');
  process.exit();
}

check();
