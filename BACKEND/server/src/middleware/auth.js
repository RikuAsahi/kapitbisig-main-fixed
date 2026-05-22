const { findById } = require('../store/userStore');
const constants = require('../utils/constants');

async function authMiddleware(req, res, next) {
	try {
		if (!req.session || !req.session.userId) {
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		const user = await findById(req.session.userId);
		if (!user) {
			req.session.destroy(() => {});
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(500).json({ message: 'Unable to verify authentication.' });
	}
}

module.exports = authMiddleware;
