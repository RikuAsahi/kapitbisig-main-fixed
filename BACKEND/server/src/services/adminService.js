const User = require('../models/userModel');
const ActivityLog = require('../models/activityLogModel');

async function getAllUsers(limit = 50, offset = 0) {
	const users = await User.findAll(limit, offset);
	return users;
}

async function updateUserRole(userId, newRole, adminId, ipAddress) {
	const user = await User.findById(userId);
	if (!user) {
		throw {
			statusCode: 404,
			message: 'User not found.'
		};
	}

	const oldRole = user.role;
	const updated = await User.updateRole(userId, newRole);

	await ActivityLog.create({
		adminId,
		action: 'UPDATE_ROLE',
		entityType: 'USER',
		entityId: userId,
		description: `Changed user role from ${oldRole} to ${newRole}`,
		changes: { oldRole, newRole },
		ipAddress
	});

	return updated;
}

async function deleteUserAccount(userId, adminId, ipAddress) {
	const user = await User.findById(userId);
	if (!user) {
		throw {
			statusCode: 404,
			message: 'User not found.'
		};
	}

	const deleted = await User.delete(userId);

	await ActivityLog.create({
		adminId,
		action: 'DELETE_USER',
		entityType: 'USER',
		entityId: userId,
		description: `Deleted user account: ${user.fullName} (${user.email})`,
		ipAddress
	});

	return deleted;
}

async function logActivity(adminId, action, entityType, entityId, description, changes, ipAddress) {
	return ActivityLog.create({
		adminId,
		action,
		entityType,
		entityId,
		description,
		changes,
		ipAddress
	});
}

async function getActivityLogs(filters = {}, limit = 100, offset = 0) {
	return ActivityLog.findAll(filters, limit, offset);
}

async function getAdminActivityLogs(adminId, limit = 50, offset = 0) {
	return ActivityLog.findByAdminId(adminId, limit, offset);
}

async function getActivityLog(id) {
	const log = await ActivityLog.findById(id);
	if (!log) {
		throw {
			statusCode: 404,
			message: 'Activity log not found.'
		};
	}
	return log;
}

module.exports = {
	getAllUsers,
	updateUserRole,
	deleteUserAccount,
	logActivity,
	getActivityLogs,
	getAdminActivityLogs,
	getActivityLog
};
