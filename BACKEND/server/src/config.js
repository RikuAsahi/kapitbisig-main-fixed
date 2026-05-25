require('dotenv').config();

module.exports = {
	port: Number(process.env.PORT || 5001),
	nodeEnv: process.env.NODE_ENV || 'development',
	sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
	frontendOrigins: String(process.env.FRONTEND_ORIGINS || '')
		.split(',')
		.map(v => v.trim())
		.filter(Boolean),
	database: {
		host: process.env.DB_HOST || '127.0.0.1',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'kapitbisig_db',
		connectionLimit: 10,
		waitForConnections: true,
		queueLimit: 0
	}
};
