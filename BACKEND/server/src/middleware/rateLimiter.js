const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // limit each IP to 5 requests per windowMs
	message: 'Too many login attempts, please try again later.',
	skipSuccessfulRequests: true // Don't count successful requests
});

const donationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 50, // limit each IP to 50 donations per hour
	message: 'Too many donations from this IP, please try again later.'
});

module.exports = {
	limiter,
	authLimiter,
	donationLimiter
};
