const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ngoController = require('../controllers/ngoController');

const router = express.Router();

router.post('/', auth, ngoController.createNgoProfile);
router.get('/', ngoController.listNgos);
router.get('/verified', ngoController.getVerifiedNgos);
router.get('/my-profile', auth, ngoController.getMyNgoProfile);
router.get('/:id/analytics', ngoController.getNgoAnalytics);
router.get('/:id', ngoController.getNgoProfile);
router.put('/:id', auth, ngoController.updateNgoProfile);
router.delete('/:id', auth, ngoController.deleteNgoProfile);

router.get('/verification/pending', auth, authorize.authorizeRoles(['admin', 'superadmin']), ngoController.getPendingVerifications);
router.post('/:id/verify', auth, authorize.authorizeRoles(['admin', 'superadmin']), ngoController.verifyNgoProfile);
router.post('/:id/reject', auth, authorize.authorizeRoles(['admin', 'superadmin']), ngoController.rejectNgoProfile);

module.exports = router;
