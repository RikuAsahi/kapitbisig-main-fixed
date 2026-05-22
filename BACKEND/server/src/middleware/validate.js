const { validateRequiredFields } = require('../utils/validators');

function validateRequest(requiredFields) {
	return (req, res, next) => {
		const bodyToValidate = req.body || {};
		const validation = validateRequiredFields(bodyToValidate, requiredFields);

		if (!validation.isValid) {
			return res.status(400).json({
				message: `Missing required fields: ${validation.missingFields.join(', ')}`
			});
		}

		next();
	};
}

module.exports = validateRequest;
