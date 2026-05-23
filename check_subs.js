const mongoose = require('mongoose');
const UserSubscription = require('./backend/models/UserSubscription');

mongoose.connect('mongodb://127.0.0.1:27017/kevell_motor_services', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const subs = await UserSubscription.find({});
    console.log("Subscriptions:", subs);
    mongoose.disconnect();
  })
  .catch(console.error);
