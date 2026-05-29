const bcrypt = require('bcryptjs');
const { findByEmail, findById, createUser, updatePassword, updateProfile } = require('../models/userModel');
const passwordResetModel = require('../models/passwordResetModel');
const { sendPasswordResetEmail } = require('../services/emailService');
const { validateEmail, validatePassword } = require('../utils/validators');
const constants = require('../utils/constants');

function toPublicUser(user) {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		fullName: user.fullName,
		email: user.email,
		role: user.role,
		avatarUrl: user.avatarUrl || null,
		coverUrl: user.coverUrl || null,
		notificationPrefs: user.notificationPrefs || null,
		createdAt: user.createdAt
	};
}

function getDashboardRedirect(role) {
	const normalizedRole = constants.normalizeRole(role);
	if (normalizedRole === constants.ROLES.ADMIN || normalizedRole === constants.ROLES.SUPERADMIN) {
		return 'AdminDashboard.html?role=superadmin';
	}
	if (normalizedRole === constants.ROLES.NGO_ADMIN) {
		return 'AdminDashboard.html?role=ngo';
	}
	return 'index.html';
}

async function signup(req, res, next) {
	try {
		const { firstName, lastName, email, password } = req.body || {};

		if (!firstName || !lastName || !email || !password) {
			return res.status(400).json({ message: 'Missing required fields.' });
		}

		if (!validateEmail(email)) {
			return res.status(400).json({ message: 'Invalid email format.' });
		}

		if (!validatePassword(password)) {
			return res.status(400).json({ message: 'Password must be at least 8 characters.' });
		}

		const existing = await findByEmail(String(email).trim(), { includeArchived: true });
		if (existing) {
			return res.status(409).json({ message: 'Email already registered.' });
		}

		const passwordHash = await bcrypt.hash(String(password), 10);
		const user = await createUser({
			firstName: String(firstName).trim(),
			lastName: String(lastName).trim(),
			email: String(email).trim(),
			passwordHash
		});

		req.session.userId = user.id;
		const publicUser = toPublicUser(user);
		return res.status(201).json({
			success: true,
			message: 'Account created.',
			user: publicUser,
			redirectUrl: getDashboardRedirect(publicUser.role)
		});
	} catch (error) {
		next(error);
	}
}

async function signin(req, res, next) {
	try {
		const { email, password } = req.body || {};

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required.' });
		}

		console.log('[AUTH] Signin attempt for:', email);
		
		const user = await findByEmail(String(email).trim());
		if (!user) {
			console.log('[AUTH] User not found for email:', email);
			return res.status(401).json({ message: constants.ERROR_MESSAGES.INVALID_CREDENTIALS });
		}

		console.log('[AUTH] User found:', { id: user.id, email: user.email, role: user.role });
		
		if (!user.passwordHash) {
			console.log('[AUTH] ⚠️ WARNING: User has no password hash stored in database');
			return res.status(401).json({ message: constants.ERROR_MESSAGES.INVALID_CREDENTIALS });
		}

		console.log('[AUTH] Attempting bcrypt.compare with provided password');
		const match = await bcrypt.compare(String(password), user.passwordHash);
		
		if (!match) {
			console.log('[AUTH] Password verification failed for user:', email);
			return res.status(401).json({ message: constants.ERROR_MESSAGES.INVALID_CREDENTIALS });
		}

		console.log('[AUTH] ✓ Password verified successfully for user:', email);
		req.session.userId = user.id;
		console.log('[AUTH] Session created with userId:', user.id);
		
		const publicUser = toPublicUser(user);
		return res.json({
			success: true,
			message: 'Signed in.',
			user: publicUser,
			redirectUrl: getDashboardRedirect(publicUser.role)
		});
	} catch (error) {
		console.error('[AUTH] ✗ Signin error:', error);
		next(error);
	}
}

async function getMe(req, res, next) {
	try {
		if (!req.session.userId) {
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		const user = await findById(req.session.userId);
		if (!user) {
			req.session.destroy(() => {});
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		return res.json({ user: toPublicUser(user) });
	} catch (error) {
		next(error);
	}
}

function logout(req, res) {
	req.session.destroy(() => {
		res.clearCookie('kb.sid');
		res.json({ message: 'Signed out.' });
	});
}

async function forgotPassword(req, res, next) {
	try {
		const { email } = req.body || {};
		if (!email) {
			return res.status(400).json({ message: 'Email is required.' });
		}

		if (!validateEmail(email)) {
			return res.status(400).json({ message: 'Invalid email format.' });
		}

		let devResetUrl = null;

		// Always return 200 for valid-looking emails; never reveal whether an account exists.
		const user = await findByEmail(String(email).trim());
		if (user) {
			const token = await passwordResetModel.createToken(user.id);
			const frontendBaseUrl = process.env.FRONTEND_PUBLIC_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
			const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/SignIn.html?token=${token}`;
			const emailSent = await sendPasswordResetEmail({
				toEmail: user.email,
				toName: user.fullName || user.firstName,
				resetUrl
			});

			if (!emailSent && process.env.NODE_ENV !== 'production') {
				devResetUrl = resetUrl;
			}
			console.log(`[PASSWORD RESET] Link for ${email}:\n  ${resetUrl}`);
		}

		const response = { message: 'If that email is registered, a reset link has been sent.' };
		if (devResetUrl) response.devResetUrl = devResetUrl;
		return res.json(response);
	} catch (error) {
		next(error);
	}
}

async function resetPassword(req, res, next) {
	try {
		const { token, password } = req.body || {};
		if (!token || !password) {
			return res.status(400).json({ message: 'Token and new password are required.' });
		}

		if (!validatePassword(password)) {
			return res.status(400).json({ message: 'Password must be at least 8 characters.' });
		}

		const record = await passwordResetModel.findValidToken(String(token));
		if (!record) {
			return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
		}

		const passwordHash = await bcrypt.hash(String(password), 10);
		await updatePassword(record.user_id, passwordHash);
		await passwordResetModel.markUsed(record.token_id);

		return res.json({ message: 'Password updated successfully. You can now sign in.' });
	} catch (error) {
		next(error);
	}
}

async function updateMe(req, res, next) {
	try {
		const { firstName, lastName, avatarUrl, coverUrl, notificationPrefs } = req.body || {};

		const updates = {};
		if (firstName !== undefined) updates.firstName = String(firstName).trim();
		if (lastName !== undefined)  updates.lastName  = String(lastName).trim();
		if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
		if (coverUrl  !== undefined) updates.coverUrl  = coverUrl;
		if (notificationPrefs !== undefined) updates.notificationPrefs = notificationPrefs;

		if (updates.firstName === '' || updates.lastName === '') {
			return res.status(400).json({ message: 'Name cannot be empty.' });
		}
		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ message: 'No fields to update.' });
		}

		const user = await updateProfile(req.session.userId, updates);
		return res.json({ message: 'Profile updated.', user: toPublicUser(user) });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	signup,
	signin,
	getMe,
	updateMe,
	logout,
	forgotPassword,
	resetPassword
};
