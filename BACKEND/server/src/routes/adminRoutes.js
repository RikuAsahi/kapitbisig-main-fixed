const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/users', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getAllUsers);
router.put('/users/:userId/role', auth, authorize.authorizeRoles(['superadmin']), adminController.updateUserRole);
router.delete('/users/:userId', auth, authorize.authorizeRoles(['superadmin']), adminController.deleteUser);

router.get('/activity-logs', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getActivityLogs);
router.get('/my-activity-logs', auth, adminController.getMyActivityLogs);
router.get('/activity-logs/:id', auth, authorize.authorizeRoles(['admin', 'superadmin']), adminController.getActivityLog);

module.exports = router;
