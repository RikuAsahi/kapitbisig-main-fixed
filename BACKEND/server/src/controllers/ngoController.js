const ngoService = require('../services/ngoService');
const NGO = require('../models/ngoModel');
const Campaign = require('../models/campaignModel');
const Donation = require('../models/donationModel');
const ActivityLog = require('../models/activityLogModel');

async function createNgoProfile(req, res, next) {
	try {
		const { name, registrationNumber, description, websiteUrl, phoneNumber, address, logoUrl } =
			req.body || {};

		if (!name || !registrationNumber) {
			return res.status(400).json({ message: 'Name and registration number are required.' });
		}

		const profile = await ngoService.createNgoProfile(
			{ name, registrationNumber, description, websiteUrl, phoneNumber, address, logoUrl },
			req.session.userId
		);

		return res.status(201).json({ message: 'NGO profile created.', profile });
	} catch (error) {
		next(error);
	}
}

async function getNgoProfile(req, res, next) {
	try {
		const { id } = req.params;
		const profile = await ngoService.getNgoProfile(id);
		return res.json({ profile });
	} catch (error) {
		next(error);
	}
}

async function getMyNgoProfile(req, res, next) {
	try {
		const profile = await ngoService.getUserNgoProfile(req.session.userId);
		return res.json({ profile });
	} catch (error) {
		next(error);
	}
}

async function updateNgoProfile(req, res, next) {
	try {
		const { id } = req.params;
		const { name, description, websiteUrl, phoneNumber, address, logoUrl } = req.body || {};

		const profile = await ngoService.updateNgoProfile(
			id,
			{ name, description, websiteUrl, phoneNumber, address, logoUrl },
			req.session.userId
		);

		return res.json({ message: 'NGO profile updated.', profile });
	} catch (error) {
		next(error);
	}
}

async function listNgos(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const profiles = await ngoService.listAllNgos(Number(limit), Number(offset));
		return res.json({ profiles, count: profiles.length });
	} catch (error) {
		next(error);
	}
}

async function getPendingVerifications(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const profiles = await ngoService.getPendingVerifications(Number(limit), Number(offset));
		return res.json({ profiles, count: profiles.length });
	} catch (error) {
		next(error);
	}
}

async function getVerifiedNgos(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const profiles = await ngoService.getVerifiedNgos(Number(limit), Number(offset));
		return res.json({ profiles, count: profiles.length });
	} catch (error) {
		next(error);
	}
}

async function verifyNgoProfile(req, res, next) {
	try {
		const { id } = req.params;
		const profile = await ngoService.verifyNgoProfile(id);
		return res.json({ message: 'NGO profile verified.', profile });
	} catch (error) {
		next(error);
	}
}

async function rejectNgoProfile(req, res, next) {
	try {
		const { id } = req.params;
		const profile = await ngoService.rejectNgoProfile(id);
		return res.json({ message: 'NGO profile rejected.', profile });
	} catch (error) {
		next(error);
	}
}

async function getNgoAnalytics(req, res, next) {
	try {
		const { id } = req.params;
		const analytics = await ngoService.getNgoAnalytics(id);
		return res.json({ analytics });
	} catch (error) {
		next(error);
	}
}

async function deleteNgoProfile(req, res, next) {
	try {
		const { id } = req.params;
		await ngoService.deleteNgoProfile(id, req.session.userId);
		return res.json({ message: 'NGO profile deleted.' });
	} catch (error) {
		next(error);
	}
}

async function getMyDonations(req, res, next) {
	try {
		const { status, paymentMethod, limit = 100, offset = 0 } = req.query;

		const ngoProfile = await NGO.findByUserId(req.session.userId);
		if (!ngoProfile) return res.status(404).json({ message: 'NGO profile not found.' });

		const campaigns = await Campaign.findByNgoId(ngoProfile.id, 200, 0);
		const campaignIds = campaigns.map((c) => Number(c.id));

		if (!campaignIds.length) return res.json({ donations: [], total: 0, count: 0 });

		const donations = await Donation.findByCampaignIds(campaignIds, {
			status: status || null,
			paymentMethod: paymentMethod || null,
			limit: Number(limit),
			offset: Number(offset)
		});

		return res.json({ donations, total: donations.length, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function reviewDonation(req, res, next) {
	try {
		const { id } = req.params;
		const { status } = req.body || {};

		if (!['completed', 'failed'].includes(status)) {
			return res.status(400).json({ message: 'Status must be "completed" or "failed".' });
		}

		const donation = await Donation.findById(id);
		if (!donation) return res.status(404).json({ message: 'Donation not found.' });
		if (donation.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending donations can be reviewed.' });
		}

		const ngoProfile = await NGO.findByUserId(req.session.userId);
		if (!ngoProfile) return res.status(403).json({ message: 'NGO profile not found.' });

		const campaigns = await Campaign.findByNgoId(ngoProfile.id, 200, 0);
		const ownsCampaign = campaigns.some((c) => String(c.id) === String(donation.campaignId));
		if (!ownsCampaign) {
			return res.status(403).json({ message: 'You can only review donations for your own campaigns.' });
		}

		const updated = await Donation.updateStatus(id, status);

		if (status === 'completed') {
			await Campaign.updateAmount(donation.campaignId, donation.amount);
		}

		ActivityLog.create({
			adminId: req.session.userId,
			action: status === 'completed' ? 'APPROVE' : 'REJECT',
			entityType: 'DONATION',
			entityId: String(id),
			description: `NGO ${status === 'completed' ? 'approved' : 'rejected'} bank transfer donation #${id} of ₱${donation.amount.toLocaleString()}`,
			ipAddress: req.ip || req.connection?.remoteAddress
		}).catch(() => {});

		return res.json({ message: `Donation marked as ${status}.`, donation: updated });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createNgoProfile,
	getNgoProfile,
	getMyNgoProfile,
	updateNgoProfile,
	listNgos,
	getPendingVerifications,
	getVerifiedNgos,
	verifyNgoProfile,
	rejectNgoProfile,
	getNgoAnalytics,
	deleteNgoProfile,
	getMyDonations,
	reviewDonation
};