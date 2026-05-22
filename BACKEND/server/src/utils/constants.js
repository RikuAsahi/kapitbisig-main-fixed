exports.ROLES = {
	DONOR: 'donor',
	NGO_ADMIN: 'ngo_admin',
	ADMIN: 'admin',
	SUPERADMIN: 'superadmin'
};

exports.CAMPAIGN_STATUS = {
	DRAFT: 'draft',
	PENDING: 'pending',
	ACTIVE: 'active',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled',
	REJECTED: 'rejected'
};

exports.CAMPAIGN_CATEGORY = {
	EDUCATION: 'education',
	HEALTH: 'health',
	NATURAL_DISASTER: 'natural_disaster',
	COMMUNITY: 'community'
};

exports.NGO_VERIFICATION_STATUS = {
	PENDING: 'pending',
	VERIFIED: 'verified',
	REJECTED: 'rejected',
	SUSPENDED: 'suspended'
};

exports.DONATION_STATUS = {
	PENDING: 'pending',
	COMPLETED: 'completed',
	FAILED: 'failed',
	REFUNDED: 'refunded'
};

exports.TRANSACTION_STATUS = {
	PENDING: 'pending',
	SUCCESS: 'success',
	FAILED: 'failed',
	REFUNDED: 'refunded'
};

exports.PAYMENT_METHODS = {
	GCASH: 'gcash',
	MAYA: 'maya',
	CARD: 'card',
	BANK_TRANSFER: 'bank_transfer'
};

exports.ADMIN_ROLES = [exports.ROLES.ADMIN, exports.ROLES.SUPERADMIN];
exports.NGO_ROLES = [exports.ROLES.NGO_ADMIN];

exports.PERMISSION_MATRIX = {
	[exports.ROLES.SUPERADMIN]: ['all'],
	[exports.ROLES.ADMIN]: [
		'view_campaigns',
		'approve_campaigns',
		'reject_campaigns',
		'view_users',
		'create_users',
		'view_ngos',
		'verify_ngos',
		'view_donations',
		'process_refunds',
		'view_analytics',
		'view_activity_logs'
	],
	[exports.ROLES.NGO_ADMIN]: [
		'create_campaigns',
		'edit_own_campaigns',
		'submit_campaigns',
		'view_own_donations',
		'view_own_analytics',
		'edit_profile'
	],
	[exports.ROLES.DONOR]: [
		'view_campaigns',
		'make_donations',
		'view_own_donations',
		'edit_profile'
	]
};

exports.ERROR_MESSAGES = {
	UNAUTHORIZED: 'Not authorized to perform this action',
	NOT_AUTHENTICATED: 'Not authenticated. Please log in.',
	INVALID_CREDENTIALS: 'Invalid email or password.',
	EMAIL_ALREADY_EXISTS: 'Email already registered.',
	USER_NOT_FOUND: 'User not found.',
	CAMPAIGN_NOT_FOUND: 'Campaign not found.',
	INVALID_ROLE: 'Invalid user role.',
	INVALID_STATUS: 'Invalid status.',
	INSUFFICIENT_FUNDS: 'Insufficient donation amount.',
	CAMPAIGN_INACTIVE: 'Campaign is not active.'
};
