const express = require('express');
const ratingController = require('../controllers/ratingController');
const { protect, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.post('/', authorize(ROLES.CUSTOMER), ratingController.submitRating);
router.get('/check', authorize(ROLES.CUSTOMER), ratingController.checkRating);
router.get('/my-summary', authorize(ROLES.DRIVER), ratingController.getMyRatingSummary);
router.get('/drivers/summary', authorize(ROLES.ADMIN), ratingController.getDriversSummary);
router.get('/driver/:driverId', authorize(ROLES.ADMIN), ratingController.getDriverRatings);

module.exports = router;
