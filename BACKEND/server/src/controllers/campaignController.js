const campaignService = require('../services/campaignService');
const likesModel = require('../models/likesModel');
const commentsModel = require('../models/commentsModel');

async function createCampaign(req, res, next) {
	try {
		const { title, description, category, targetAmount, ngoId, imageUrl } = req.body || {};

		if (!title || !description || !category || !targetAmount) {
			return res.status(400).json({ message: 'Missing required fields.' });
		}

		if (Number(targetAmount) <= 0) {
			return res.status(400).json({ message: 'Target amount must be greater than 0.' });
		}

		const campaign = await campaignService.createCampaign(
			{ title, description, category, targetAmount, ngoId, imageUrl },
			req.session.userId
		);

		return res.status(201).json({ message: 'Campaign created.', campaign });
	} catch (error) {
		next(error);
	}
}

async function listCampaigns(req, res, next) {
	try {
		const { status, category, search, ngoId, limit = 50, offset = 0 } = req.query;

		const filters = {};
		if (status) filters.status = status;
		if (category) filters.category = category;
		if (search) filters.search = search;
		if (ngoId) filters.ngoId = ngoId;

		const campaigns = await campaignService.listCampaigns(filters, Number(limit), Number(offset));
		return res.json({ campaigns, count: campaigns.length });
	} catch (error) {
		next(error);
	}
}

async function getCampaign(req, res, next) {
	try {
		const { id } = req.params;
		const campaign = await campaignService.getCampaignDetail(id);
		return res.json({ campaign });
	} catch (error) {
		next(error);
	}
}

async function updateCampaign(req, res, next) {
	try {
		const { id } = req.params;
		const { title, description, category, targetAmount, status, imageUrl, startDate, endDate } =
			req.body || {};

		const campaign = await campaignService.updateCampaign(
			id,
			{ title, description, category, targetAmount, status, imageUrl, startDate, endDate },
			req.session.userId,
			req.user?.role
		);

		return res.json({ message: 'Campaign updated.', campaign });
	} catch (error) {
		next(error);
	}
}

async function submitForApproval(req, res, next) {
	try {
		const { id } = req.params;
		const campaign = await campaignService.submitForApproval(id, req.session.userId);
		return res.json({ message: 'Campaign submitted for approval.', campaign });
	} catch (error) {
		next(error);
	}
}

async function approveCampaign(req, res, next) {
	try {
		const { id } = req.params;
		const campaign = await campaignService.approveCampaign(id);
		return res.json({ message: 'Campaign approved.', campaign });
	} catch (error) {
		next(error);
	}
}

async function rejectCampaign(req, res, next) {
	try {
		const { id } = req.params;
		const { reason } = req.body || {};
		const campaign = await campaignService.rejectCampaign(id, reason);
		return res.json({ message: 'Campaign rejected.', campaign });
	} catch (error) {
		next(error);
	}
}

async function deleteCampaign(req, res, next) {
	try {
		const { id } = req.params;
		await campaignService.deleteCampaign(id, req.session.userId, req.user?.role);
		return res.json({ message: 'Campaign deleted.' });
	} catch (error) {
		next(error);
	}
}

async function toggleLike(req, res, next) {
	try {
		const campaignId = Number(req.params.id);
		if (!campaignId) return res.status(400).json({ message: 'Invalid campaign ID.' });
		const result = await likesModel.toggleLike(campaignId, req.session.userId);
		return res.json(result);
	} catch (error) {
		next(error);
	}
}

async function getLikes(req, res, next) {
	try {
		const campaignId = Number(req.params.id);
		const likeCount = await likesModel.getLikeCount(campaignId);
		const liked = req.session.userId
			? await likesModel.hasUserLiked(campaignId, req.session.userId)
			: false;
		return res.json({ likeCount, liked });
	} catch (error) {
		next(error);
	}
}

async function addComment(req, res, next) {
	try {
		const campaignId = Number(req.params.id);
		const { text } = req.body || {};
		if (!text || !String(text).trim()) {
			return res.status(400).json({ message: 'Comment text is required.' });
		}
		if (String(text).trim().length > 1000) {
			return res.status(400).json({ message: 'Comment must be 1000 characters or fewer.' });
		}
		const comment = await commentsModel.addComment(campaignId, req.session.userId, text);
		return res.status(201).json({ comment });
	} catch (error) {
		next(error);
	}
}

async function getComments(req, res, next) {
	try {
		const campaignId = Number(req.params.id);
		const limit = Math.min(Number(req.query.limit || 20), 100);
		const offset = Number(req.query.offset || 0);
		const comments = await commentsModel.getComments(campaignId, limit, offset);
		return res.json({ comments });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createCampaign,
	listCampaigns,
	getCampaign,
	updateCampaign,
	submitForApproval,
	approveCampaign,
	rejectCampaign,
	deleteCampaign,
	toggleLike,
	getLikes,
	addComment,
	getComments
};
