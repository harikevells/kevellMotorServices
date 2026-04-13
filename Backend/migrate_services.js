const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const ServiceType = require('./models/ServiceType');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for migration...');

  const services = await ServiceType.find({});
  console.log(`Found ${services.length} services to check/migrate.`);

  for (const service of services) {
    let updated = false;
    const doc = service.toObject();

    // 1. Rename name to serviceName
    if (doc.name && !doc.serviceName) {
      service.serviceName = doc.name;
      updated = true;
    }

    // 2. Rename base_price to price
    if (doc.base_price && !doc.price) {
      service.price = doc.base_price;
      updated = true;
    }

    // 3. Convert duration_minutes to duration string
    if (doc.duration_minutes && !doc.duration) {
      service.duration = `${doc.duration_minutes} mins`;
      updated = true;
    }

    // 4. Map is_active to status
    if (Object.prototype.hasOwnProperty.call(doc, 'is_active') && !Object.prototype.hasOwnProperty.call(doc, 'status')) {
      service.status = doc.is_active;
      updated = true;
    }
    
    // 5. Map Category (frontend expects Bike/Car/Heavy)
    // Map based on old technical categories OR vehicle categories
    if (!['Bike', 'Car', 'Heavy'].includes(doc.category)) {
        if (doc.applicable_vehicle_cat && doc.applicable_vehicle_cat.includes('4_wheeler')) {
            service.category = 'Car';
        } else if (doc.applicable_vehicle_cat && doc.applicable_vehicle_cat.includes('2_wheeler')) {
            service.category = 'Bike';
        } else if (doc.applicable_vehicle_cat && doc.applicable_vehicle_cat.includes('heavy')) {
            service.category = 'Heavy';
        } else {
            service.category = 'Car'; // Fallback
        }
        updated = true;
    }

    if (updated) {
      await service.save();
      console.log(`Migrated service: ${service.serviceName || doc.name}`);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
