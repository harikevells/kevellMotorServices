const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const verifyToken = require('../middleware/auth');

// Make brands list public (no auth required)
router.get('/brands', vehicleController.getBrands);

// Protected routes below
router.use(verifyToken);

router.route('/')
  .get(vehicleController.getVehicles)
  .post(vehicleController.addVehicle);

router.route('/:id')
  .put(vehicleController.updateVehicle)
  .delete(vehicleController.deleteVehicle);


module.exports = router;
