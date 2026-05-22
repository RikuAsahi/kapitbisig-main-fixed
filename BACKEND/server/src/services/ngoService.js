const NGO = require('../models/ngoModel');
const { validateRequiredFields, validatePhoneNumber } = require('../utils/validators');
const { NGO_VERIFICATION_STATUS } = require('../utils/constants');

async function createNgoProfile(data, userId) {
	validateRequiredFields(data, ['name', 'registrationNumber']);

	if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
		throw {
			statusCode: 400,
			message: 'Invalid phone number format.'
		};
	}

	const existing = await NGO.findByUserId(userId);
	if (existing) {
		throw {
			statusCode: 409,
			message: 'User already has an NGO profile.'
		};
	}

	const profile = await NGO.create({
		userId,
		name: data.name,
		description: data.description || null,
		websiteUrl: data.websiteUrl || null,
		phoneNumber: data.phoneNumber || null,
		address: data.address || null,
		registrationNumber: data.registrationNumber
	});

	return profile;
}

async function getNgoProfile(id) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}
	return profile;
}

async function getUserNgoProfile(userId) {
	const profile = await NGO.findByUserId(userId);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}
	return profile;
}

async function updateNgoProfile(id, data, userId) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}

	if (profile.userId !== userId) {
		throw {
			statusCode: 403,
			message: 'Cannot update other NGO profiles.'
		};
	}

	if (profile.verificationStatus === NGO_VERIFICATION_STATUS.VERIFIED) {
		throw {
			statusCode: 400,
			message: 'Cannot update verified NGO profiles.'
		};
	}

	if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
		throw {
			statusCode: 400,
			message: 'Invalid phone number format.'
		};
	}

	const updated = await NGO.update(id, data);
	return updated;
}

async function getPendingVerifications(limit = 50, offset = 0) {
	const profiles = await NGO.findByVerificationStatus(NGO_VERIFICATION_STATUS.PENDING, limit, offset);
	return profiles;
}

async function getVerifiedNgos(limit = 50, offset = 0) {
	const profiles = await NGO.findByVerificationStatus(NGO_VERIFICATION_STATUS.VERIFIED, limit, offset);
	return profiles;
}

async function verifyNgoProfile(id) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}

	if (profile.verificationStatus !== NGO_VERIFICATION_STATUS.PENDING) {
		throw {
			statusCode: 400,
			message: 'Only pending profiles can be verified.'
		};
	}

	const updated = await NGO.updateVerificationStatus(id, NGO_VERIFICATION_STATUS.VERIFIED);
	return updated;
}

async function rejectNgoProfile(id) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}

	if (profile.verificationStatus !== NGO_VERIFICATION_STATUS.PENDING) {
		throw {
			statusCode: 400,
			message: 'Only pending profiles can be rejected.'
		};
	}

	const updated = await NGO.updateVerificationStatus(id, NGO_VERIFICATION_STATUS.REJECTED);
	return updated;
}

async function listAllNgos(limit = 50, offset = 0) {
	const profiles = await NGO.findAll(limit, offset);
	return profiles;
}

async function getNgoAnalytics(id) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}
	const analytics = await NGO.getNgoAnalytics(id);
	return analytics;
}

async function deleteNgoProfile(id, userId) {
	const profile = await NGO.findById(id);
	if (!profile) {
		throw {
			statusCode: 404,
			message: 'NGO profile not found.'
		};
	}

	if (profile.userId !== userId) {
		throw {
			statusCode: 403,
			message: 'Cannot delete other NGO profiles.'
		};
	}

	if (profile.verificationStatus === NGO_VERIFICATION_STATUS.VERIFIED) {
		throw {
			statusCode: 400,
			message: 'Cannot delete verified NGO profiles.'
		};
	}

	const deleted = await NGO.delete(id);
	return deleted;
}

module.exports = {
	createNgoProfile,
	getNgoProfile,
	getUserNgoProfile,
	updateNgoProfile,
	getPendingVerifications,
	getVerifiedNgos,
	verifyNgoProfile,
	rejectNgoProfile,
	listAllNgos,
	getNgoAnalytics,
	deleteNgoProfile
};
