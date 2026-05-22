const donationService = require('../services/donationService');

async function createDonation(req, res, next) {
	try {
		const { campaignId, amount, paymentMethod, message } = req.body || {};

		const donation = await donationService.createDonation(
			{ campaignId, amount, paymentMethod, message },
			req.session.userId
		);

		return res.status(201).json({ message: 'Donation created.', donation });
	} catch (error) {
		next(error);
	}
}

async function getDonation(req, res, next) {
	try {
		const { id } = req.params;
		const donation = await donationService.getDonationDetail(id, req.session.userId);
		return res.json({ donation });
	} catch (error) {
		next(error);
	}
}

async function getCampaignDonations(req, res, next) {
	try {
		const { campaignId } = req.params;
		const { limit = 100, offset = 0 } = req.query;

		const donations = await donationService.getDonationsByCampaign(
			campaignId,
			Number(limit),
			Number(offset)
		);

		return res.json({ donations, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function getMyDonations(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;

		const donations = await donationService.getDonationsByDonor(
			req.session.userId,
			Number(limit),
			Number(offset)
		);

		return res.json({ donations, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function getCampaignStats(req, res, next) {
	try {
		const { campaignId } = req.params;
		const stats = await donationService.getCampaignDonationStats(campaignId);
		return res.json({ stats });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createDonation,
	getDonation,
	getCampaignDonations,
	getMyDonations,
	getCampaignStats
};
