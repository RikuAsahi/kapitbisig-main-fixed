const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/payment', settingsController.getPaymentSettings);
router.put('/payment', auth, authorize.authorizeRoles(['admin', 'superadmin']), settingsController.updatePaymentSettings);

module.exports = router;