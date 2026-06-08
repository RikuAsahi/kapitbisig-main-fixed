const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/users', auth, authorize.authorizeRoles(['admin']), adminController.createUser);
router.get('/users', auth, authorize.authorizeRoles(['admin']), adminController.getAllUsers);
router.post('/ngos', auth, authorize.authorizeRoles(['admin']), adminController.createNGOProfile);
router.put('/users/:userId/role', auth, authorize.authorizeRoles(['admin']), adminController.updateUserRole);
router.put('/users/:userId/change-password', auth, adminController.changeUserPassword);
router.delete('/users/:userId', auth, authorize.authorizeRoles(['admin']), adminController.deleteUser);
router.delete('/ngos/:ngoId', auth, authorize.authorizeRoles(['admin']), adminController.deleteNGOAccount);

router.get('/activity-logs', auth, authorize.authorizeRoles(['admin']), adminController.getActivityLogs);
router.get('/my-activity-logs', auth, adminController.getMyActivityLogs);
router.get('/activity-logs/:id', auth, authorize.authorizeRoles(['admin']), adminController.getActivityLog);

router.get('/donations', auth, authorize.authorizeRoles(['admin']), adminController.getAllDonations);
router.put('/donations/:id/status', auth, authorize.authorizeRoles(['admin']), adminController.updateDonationStatus);

module.exports = router;
