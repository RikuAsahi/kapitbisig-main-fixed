const adminService = require('../services/adminService');
const ngoService = require('../services/ngoService');
const Donation = require('../models/donationModel');
const Campaign = require('../models/campaignModel');
const ActivityLog = require('../models/activityLogModel');

async function createUser(req, res, next) {
	try {
		const { firstName, lastName, email, password, role } = req.body || {};
		if (!firstName || !lastName || !email || !password) {
			return res.status(400).json({ message: 'firstName, lastName, email, and password are required.' });
		}
		const ipAddress = req.ip || req.connection.remoteAddress;
		const user = await adminService.createAdminUser(
			{ firstName, lastName, email, password, role: role || 'donor' },
			req.session.userId,
			ipAddress
		);
		return res.status(201).json({ message: 'User account created.', user });
	} catch (error) {
		next(error);
	}
}

async function getAllUsers(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const users = await adminService.getAllUsers(Number(limit), Number(offset));
		return res.json({ users, count: users.length });
	} catch (error) {
		next(error);
	}
}

async function updateUserRole(req, res, next) {
	try {
		const { userId } = req.params;
		const { role } = req.body || {};

		if (!role) {
			return res.status(400).json({ message: 'Role is required.' });
		}

		const ipAddress = req.ip || req.connection.remoteAddress;
		const user = await adminService.updateUserRole(userId, role, req.session.userId, ipAddress);

		return res.json({ message: 'User role updated.', user });
	} catch (error) {
		next(error);
	}
}

async function deleteUser(req, res, next) {
	try {
		const { userId } = req.params;
		const ipAddress = req.ip || req.connection.remoteAddress;
		await adminService.deleteUserAccount(userId, req.session.userId, ipAddress);

		return res.json({ message: 'User account deleted.' });
	} catch (error) {
		next(error);
	}
}

async function getActivityLogs(req, res, next) {
	try {
		const { adminId, entityType, action, startDate, endDate, limit = 100, offset = 0 } = req.query;

		const filters = {};
		if (adminId) filters.adminId = adminId;
		if (entityType) filters.entityType = entityType;
		if (action) filters.action = action;
		if (startDate) filters.startDate = startDate;
		if (endDate) filters.endDate = endDate;

		const logs = await adminService.getActivityLogs(filters, Number(limit), Number(offset));
		return res.json({ logs, count: logs.length });
	} catch (error) {
		next(error);
	}
}

async function getMyActivityLogs(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const logs = await adminService.getAdminActivityLogs(req.session.userId, Number(limit), Number(offset));
		return res.json({ logs, count: logs.length });
	} catch (error) {
		next(error);
	}
}

async function getActivityLog(req, res, next) {
	try {
		const { id } = req.params;
		const log = await adminService.getActivityLog(id);
		return res.json({ log });
	} catch (error) {
		next(error);
	}
}

async function createNGOProfile(req, res, next) {
	try {
		const { userId, name, registrationNumber, description, websiteUrl, phoneNumber, address } = req.body || {};
		if (!userId || !name || !registrationNumber) {
			return res.status(400).json({ message: 'userId, name, and registrationNumber are required.' });
		}
		const profile = await ngoService.createNgoProfile(
			{ name, registrationNumber, description, websiteUrl, phoneNumber, address },
			userId
		);
		return res.status(201).json({ message: 'NGO profile created.', profile });
	} catch (error) {
		next(error);
	}
}

async function getAllDonations(req, res, next) {
	try {
		const { status, paymentMethod, limit = 50, offset = 0 } = req.query;
		const donations = await Donation.findAllWithDetails({
			status: status || null,
			paymentMethod: paymentMethod || null,
			limit: Number(limit),
			offset: Number(offset)
		});
		const total = await Donation.countAll({
			status: status || null,
			paymentMethod: paymentMethod || null
		});
		return res.json({ donations, total, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function updateDonationStatus(req, res, next) {
	try {
		const { id } = req.params;
		const { status, notes } = req.body || {};

		if (!['completed', 'failed'].includes(status)) {
			return res.status(400).json({ message: 'Status must be "completed" or "failed".' });
		}

		const donation = await Donation.findById(id);
		if (!donation) return res.status(404).json({ message: 'Donation not found.' });
		if (donation.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending donations can be reviewed.' });
		}

		const updated = await Donation.updateStatus(id, status, notes || null);

		if (status === 'completed') {
			await Campaign.updateAmount(donation.campaignId, donation.amount);
		}

		ActivityLog.create({
			adminId: req.session.userId,
			action: status === 'completed' ? 'APPROVE' : 'REJECT',
			entityType: 'DONATION',
			entityId: String(id),
			description: `${status === 'completed' ? 'Approved' : 'Rejected'} bank transfer donation #${id} of ₱${donation.amount.toLocaleString()} for campaign #${donation.campaignId}`,
			ipAddress: req.ip || req.connection?.remoteAddress
		}).catch(() => {});

		return res.json({ message: `Donation marked as ${status}.`, donation: updated });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createUser,
	createNGOProfile,
	getAllUsers,
	updateUserRole,
	deleteUser,
	getActivityLogs,
	getMyActivityLogs,
	getActivityLog,
	getAllDonations,
	updateDonationStatus
};