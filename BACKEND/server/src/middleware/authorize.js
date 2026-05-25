const constants = require('../utils/constants');

function authorizeRoles(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		const normalizedAllowedRoles = allowedRoles.flat().map(constants.normalizeRole);
		const userRole = constants.normalizeRole(req.user.role);

		if (!normalizedAllowedRoles.includes(userRole)) {
			return res.status(403).json({ message: constants.ERROR_MESSAGES.UNAUTHORIZED });
		}

		next();
	};
}

function authorizePermission(requiredPermission) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: constants.ERROR_MESSAGES.NOT_AUTHENTICATED });
		}

		const userRole = constants.normalizeRole(req.user.role);
		const userPermissions = constants.PERMISSION_MATRIX[userRole] || constants.PERMISSION_MATRIX[req.user.role] || [];
		const hasPermission = userPermissions.includes('all') || userPermissions.includes(requiredPermission);

		if (!hasPermission) {
			return res.status(403).json({ message: constants.ERROR_MESSAGES.UNAUTHORIZED });
		}

		next();
	};
}

module.exports = {
	authorizeRoles,
	authorizePermission
};
