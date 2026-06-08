const User = require('../models/userModel');
const NGO = require('../models/ngoModel');
const Campaign = require('../models/campaignModel');
const ActivityLog = require('../models/activityLogModel');
const constants = require('../utils/constants');
const bcrypt = require('bcryptjs');

async function createAdminUser({ firstName, lastName, email, password, role = constants.ROLES.ADMIN }, adminId, ipAddress) {
	const existing = await User.findByEmail(email, { includeArchived: false });
	if (existing) {
		throw { statusCode: 409, message: constants.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS };
	}

	const normalizedRole = constants.normalizeRole(role);
	// if (![constants.ROLES.ADMIN, constants.ROLES.SUPERADMIN].includes(normalizedRole)) {
	// 	throw { statusCode: 400, message: 'Role must be admin or superadmin.' };
	// }

	const passwordHash = await bcrypt.hash(password, 12);
	const user = await User.createUser({ firstName, lastName, email, passwordHash });
	await User.updateRole(user.id, normalizedRole);

	await ActivityLog.create({
		adminId,
		action: 'CREATE_USER',
		entityType: 'USER',
		entityId: user.id,
		description: `Created ${normalizedRole} account: ${user.fullName} (${user.email})`,
		changes: { role: normalizedRole },
		ipAddress
	});

	return await User.findById(user.id);
}

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

async function changeUserPassword(userId, newPassword, adminId, ipAddress) {
	return User.findById(userId).then(async user => {
		if (!user) {
			throw {
				statusCode: 404,
				message: 'User not found.'
			};
		}
		
		const updated = User.updatePassword(userId, newPassword);
		
		await ActivityLog.create({
			adminId,
			action: 'CHANGE_PASSWORD',
			entityType: 'USER',
			entityId: userId,
			description: `Changed user password for ${user.fullName} (${user.email})`,
			changes: { oldRole, newRole },
			ipAddress
		});
	});
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
	createAdminUser,
	getAllUsers,
	updateUserRole,
	deleteUserAccount,
	deleteNgoAccount,
	logActivity,
	getActivityLogs,
	getAdminActivityLogs,
	getActivityLog
};
