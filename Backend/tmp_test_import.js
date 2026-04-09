const auth = require('./controllers/authController');
console.log('Register:', typeof auth.register);
console.log('Login:', typeof auth.login);
console.log('GetProfile:', typeof auth.getProfile);
console.log('SendOTP:', typeof auth.sendOTP);
console.log('VerifyOTP:', typeof auth.verifyOTP);
