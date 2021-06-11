const express = require('express');
const router = express.Router();
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

router.get('/signup', viewsController.getSignUp);

router.get('/me', authController.protect, viewsController.getAccount);
router.post('/submit-user-data', authController.protect, viewsController.updateUserData);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.use(authController.isLoggedIn);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLogin);

module.exports = router;
