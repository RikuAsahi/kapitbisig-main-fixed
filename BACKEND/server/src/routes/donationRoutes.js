const express = require('express');
const auth = require('../middleware/auth');
const donationController = require('../controllers/donationController');

const router = express.Router();

router.post('/', auth, donationController.createDonation);
router.get('/my-donations', auth, donationController.getMyDonations);
router.get('/:id', auth, donationController.getDonation);
router.get('/campaign/:campaignId/donations', donationController.getCampaignDonations);
router.get('/campaign/:campaignId/stats', donationController.getCampaignStats);

module.exports = router;
