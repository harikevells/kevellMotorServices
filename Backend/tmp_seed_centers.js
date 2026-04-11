const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ServiceCenter = require('./models/ServiceCenter');

dotenv.config({ path: path.join(__dirname, '.env') });

const centers = [
  {
    center_name: "Kevell Auto Care - Main",
    owner_name: "Ravi Kumar",
    email: "ravi@kevell.com",
    phone_number: "9876543210",
    address: "123 Main Road, Anna Nagar",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600040",
    location: {
      type: "Point",
      coordinates: [80.2116, 13.0827] // [lng, lat]
    },
    rating: 4.8,
    total_reviews: 124,
    opening_time: "09:00 AM",
    closing_time: "08:00 PM",
    specializations: ['2_wheeler', '4_wheeler', 'petrol', 'diesel', 'electric'],
    amenities: ['waiting_area', 'wifi']
  },
  {
    center_name: "GreenEV Certified Hub",
    owner_name: "Anitha S",
    email: "anitha@greenev.com",
    phone_number: "9988776655",
    address: "45 EV Tech Park, OMR",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600096",
    location: {
      type: "Point",
      coordinates: [80.2300, 12.9716] // [lng, lat]
    },
    rating: 4.9,
    total_reviews: 89,
    opening_time: "08:00 AM",
    closing_time: "06:00 PM",
    specializations: ['2_wheeler', '4_wheeler', 'electric'],
    amenities: ['cafeteria', 'pickup_drop']
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await ServiceCenter.deleteMany({});
    await ServiceCenter.insertMany(centers);
    console.log("Centers seeded!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
