const mongoose = require('mongoose');
const Slot = require('./models/Slot');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kevell_motors');
  const slots = await Slot.find({});
  console.log(`Total slots in DB: ${slots.length}`);
  
  const byVendor = {};
  for (const s of slots) {
      const vid = s.center.toString();
      byVendor[vid] = (byVendor[vid] || 0) + 1;
  }
  console.log("Slots by vendor:", byVendor);
  process.exit(0);
}
test();
