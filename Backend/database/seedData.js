const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const VehicleBrand = require('../models/VehicleBrand');
const ServiceType = require('../models/ServiceType');
const ServiceCenter = require('../models/ServiceCenter');
const Slot = require('../models/Slot');

dotenv.config({ path: path.join(__dirname, '../.env') });

const brands = [
  // --- 2-WHEELER ELECTRIC ---
  { brand_name: 'Ola Electric', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Ather Energy', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'TVS iQube', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Bajaj Chetak', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Hero Vida', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Revolt Motors', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Ampere', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Okinawa', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Pure EV', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  { brand_name: 'Tork Motors', vehicle_category: '2_wheeler', fuel_type: 'electric' },
  
  // --- 2-WHEELER PETROL ---
  { brand_name: 'Hero MotoCorp', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Honda 2Wheelers', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Bajaj Auto', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'TVS Motor', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Royal Enfield', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Yamaha India', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Suzuki 2Wheelers', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'KTM India', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Kawasaki India', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Jawa Yezdi', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Aprilia', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Vespa', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Benelli', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Ducati', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'BMW Motorrad', vehicle_category: '2_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Triumph', vehicle_category: '2_wheeler', fuel_type: 'petrol' },

  // --- 4-WHEELER ELECTRIC ---
  { brand_name: 'Tata Motors EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'MG Motor EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Hyundai EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Mahindra Electric', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'BYD India', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Kia EV', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'BMW i', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Mercedes-Benz EQ', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Audi e-tron', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Volvo Recharge', vehicle_category: '4_wheeler', fuel_type: 'electric' },
  { brand_name: 'Porsche Taycan', vehicle_category: '4_wheeler', fuel_type: 'electric' },

  // --- 4-WHEELER PETROL ---
  { brand_name: 'Maruti Suzuki', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Hyundai Motor', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Tata Motors', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Mahindra & Mahindra', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Kia India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Toyota India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Honda Cars', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Skoda India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Volkswagen India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Renault India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Nissan India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },
  { brand_name: 'Jeep India', vehicle_category: '4_wheeler', fuel_type: 'petrol' },

  // --- 4-WHEELER DIESEL ---
  { brand_name: 'Fortuner (Toyota)', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Thar/Scorpio (Mahindra)', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Innova (Toyota)', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Harrier/Safari (Tata)', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Compass (Jeep)', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'BMW Diesel', vehicle_category: '4_wheeler', fuel_type: 'diesel' },
  { brand_name: 'Mercedes Diesel', vehicle_category: '4_wheeler', fuel_type: 'diesel' },

  // --- 4-WHEELER CNG ---
  { brand_name: 'Maruti Suzuki (CNG)', vehicle_category: '4_wheeler', fuel_type: 'cng' },
  { brand_name: 'Tata Motors (iCNG)', vehicle_category: '4_wheeler', fuel_type: 'cng' },
  { brand_name: 'Hyundai (CNG)', vehicle_category: '4_wheeler', fuel_type: 'cng' },

  // --- 4-WHEELER HYBRID ---
  { brand_name: 'Toyota Hyryder/Grand Vitara', vehicle_category: '4_wheeler', fuel_type: 'hybrid' },
  { brand_name: 'Honda City e:HEV', vehicle_category: '4_wheeler', fuel_type: 'hybrid' },
  { brand_name: 'Lexus Hybrid', vehicle_category: '4_wheeler', fuel_type: 'hybrid' },

  // --- HEAVY VEHICLES ---
  { brand_name: 'Ashok Leyland Trucks', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'BharatBenz', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Tata Prima/Signa', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Eicher Pro', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Mahindra Blazo', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Volvo FM/FMX', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Scania Heavy', vehicle_category: 'heavy', fuel_type: 'diesel' },
  { brand_name: 'Tata Starbus (Electric)', vehicle_category: 'heavy', fuel_type: 'electric' },
  { brand_name: 'JBM Electric Bus', vehicle_category: 'heavy', fuel_type: 'electric' },
  { brand_name: 'Ashok Leyland (Electric)', vehicle_category: 'heavy', fuel_type: 'electric' }
];

const services = [
  // General
  { name: 'Full Vehicle Scan & Diagnostic', category: 'general', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 1500, duration_minutes: 60, description: 'Complete computer diagnostic of all modules.' },
  { name: 'Periodic Service (Silver)', category: 'general', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 3500, duration_minutes: 180, description: 'Basic oil (if needed) and 30-point safety check.' },
  { name: 'Periodic Service (Gold)', category: 'general', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 6500, duration_minutes: 300, description: 'Comprehensive service including filters and deep check.' },
  
  // Battery (EV focus)
  { name: 'Battery State of Health (SOH) Report', category: 'battery', applicable_fuel_types: ['electric', 'hybrid'], applicable_vehicle_cat: ['all'], base_price: 1200, duration_minutes: 45, description: 'Diagnostic test of battery degradation and health.' },
  { name: 'HV System Insulation Test', category: 'battery', applicable_fuel_types: ['electric'], applicable_vehicle_cat: ['4_wheeler', 'heavy'], base_price: 2500, duration_minutes: 90, description: 'Safety check for high voltage wiring.' },
  
  // Engine (ICE focus)
  { name: 'Synthetic Oil Change', category: 'engine', applicable_fuel_types: ['petrol', 'diesel', 'hybrid'], applicable_vehicle_cat: ['all'], base_price: 2800, duration_minutes: 60, description: 'Replacement with premium synthetic oil.' },
  { name: 'Fuel Filter Replacement', category: 'engine', applicable_fuel_types: ['petrol', 'diesel'], applicable_vehicle_cat: ['all'], base_price: 900, duration_minutes: 40, description: 'Prevents fuel system contamination.' },
  { name: 'Spark Plug Replacement', category: 'engine', applicable_fuel_types: ['petrol', 'cng'], applicable_vehicle_cat: ['2_wheeler', '4_wheeler'], base_price: 1200, duration_minutes: 45, description: 'Improves engine firing and efficiency.' },

  // Brakes
  { name: 'Front Brake Pad Replacement', category: 'brake', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 1800, duration_minutes: 60, description: 'Removal of noise and improvement in stopping power.' },
  { name: 'Brake Fluid Flush', category: 'brake', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 1100, duration_minutes: 45, description: 'Ensures hydraulic system response.' },
  
  // AC
  { name: 'AC Performance Check', category: 'ac', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['4_wheeler', 'heavy'], base_price: 600, duration_minutes: 30, description: 'Vents temperature and compressor pressure check.' },
  { name: 'AC Disinfectant & Cleaning', category: 'ac', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['4_wheeler', 'heavy'], base_price: 1500, duration_minutes: 60, description: 'Kills bacteria in vents and cleans cabin filter.' },

  // Washing
  { name: 'Foam Wash & Vacuum', category: 'washing', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['all'], base_price: 600, duration_minutes: 60, description: 'Regular exterior foam wash and interior cleaning.' },
  { name: 'Teflon Coating', category: 'washing', applicable_fuel_types: ['all'], applicable_vehicle_cat: ['2_wheeler', '4_wheeler'], base_price: 4500, duration_minutes: 240, description: 'Paint protection and high gloss finish.' }
];

const centers = [
  // --- MUMBAI ---
  { 
    center_name: 'ZapService Mega Hub — Bandra', 
    email: 'bandra@zapservice.com', phone_number: '9988776655', 
    address: 'BKC Road, Bandra East, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400051',
    location: { type: 'Point', coordinates: [72.8644, 19.0607] },
    specializations: ['2_wheeler', '4_wheeler', 'electric', 'petrol', 'diesel', 'cng', 'hybrid'],
    amenities: ['waiting_area', 'wifi', 'cafeteria', 'pickup_drop'], rating: 4.8, total_reviews: 1205
  },
  { 
    center_name: 'Truck Masters — Thane', 
    email: 'thane@truckmasters.com', phone_number: '9988776656', 
    address: 'Ghodbunder Road, Thane West, Mumbai', city: 'Thane', state: 'Maharashtra', pincode: '400601',
    location: { type: 'Point', coordinates: [72.9781, 19.2183] },
    specializations: ['heavy', 'diesel', 'electric'],
    amenities: ['waiting_area', 'restroom'], rating: 4.5, total_reviews: 450
  },

  // --- BANGALORE ---
  { 
    center_name: 'EV Care Hub — Koramangala', 
    email: 'kora@evcare.com', phone_number: '9988776657', 
    address: '80 Ft Road, Koramangala 4th Block, Bangalore', city: 'Bangalore', state: 'Karnataka', pincode: '560034',
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    specializations: ['2_wheeler', '4_wheeler', 'electric'],
    amenities: ['waiting_area', 'wifi', 'pickup_drop'], rating: 4.9, total_reviews: 890
  },
  { 
    center_name: 'Precision Auto — Whitefield', 
    email: 'wf@precision.com', phone_number: '9988776658', 
    address: 'ITPL Main Road, Whitefield, Bangalore', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    specializations: ['4_wheeler', 'petrol', 'diesel', 'hybrid'],
    amenities: ['waiting_area', 'cafeteria'], rating: 4.7, total_reviews: 670
  },

  // --- CHENNAI ---
  { 
    center_name: 'Chennai Moto Hub', 
    email: 'chennai@motohub.com', phone_number: '9988776659', 
    address: 'Anna Salai, Mount Road, Chennai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    specializations: ['2_wheeler', '4_wheeler', 'petrol', 'diesel', 'electric'],
    amenities: ['waiting_area', 'wifi'], rating: 4.6, total_reviews: 530
  },

  // --- DELHI ---
  { 
    center_name: 'Metro EV Workshop — Noida', 
    email: 'noida@metroev.com', phone_number: '9988776660', 
    address: 'Sector 62, Noida, Delhi NCR', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301',
    location: { type: 'Point', coordinates: [77.3672, 28.6258] },
    specializations: ['2_wheeler', '4_wheeler', 'electric'],
    amenities: ['waiting_area', 'wifi'], rating: 4.8, total_reviews: 410
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for exhaustive seeding');

    // Clear existing
    await VehicleBrand.deleteMany({});
    await ServiceType.deleteMany({});
    await ServiceCenter.deleteMany({});
    await Slot.deleteMany({});
    console.log('Cleared existing data');

    // Insert Brands
    const brandsToSeed = brands.map(b => ({ ...b, is_active: true }));
    await VehicleBrand.insertMany(brandsToSeed);
    console.log(`Successfully seeded ${brandsToSeed.length} Brands`);

    // Insert Services
    await ServiceType.insertMany(services);
    console.log(`Successfully seeded ${services.length} Service Types`);

    // Insert Centers
    const createdCenters = await ServiceCenter.insertMany(centers);
    console.log(`Successfully seeded ${centers.length} Service Centers`);
    
    // Create slots for every center for the next 7 days
    console.log('Generating slots for 7 days across all centers...');
    const slots = [];
    const times = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
    const dates = [];
    for(let i=0; i<7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    createdCenters.forEach(center => {
        dates.forEach(date => {
            times.forEach(time => {
                slots.push({
                    center: center._id,
                    date,
                    time,
                    maxCapacity: 10,
                    bookedCount: Math.floor(Math.random() * 5),
                    isActive: true
                });
            });
        });
    });

    await Slot.insertMany(slots);
    console.log(`Successfully seeded ${slots.length} Slots`);

    console.log('--- EXHAUSTIVE SEEDING COMPLETED ---');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
