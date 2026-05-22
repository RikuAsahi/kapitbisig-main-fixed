const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(String(email).trim());
};

const validatePassword = (password) => {
	return String(password).length >= 8;
};

const validateStrongPassword = (password) => {
	const minLength = String(password).length >= 8;
	const hasUpperCase = /[A-Z]/.test(password);
	const hasNumbers = /[0-9]/.test(password);
	const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
	return minLength && hasUpperCase && hasNumbers && hasSpecialChars;
};

const validateAmount = (amount) => {
	const num = Number(amount);
	return !isNaN(num) && num > 0;
};

const validatePhoneNumber = (phone) => {
	const phoneRegex = /^[0-9]{10,15}$/;
	return phoneRegex.test(String(phone).replace(/\D/g, ''));
};

const sanitizeString = (str) => {
	return String(str).trim().replace(/[<>]/g, '');
};

const validateRequiredFields = (obj, fields) => {
	const missing = [];
	fields.forEach(field => {
		if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
			missing.push(field);
		}
	});
	return {
		isValid: missing.length === 0,
		missingFields: missing
	};
};

module.exports = {
	validateEmail,
	validatePassword,
	validateStrongPassword,
	validateAmount,
	validatePhoneNumber,
	sanitizeString,
	validateRequiredFields
};
