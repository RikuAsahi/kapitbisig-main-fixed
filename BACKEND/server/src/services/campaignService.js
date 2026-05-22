const Campaign = require('../models/campaignModel');
const NGO = require('../models/ngoModel');
const User = require('../models/userModel');
const { validateRequiredFields, sanitizeString } = require('../utils/validators');
const { CAMPAIGN_STATUS } = require('../utils/constants');
const { sendCampaignRejectionEmail, sendNewSubmissionNotificationEmail } = require('./emailService');

async function createCampaign(data, userId) {
	validateRequiredFields(data, ['title', 'description', 'category', 'targetAmount']);

	const campaign = await Campaign.create({
		title: sanitizeString(data.title),
		description: sanitizeString(data.description),
		category: data.category,
		targetAmount: Number(data.targetAmount),
		ngoId: data.ngoId,
		createdBy: userId,
		status: CAMPAIGN_STATUS.DRAFT
	});

	return campaign;
}

async function getCampaignDetail(id) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}
	return campaign;
}

async function listCampaigns(filters = {}, limit = 50, offset = 0) {
	const campaigns = await Campaign.findAll(filters, limit, offset);
	return campaigns;
}

async function updateCampaign(id, data, userId) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	if (campaign.createdBy !== userId && campaign.status !== CAMPAIGN_STATUS.DRAFT) {
		throw {
			statusCode: 403,
			message: 'Only the campaign creator can edit non-draft campaigns.'
		};
	}

	const updates = {};
	if (data.title) updates.title = sanitizeString(data.title);
	if (data.description) updates.description = sanitizeString(data.description);
	if (data.targetAmount) updates.targetAmount = Number(data.targetAmount);
	if (data.status) updates.status = data.status;
	if (data.imageUrl) updates.imageUrl = data.imageUrl;
	if (data.startDate) updates.startDate = data.startDate;
	if (data.endDate) updates.endDate = data.endDate;

	const updated = await Campaign.update(id, updates);
	return updated;
}

async function approveCampaign(id) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	if (campaign.status !== CAMPAIGN_STATUS.PENDING) {
		throw {
			statusCode: 400,
			message: 'Only pending campaigns can be approved.'
		};
	}

	const updated = await Campaign.update(id, { status: CAMPAIGN_STATUS.ACTIVE });
	return updated;
}

async function rejectCampaign(id, reason = null) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	if (campaign.status !== CAMPAIGN_STATUS.PENDING) {
		throw {
			statusCode: 400,
			message: 'Only pending campaigns can be rejected.'
		};
	}

	const updated = await Campaign.update(id, {
		status: CAMPAIGN_STATUS.REJECTED,
		rejectionReason: reason || null
	});

	// Send rejection email — non-blocking, errors are logged not thrown
	try {
		const ngo = await NGO.findById(campaign.ngoId);
		if (ngo) {
			const user = await User.findById(ngo.userId);
			if (user && user.email) {
				await sendCampaignRejectionEmail({
					toEmail: user.email,
					toName: ngo.name,
					campaignTitle: campaign.title,
					reason: reason || null
				});
			}
		}
	} catch (emailErr) {
		console.error('[campaign] Rejection email lookup failed:', emailErr.message);
	}

	return updated;
}

async function submitForApproval(id, userId) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	if (campaign.createdBy !== userId) {
		throw {
			statusCode: 403,
			message: 'Only the campaign creator can submit for approval.'
		};
	}

	if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
		throw {
			statusCode: 400,
			message: 'Only draft campaigns can be submitted for approval.'
		};
	}

	const updated = await Campaign.update(id, { status: CAMPAIGN_STATUS.PENDING });

	// Notify admin — non-blocking
	try {
		const ngo = await NGO.findById(campaign.ngoId);
		await sendNewSubmissionNotificationEmail({
			campaignTitle: campaign.title,
			ngoName: ngo ? ngo.name : `NGO #${campaign.ngoId}`
		});
	} catch (notifyErr) {
		console.error('[campaign] Submission notification failed:', notifyErr.message);
	}

	return updated;
}

async function deleteCampaign(id, userId) {
	const campaign = await Campaign.findById(id);
	if (!campaign) {
		throw {
			statusCode: 404,
			message: 'Campaign not found.'
		};
	}

	if (campaign.createdBy !== userId) {
		throw {
			statusCode: 403,
			message: 'Only the campaign creator can delete.'
		};
	}

	if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
		throw {
			statusCode: 400,
			message: 'Only draft campaigns can be deleted.'
		};
	}

	const deleted = await Campaign.delete(id);
	return deleted;
}

module.exports = {
	createCampaign,
	getCampaignDetail,
	listCampaigns,
	updateCampaign,
	approveCampaign,
	rejectCampaign,
	submitForApproval,
	deleteCampaign
};
