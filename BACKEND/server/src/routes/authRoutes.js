const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { findByEmail } = require('../models/userModel');

router.post('/signup', authController.signup);
router.post('/signin', authLimiter, authController.signin);
router.post('/login', authLimiter, authController.signin);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateMe);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// DEBUG ENDPOINT: Check if admin account exists (remove in production)
router.get('/debug/admin-check', async (req, res) => {
	try {
		const admin = await findByEmail('admin@kapitbisig.ph');
		if (!admin) {
			return res.json({ status: 'NOT_FOUND', message: 'Admin account does not exist in database' });
		}
		return res.json({
			status: 'FOUND',
			email: admin.email,
			role: admin.role,
			hasPasswordHash: !!admin.passwordHash,
			passwordHashLength: admin.passwordHash ? admin.passwordHash.length : 0,
			message: 'Admin account found. Password hash is ' + (admin.passwordHash ? 'present' : 'MISSING')
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.get('/google', (req, res) => {
	res.status(501).json({ message: 'Google OAuth is not configured yet.' });
});

router.get('/facebook', (req, res) => {
	res.status(501).json({ message: 'Facebook OAuth is not configured yet.' });
});

module.exports = router;
