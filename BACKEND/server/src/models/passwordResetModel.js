const crypto = require('crypto');
const db = require('../database');

async function createPasswordResetTokensTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			token_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			token VARCHAR(64) NOT NULL,
			expires_at DATETIME NOT NULL,
			used TINYINT(1) NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (token_id),
			UNIQUE KEY uq_token (token),
			KEY idx_prt_user_id (user_id),
			CONSTRAINT fk_prt_user
				FOREIGN KEY (user_id) REFERENCES users(user_id)
				ON UPDATE CASCADE ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
}

async function createToken(userId) {
	const token = crypto.randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
	await db.query(
		`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
		[Number(userId), token, expiresAt]
	);
	return token;
}

async function findValidToken(token) {
	const [rows] = await db.query(
		`SELECT token_id, user_id, expires_at
		 FROM password_reset_tokens
		 WHERE token = ? AND used = 0 AND expires_at > NOW()
		 LIMIT 1`,
		[String(token)]
	);
	return rows[0] || null;
}

async function markUsed(tokenId) {
	await db.query(
		`UPDATE password_reset_tokens SET used = 1 WHERE token_id = ?`,
		[Number(tokenId)]
	);
}

module.exports = { createPasswordResetTokensTable, createToken, findValidToken, markUsed };
