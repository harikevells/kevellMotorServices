const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const UserSubscription = require('./models/UserSubscription');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const plan = await SubscriptionPlan.findOne({});
  const user = await User.findOne({ role: 'vendor' }) || await User.findOne({});

  if (!plan || !user) {
    console.log('Missing plan or user');
    process.exit(1);
  }

  const sub = new UserSubscription({
    user: user._id,
    userModel: 'User', // Ref to User schema
    plan: plan._id,
    purchaseDate: new Date(),
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'active'
  });

  await sub.save();
  console.log('Seeded UserSubscription successfully!');
  process.exit(0);
}

seed();
