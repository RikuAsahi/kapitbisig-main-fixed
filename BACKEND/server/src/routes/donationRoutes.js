const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const donationController = require('../controllers/donationController');

const router = express.Router();

router.post('/', auth, donationController.createDonation);
router.get('/my-donations', auth, donationController.getMyDonations);
router.get('/:id', auth, donationController.getDonation);
router.get('/campaign/:campaignId/donations', donationController.getCampaignDonations);
router.get('/campaign/:campaignId/stats', donationController.getCampaignStats);
router.post('/createPaymentIntent', donationController.createPaymentIntent);
router.post('/createPaymentMethod', donationController.createPaymentMethod);
router.post('/payment/callback', donationController.paymentCallback);



module.exports = router;
