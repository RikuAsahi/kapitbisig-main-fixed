const Donation = require('../models/donationModel');
const Campaign = require('../models/campaignModel');
const { validateAmount } = require('../utils/validators');

async function createDonation(data, donorId) {
	if (!data.campaignId || !data.amount || !data.paymentMethod) {
		throw {
			statusCode: 400,
			message: 'Missing required fields.'
		};
	}

	if (!validateAmount(data.amount)) {
		throw {
			statusCode: 400,
			message: 'Invalid amount.'
		};
	}

	const campaign = await Campaign.findById(data.campaignId);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	const donation = await Donation.create({
		campaignId: data.campaignId,
		donorId,
		amount: Number(data.amount),
		paymentMethod: data.paymentMethod,
		message: data.message || null
	});

	return donation;
}

async function getDonationDetail(id, userId) {
	const donation = await Donation.findById(id);
	if (!donation) {
		throw {
			statusCode: 404,
			message: 'Donation not found.'
		};
	}

	if (donation.donorId !== userId) {
		throw {
			statusCode: 403,
			message: 'Cannot view other user donations.'
		};
	}

	return donation;
}

async function getDonationsByCampaign(campaignId, limit = 100, offset = 0) {
	const donations = await Donation.findByCampaignId(campaignId, limit, offset);
	return donations;
}

async function getDonationsByDonor(donorId, limit = 50, offset = 0) {
	const donations = await Donation.findByDonorId(donorId, limit, offset);
	return donations;
}

async function processDonation(id, paymentResult) {
	const donation = await Donation.findById(id);
	if (!donation) {
		throw {
			statusCode: 404,
			message: 'Donation not found.'
		};
	}

	if (paymentResult.success) {
		const updated = await Donation.updateStatus(id, 'completed', paymentResult.transactionRef);
		await Campaign.updateAmount(donation.campaignId, donation.amount);
		return updated;
	}

	const updated = await Donation.updateStatus(id, 'failed');
	return updated;
}

async function refundDonation(id) {
	const donation = await Donation.findById(id);
	if (!donation) {
		throw {
			statusCode: 404,
			message: 'Donation not found.'
		};
	}

	if (donation.status !== 'completed') {
		throw {
			statusCode: 400,
			message: 'Only completed donations can be refunded.'
		};
	}

	const updated = await Donation.updateStatus(id, 'refunded');
	await Campaign.updateAmount(donation.campaignId, -donation.amount);
	return updated;
}

async function getCampaignDonationStats(campaignId) {
	const stats = await Donation.getCampaignStats(campaignId);
	return stats;
}

module.exports = {
	createDonation,
	getDonationDetail,
	getDonationsByCampaign,
	getDonationsByDonor,
	processDonation,
	refundDonation,
	getCampaignDonationStats
};
