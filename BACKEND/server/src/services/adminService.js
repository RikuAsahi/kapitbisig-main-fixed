const User = require('../models/userModel');
const NGO = require('../models/ngoModel');
const Campaign = require('../models/campaignModel');
const ActivityLog = require('../models/activityLogModel');
const constants = require('../utils/constants');

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

function normalizeRole(role) {
	return constants.normalizeRole(role);
}

async function assertCanArchiveUser(user, adminId, actorRole) {
	const targetRole = normalizeRole(user.role);
	const normalizedActorRole = normalizeRole(actorRole);

	if (String(user.id) === String(adminId)) {
		throw {
			statusCode: 400,
			message: 'You cannot delete your own account while signed in.'
		};
	}

	if (normalizedActorRole !== constants.ROLES.SUPERADMIN && [constants.ROLES.ADMIN, constants.ROLES.SUPERADMIN].includes(targetRole)) {
		throw {
			statusCode: 403,
			message: 'Only a super admin can delete administrator accounts.'
		};
	}

	if (targetRole === constants.ROLES.SUPERADMIN) {
		const activeSuperAdmins = await User.countActiveByRole(constants.ROLES.SUPERADMIN);
		if (activeSuperAdmins <= 1) {
			throw {
				statusCode: 400,
				message: 'Cannot delete the last active super admin account.'
			};
		}
	}
}

async function archiveNgoProfile(profile, adminId, reason) {
	const cancelledCampaigns = await Campaign.cancelByNgoId(profile.id);
	const archived = await NGO.archive(profile.id, {
		archivedBy: adminId,
		reason
	});

	return { archived, cancelledCampaigns };
}

async function deleteUserAccount(userId, adminId, ipAddress, actorRole) {
	const user = await User.findById(userId);
	if (!user) {
		throw {
			statusCode: 404,
			message: 'User not found.'
		};
	}

	await assertCanArchiveUser(user, adminId, actorRole);

	const ngoProfile = await NGO.findByUserId(userId);
	let archivedNgo = false;
	let cancelledCampaigns = 0;
	if (ngoProfile) {
		const result = await archiveNgoProfile(
			ngoProfile,
			adminId,
			`Archived because linked user account ${user.email} was deleted`
		);
		archivedNgo = result.archived;
		cancelledCampaigns = result.cancelledCampaigns;
	}

	const archivedUser = await User.archive(userId, {
		deletedBy: adminId,
		reason: 'Archived by administrator'
	});

	await ActivityLog.create({
		adminId,
		action: 'DELETE_USER',
		entityType: 'USER',
		entityId: userId,
		description: `Archived user account: ${user.fullName} (${user.email})`,
		ipAddress
	});

	return { archivedUser, archivedNgo, cancelledCampaigns };
}

async function deleteNgoAccount(ngoId, adminId, ipAddress, actorRole) {
	const profile = await NGO.findById(ngoId);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}

	const user = await User.findById(profile.userId);
	if (user) {
		await assertCanArchiveUser(user, adminId, actorRole);
	}

	const { archived, cancelledCampaigns } = await archiveNgoProfile(
		profile,
		adminId,
		'Archived by administrator'
	);

	let archivedUser = false;
	if (user) {
		archivedUser = await User.archive(user.id, {
			deletedBy: adminId,
			reason: `Archived because linked NGO profile ${profile.name} was deleted`
		});
	}

	await ActivityLog.create({
		adminId,
		action: 'DELETE_NGO',
		entityType: 'NGO',
		entityId: ngoId,
		description: `Archived NGO account: ${profile.name}${user ? ` (${user.email})` : ''}`,
		ipAddress
	});

	return { archivedNgo: archived, archivedUser, cancelledCampaigns };
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
	deleteNgoAccount,
	logActivity,
	getActivityLogs,
	getAdminActivityLogs,
	getActivityLog
};
