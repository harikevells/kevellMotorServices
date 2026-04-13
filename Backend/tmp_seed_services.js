const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const ServiceType = require('./models/ServiceType');

const services = [
  // ─── GENERAL ──────────────────────────────────────────────────
  {
    serviceName: 'Full Service',
    category: 'Car',
    price: 1299,
    duration: '3 hrs',
    description: 'Complete vehicle inspection, oil change, filter replacement and multi-point check.',
    status: true,
  },
  {
    serviceName: 'Oil Change',
    category: 'Car',
    price: 499,
    duration: '1 hr',
    description: 'Engine oil drain, flush and refill with premium grade oil.',
    status: true,
  },
  {
    serviceName: 'Tyre Rotation & Balancing',
    category: 'Car',
    price: 399,
    duration: '1 hr',
    description: 'Rotate all four tyres and balance wheels for even tread wear.',
    status: true,
  },

  // ─── BATTERY ──────────────────────────────────────────────────
  {
    serviceName: 'Battery Health Check',
    category: 'Bike',
    price: 299,
    duration: '45 mins',
    description: 'Check battery voltage, charge level, and overall battery health.',
    status: true,
  },
  {
    serviceName: 'EV Battery Deep Diagnosis',
    category: 'Car',
    price: 999,
    duration: '2 hrs',
    description: 'Full cell-level analysis, BMS read-out and range calibration for EV batteries.',
    status: true,
  },
  {
    serviceName: 'Battery Replacement',
    category: 'Heavy',
    price: 2499,
    duration: '1 hr',
    description: 'Replace old or dead battery with OEM-grade replacement.',
    status: true,
  },

  // ─── BRAKE ────────────────────────────────────────────────────
  {
    serviceName: 'Brake Pad Replacement',
    category: 'Bike',
    price: 799,
    duration: '1.5 hrs',
    description: 'Remove worn brake pads and install new high-performance pads.',
    status: true,
  },
  {
    serviceName: 'Brake Fluid Flush',
    category: 'Car',
    price: 349,
    duration: '45 mins',
    description: 'Drain old brake fluid and refill with fresh DOT-4 fluid.',
    status: true,
  },
  {
    serviceName: 'Disc Rotor Resurfacing',
    category: 'Car',
    price: 1299,
    duration: '2 hrs',
    description: 'Machine-resurface warped or scored brake rotors for smooth braking.',
    status: true,
  },

  // ─── ENGINE ───────────────────────────────────────────────────
  {
    serviceName: 'Engine Tune-Up',
    category: 'Car',
    price: 1499,
    duration: '2 hrs',
    description: 'Spark plug, air filter, and fuel injector cleaning for peak performance.',
    status: true,
  },
  {
    serviceName: 'Coolant Top-Up & Flush',
    category: 'Heavy',
    price: 599,
    duration: '1 hr',
    description: 'Flush old coolant and refill with fresh antifreeze/coolant mixture.',
    status: true,
  },

  // ─── ELECTRICAL ───────────────────────────────────────────────
  {
    serviceName: 'Electrical System Check',
    category: 'Bike',
    price: 499,
    duration: '1 hr',
    description: 'Inspect wiring harness, fuses, alternator and all electrical components.',
    status: true,
  },
  {
    serviceName: 'EV Charger & Port Inspection',
    category: 'Bike',
    price: 399,
    duration: '45 mins',
    description: 'Test charging port, OBC and onboard charger health.',
    status: true,
  },

  // ─── AC ───────────────────────────────────────────────────────
  {
    serviceName: 'AC Gas Refill',
    category: 'Car',
    price: 999,
    duration: '1 hr',
    description: 'Leak check and refill refrigerant gas to optimal levels.',
    status: true,
  },
  {
    serviceName: 'AC Deep Clean',
    category: 'Car',
    price: 799,
    duration: '1.5 hrs',
    description: 'Sanitise evaporator, cabin filter replacement, and vent deodorisation.',
    status: true,
  },

  // ─── WASHING ──────────────────────────────────────────────────
  {
    serviceName: 'Exterior Wash & Polish',
    category: 'Car',
    price: 299,
    duration: '1 hr',
    description: 'Professional hand wash, clay bar treatment, and liquid polish application.',
    status: true,
  },
  {
    serviceName: 'Interior Deep Clean',
    category: 'Car',
    price: 699,
    duration: '2 hrs',
    description: 'Vacuum, steam clean seats, dashboard wipe-down, and odour elimination.',
    status: true,
  },

  // ─── EMERGENCY ────────────────────────────────────────────────
  {
    serviceName: 'Roadside Breakdown Assist',
    category: 'Heavy',
    price: 999,
    duration: '1 hr',
    description: 'On-site technician dispatch for jump-start, tyre change, or towing.',
    status: true,
  },
  {
    serviceName: 'Flat Tyre Repair',
    category: 'Bike',
    price: 199,
    duration: '30 mins',
    description: 'Plug, patch or swap flat tyre on the spot.',
    status: true,
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
    console.log(`Verified: ${count} services in database.`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding services:', err);
    process.exit(1);
  }
}

seed();
