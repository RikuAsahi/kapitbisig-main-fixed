const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const campaignController = require('../controllers/campaignController');

const router = express.Router();

router.post('/', auth, campaignController.createCampaign);
router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', auth, campaignController.updateCampaign);
router.post('/:id/submit', auth, campaignController.submitForApproval);
router.post('/:id/approve', auth, authorize.authorizeRoles(['admin', 'superadmin']), campaignController.approveCampaign);
router.post('/:id/reject', auth, authorize.authorizeRoles(['admin', 'superadmin']), campaignController.rejectCampaign);
router.delete('/:id', auth, campaignController.deleteCampaign);
router.post('/:id/like', auth, campaignController.toggleLike);
router.get('/:id/likes', campaignController.getLikes);
router.post('/:id/comments', auth, campaignController.addComment);
router.get('/:id/comments', campaignController.getComments);

module.exports = router;
