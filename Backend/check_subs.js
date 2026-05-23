const mongoose = require('mongoose');
const UserSubscription = require('./models/UserSubscription');

mongoose.connect('mongodb://127.0.0.1:27017/kevell_motor_services')
  .then(async () => {
    const subs = await UserSubscription.find({});
    console.log("Total Subscriptions:", subs.length);
    if(subs.length > 0) {
        console.log("Sample Sub:", subs[0]);
    }
    mongoose.disconnect();
  })
  .catch(console.error);
