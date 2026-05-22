const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  getPurchasedSubscriptions,
  purchaseSubscription,
  getMySubscriptions
} = require('../controllers/subscriptionController');
const verifyToken = require('../middleware/auth');

router.get('/purchased', getPurchasedSubscriptions);
router.post('/purchase', verifyToken, purchaseSubscription);
router.get('/my-subscriptions', verifyToken, getMySubscriptions);

router.route('/')
  .post(createPlan)
  .get(getPlans);

router.route('/:id')
  .put(updatePlan)
  .delete(deletePlan);

module.exports = router;
