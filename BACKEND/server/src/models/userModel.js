const db = require('../database');

function mapUser(row) {
	if (!row) return null;

	let notificationPrefs = null;
	if (row.notification_prefs) {
		try { notificationPrefs = JSON.parse(row.notification_prefs); } catch (_) {}
	}

	return {
		id: String(row.user_id),
		firstName: row.first_name || '',
		lastName: row.last_name || '',
		fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
		email: row.email,
		passwordHash: row.password_hash,
		role: row.role,
		avatarUrl: row.avatar_url || null,
		coverUrl: row.cover_url || null,
		notificationPrefs,
		createdAt: row.date_registered
	};
}

async function createUsersTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS users (
			user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			email VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role ENUM('donor', 'ngo', 'admin', 'superadmin') NOT NULL DEFAULT 'donor',
			avatar_url MEDIUMTEXT,
			cover_url MEDIUMTEXT,
			notification_prefs TEXT,
			date_registered DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id),
			UNIQUE KEY uq_email (email),
			INDEX idx_role (role)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
	// Migrate existing tables that pre-date these columns
	await Promise.all([
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url MEDIUMTEXT AFTER role`).catch(() => {}),
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url MEDIUMTEXT AFTER avatar_url`).catch(() => {}),
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs TEXT AFTER cover_url`).catch(() => {})
	]);
}


async function findByEmail(email) {
	console.log('[DEBUG] userModel.findByEmail called with:', email);
	const [rows] = await db.query(
		`SELECT user_id, first_name, last_name, email, password_hash, role, avatar_url, cover_url, notification_prefs, date_registered
		 FROM users
		 WHERE LOWER(email) = LOWER(?)
		 LIMIT 1`,
		[email]
	);
	return mapUser(rows[0]);
}

async function findById(id) {
	const [rows] = await db.query(
		`SELECT user_id, first_name, last_name, email, password_hash, role, avatar_url, cover_url, notification_prefs, date_registered
		 FROM users
		 WHERE user_id = ?
		 LIMIT 1`,
		[Number(id)]
	);
	return mapUser(rows[0]);
}

async function createUser({ firstName, lastName, email, passwordHash }) {
	const [result] = await db.query(
		`INSERT INTO users (first_name, last_name, email, password_hash, role)
		 VALUES (?, ?, ?, ?, 'donor')`,
		[String(firstName || '').trim(), String(lastName || '').trim(), String(email || '').toLowerCase(), passwordHash]
	);
	return findById(result.insertId);
}

async function findAll(limit = 50, offset = 0) {
	const [rows] = await db.query(
		`SELECT user_id, first_name, last_name, email, password_hash, role, avatar_url, cover_url, notification_prefs, date_registered
		 FROM users
		 ORDER BY date_registered DESC
		 LIMIT ? OFFSET ?`,
		[limit, offset]
	);
	return rows.map(mapUser);
}

async function updateRole(id, newRole) {
	await db.query(
		`UPDATE users SET role = ? WHERE user_id = ?`,
		[newRole, Number(id)]
	);
	return findById(id);
}

async function updatePassword(id, passwordHash) {
	await db.query(
		`UPDATE users SET password_hash = ? WHERE user_id = ?`,
		[passwordHash, Number(id)]
	);
}

async function updateProfile(id, { firstName, lastName, avatarUrl, coverUrl, notificationPrefs }) {
	const updates = [];
	const values = [];

	if (firstName !== undefined) { updates.push('first_name = ?'); values.push(String(firstName || '').trim()); }
	if (lastName !== undefined)  { updates.push('last_name = ?');  values.push(String(lastName  || '').trim()); }
	if (avatarUrl !== undefined) { updates.push('avatar_url = ?'); values.push(avatarUrl); }
	if (coverUrl !== undefined)  { updates.push('cover_url = ?');  values.push(coverUrl); }
	if (notificationPrefs !== undefined) {
		updates.push('notification_prefs = ?');
		values.push(notificationPrefs !== null ? JSON.stringify(notificationPrefs) : null);
	}

	if (updates.length === 0) return findById(id);

	values.push(Number(id));
	await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
	return findById(id);
}

async function delete_(id) {
	const [result] = await db.query(`DELETE FROM users WHERE user_id = ?`, [Number(id)]);
	return result.affectedRows > 0;
}

module.exports = {
	createUsersTable,
	findByEmail,
	findById,
	findAll,
	createUser,
	updateRole,
	updatePassword,
	updateProfile,
	delete: delete_
};
