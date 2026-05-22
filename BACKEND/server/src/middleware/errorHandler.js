function errorHandler(err, req, res, next) {
	console.error('[ERROR]', err);

	if (err.name === 'ValidationError') {
		return res.status(400).json({
			message: 'Validation error',
			errors: err.details || err.message
		});
	}

	if (err.status) {
		return res.status(err.status).json({
			message: err.message || 'An error occurred'
		});
	}

	if (err.code === 'ER_DUP_ENTRY') {
		return res.status(409).json({
			message: 'Duplicate entry. Email or unique field already exists.'
		});
	}

	if (err.code === 'ER_NO_REFERENCED_ROW') {
		return res.status(400).json({
			message: 'Invalid reference. Related record not found.'
		});
	}

	res.status(500).json({
		message: process.env.NODE_ENV === 'production'
			? 'An unexpected error occurred'
			: err.message || 'An unexpected error occurred'
	});
}

module.exports = errorHandler;
