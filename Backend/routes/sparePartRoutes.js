const express = require('express');
const router = express.Router();
const {
  getAllSpareParts,
  getSparePart,
  createSparePart,
  updateSparePart,
  deleteSparePart
} = require('../controllers/sparePartController');

router
  .route('/')
  .get(getAllSpareParts)
  .post(createSparePart);

router
  .route('/:id')
  .get(getSparePart)
  .put(updateSparePart)
  .delete(deleteSparePart);

module.exports = router;
