const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const VehicleBrand = require('./models/VehicleBrand');

const brands = [
  // 2 Wheelers - Petrol
  { brand_name: 'Honda', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Hero', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'TVS', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Bajaj', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Royal Enfield', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Yamaha', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Suzuki', vehicle_category: '2_wheeler', fuel_type: 'petrol' },

  // 2 Wheelers - Electric
  { brand_name: 'Ola Electric', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Ather Energy', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'TVS Electric', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Bajaj Chetak', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Hero Electric', vehicle_category: '2_wheeler', fuel_type: 'electric' },

  // 4 Wheelers - Petrol/Diesel
  { brand_name: 'Maruti Suzuki', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Maruti Suzuki', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Tata Motors', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Tata Motors', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Hyundai', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Hyundai', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Mahindra', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Mahindra', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Kia', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Kia', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Toyota', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Toyota', vehicle_category: '4_wheeler', fuel_type: 'diesel' },

  // 4 Wheelers - Electric
  { brand_name: 'Tata Motors EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'MG Motor', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Hyundai EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'BYD', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Mahindra EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },

  // Heavy - Diesel
  { brand_name: 'Tata Motors', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Ashok Leyland', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'BharatBenz', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Eicher', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Volvo', vehicle_category: 'heavy', fuel_type: 'diesel' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing brands
    await VehicleBrand.deleteMany({});
    console.log('Cleared existing brands');

    // Insert new brands
    await VehicleBrand.insertMany(brands.map(b => ({ ...b, is_active: true })));
    console.log(`Inserted ${brands.length} brands`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding brands:', err);
    process.exit(1);
  }
}

seed();
