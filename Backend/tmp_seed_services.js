const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const ServiceType = require('./models/ServiceType');

const services = [
  // ─── GENERAL ──────────────────────────────────────────────────
  {
    name: 'Full Service',
    category: 'general',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 180,
    base_price: 1299,
    description: 'Complete vehicle inspection, oil change, filter replacement and multi-point check.',
    is_active: true,
  },
  {
    name: 'Oil Change',
    category: 'general',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid'],
    duration_minutes: 60,
    base_price: 499,
    description: 'Engine oil drain, flush and refill with premium grade oil.',
    is_active: true,
  },
  {
    name: 'Tyre Rotation & Balancing',
    category: 'general',
    applicable_vehicle_cat: ['4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 60,
    base_price: 399,
    description: 'Rotate all four tyres and balance wheels for even tread wear.',
    is_active: true,
  },

  // ─── BATTERY ──────────────────────────────────────────────────
  {
    name: 'Battery Health Check',
    category: 'battery',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['electric', 'petrol', 'diesel', 'hybrid'],
    duration_minutes: 45,
    base_price: 299,
    description: 'Check battery voltage, charge level, and overall battery health.',
    is_active: true,
  },
  {
    name: 'EV Battery Deep Diagnosis',
    category: 'battery',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['electric'],
    duration_minutes: 120,
    base_price: 999,
    description: 'Full cell-level analysis, BMS read-out and range calibration for EV batteries.',
    is_active: true,
  },
  {
    name: 'Battery Replacement',
    category: 'battery',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid'],
    duration_minutes: 60,
    base_price: 2499,
    description: 'Replace old or dead battery with OEM-grade replacement.',
    is_active: true,
  },

  // ─── BRAKE ────────────────────────────────────────────────────
  {
    name: 'Brake Pad Replacement',
    category: 'brake',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 90,
    base_price: 799,
    description: 'Remove worn brake pads and install new high-performance pads.',
    is_active: true,
  },
  {
    name: 'Brake Fluid Flush',
    category: 'brake',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 45,
    base_price: 349,
    description: 'Drain old brake fluid and refill with fresh DOT-4 fluid.',
    is_active: true,
  },
  {
    name: 'Disc Rotor Resurfacing',
    category: 'brake',
    applicable_vehicle_cat: ['4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 120,
    base_price: 1299,
    description: 'Machine-resurface warped or scored brake rotors for smooth braking.',
    is_active: true,
  },

  // ─── ENGINE ───────────────────────────────────────────────────
  {
    name: 'Engine Tune-Up',
    category: 'engine',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid'],
    duration_minutes: 120,
    base_price: 1499,
    description: 'Spark plug, air filter, and fuel injector cleaning for peak performance.',
    is_active: true,
  },
  {
    name: 'Coolant Top-Up & Flush',
    category: 'engine',
    applicable_vehicle_cat: ['4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'hybrid'],
    duration_minutes: 60,
    base_price: 599,
    description: 'Flush old coolant and refill with fresh antifreeze/coolant mixture.',
    is_active: true,
  },

  // ─── ELECTRICAL ───────────────────────────────────────────────
  {
    name: 'Electrical System Check',
    category: 'electrical',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 60,
    base_price: 499,
    description: 'Inspect wiring harness, fuses, alternator and all electrical components.',
    is_active: true,
  },
  {
    name: 'EV Charger & Port Inspection',
    category: 'electrical',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['electric'],
    duration_minutes: 45,
    base_price: 399,
    description: 'Test charging port, OBC and onboard charger health.',
    is_active: true,
  },

  // ─── AC ───────────────────────────────────────────────────────
  {
    name: 'AC Gas Refill',
    category: 'ac',
    applicable_vehicle_cat: ['4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 60,
    base_price: 999,
    description: 'Leak check and refill refrigerant gas to optimal levels.',
    is_active: true,
  },
  {
    name: 'AC Deep Clean',
    category: 'ac',
    applicable_vehicle_cat: ['4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 90,
    base_price: 799,
    description: 'Sanitise evaporator, cabin filter replacement, and vent deodorisation.',
    is_active: true,
  },

  // ─── WASHING ──────────────────────────────────────────────────
  {
    name: 'Exterior Wash & Polish',
    category: 'washing',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 60,
    base_price: 299,
    description: 'Professional hand wash, clay bar treatment, and liquid polish application.',
    is_active: true,
  },
  {
    name: 'Interior Deep Clean',
    category: 'washing',
    applicable_vehicle_cat: ['4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 120,
    base_price: 699,
    description: 'Vacuum, steam clean seats, dashboard wipe-down, and odour elimination.',
    is_active: true,
  },

  // ─── EMERGENCY ────────────────────────────────────────────────
  {
    name: 'Roadside Breakdown Assist',
    category: 'emergency',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler', 'heavy'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 60,
    base_price: 999,
    description: 'On-site technician dispatch for jump-start, tyre change, or towing.',
    is_active: true,
  },
  {
    name: 'Flat Tyre Repair',
    category: 'emergency',
    applicable_vehicle_cat: ['2_wheeler', '4_wheeler'],
    applicable_fuel_types: ['petrol', 'diesel', 'cng', 'hybrid', 'electric'],
    duration_minutes: 30,
    base_price: 199,
    description: 'Plug, patch or swap flat tyre on the spot.',
    is_active: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await ServiceType.deleteMany({});
    console.log('Cleared existing services');

    await ServiceType.insertMany(services);
    console.log(`Inserted ${services.length} services`);

    // Verify
    const count = await ServiceType.countDocuments();
    const cats = await ServiceType.distinct('category');
    console.log(`Verified: ${count} services, categories:`, cats);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding services:', err);
    process.exit(1);
  }
}

seed();
