const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} = require('../controllers/subscriptionController');

router.route('/')
  .post(createPlan)
  .get(getPlans);

router.route('/:id')
  .put(updatePlan)
  .delete(deletePlan);

module.exports = router;
