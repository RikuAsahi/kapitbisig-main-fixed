const ngoService = require('../services/ngoService');

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
	deleteNgoProfile
};
