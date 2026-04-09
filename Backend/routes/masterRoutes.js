const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

router.get('/:type', masterController.getMasterDataByType);
router.post('/add', masterController.addMasterData); // Internal/Admin use mainly

module.exports = router;
