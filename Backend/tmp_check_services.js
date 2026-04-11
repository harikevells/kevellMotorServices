const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const ServiceType = require('./models/ServiceType');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const all = await ServiceType.find({});
  const active = await ServiceType.find({ is_active: true });
  const with4WPetrol = await ServiceType.find({
    is_active: true,
    applicable_vehicle_cat: { $in: ['4_wheeler', 'all'] },
    applicable_fuel_types: { $in: ['petrol', 'all'] }
  });
  const with2WElectric = await ServiceType.find({
    is_active: true,
    applicable_vehicle_cat: { $in: ['2_wheeler', 'all'] },
    applicable_fuel_types: { $in: ['electric', 'all'] }
  });

  console.log('--- DB Check ---');
  console.log('Total services:', all.length);
  console.log('is_active=true:', active.length);
  console.log('4_wheeler + petrol:', with4WPetrol.map(s => s.name));
  console.log('2_wheeler + electric:', with2WElectric.map(s => s.name));
  console.log('\nSample doc fields:', JSON.stringify(all[0], null, 2));

  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
