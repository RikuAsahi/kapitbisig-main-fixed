const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/users', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.createUser);
router.get('/users', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getAllUsers);
router.post('/ngos', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.createNGOProfile);
router.put('/users/:userId/role', auth, authorize.authorizeRoles(['superadmin']), adminController.updateUserRole);
router.delete('/users/:userId', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.deleteUser);
router.delete('/ngos/:ngoId', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.deleteNGOAccount);

router.get('/activity-logs', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getActivityLogs);
router.get('/my-activity-logs', auth, adminController.getMyActivityLogs);
router.get('/activity-logs/:id', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getActivityLog);

router.get('/donations', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getAllDonations);
router.put('/donations/:id/status', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.updateDonationStatus);

module.exports = router;
