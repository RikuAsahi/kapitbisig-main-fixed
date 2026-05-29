const db = require('../database');
const constants = require('../utils/constants');

const VALID_ROLES = [
	constants.ROLES.DONOR,
	constants.ROLES.NGO_ADMIN,
	constants.ROLES.ADMIN,
	constants.ROLES.SUPERADMIN
];

function normalizeRole(role) {
	return constants.normalizeRole(role);
}

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
		role: normalizeRole(row.role || (row.has_ngo_profile ? constants.ROLES.NGO_ADMIN : constants.ROLES.DONOR)),
		avatarUrl: row.avatar_url || null,
		coverUrl: row.cover_url || null,
		notificationPrefs,
		createdAt: row.date_registered,
		deletedAt: row.deleted_at || null
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
			role ENUM('donor', 'ngo_admin', 'admin', 'superadmin') NOT NULL DEFAULT 'donor',
			avatar_url MEDIUMTEXT,
			cover_url MEDIUMTEXT,
			notification_prefs TEXT,
			deleted_at DATETIME,
			deleted_by BIGINT UNSIGNED,
			deleted_reason VARCHAR(255),
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
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs TEXT AFTER cover_url`).catch(() => {}),
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER notification_prefs`).catch(() => {}),
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by BIGINT UNSIGNED NULL AFTER deleted_at`).catch(() => {}),
		db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(255) NULL AFTER deleted_by`).catch(() => {}),
		db.query(`ALTER TABLE users ADD INDEX idx_deleted_at (deleted_at)`).catch(() => {})
	]);

	await migrateRoleEnum();
}

async function migrateRoleEnum() {
	await db.query(
		`ALTER TABLE users
		 MODIFY COLUMN role ENUM('donor', 'ngo', 'ngo_admin', 'admin', 'superadmin') NOT NULL DEFAULT 'donor'`
	).catch(() => {});

	await db.query(`UPDATE users SET role = 'ngo_admin' WHERE role = 'ngo'`).catch(() => {});
	await db.query(
		`UPDATE users u
		 INNER JOIN ngo_profiles n ON n.user_id = u.user_id
		 SET u.role = 'ngo_admin'
		 WHERE u.role = ''`
	).catch(() => {});

	await db.query(
		`ALTER TABLE users
		 MODIFY COLUMN role ENUM('donor', 'ngo_admin', 'admin', 'superadmin') NOT NULL DEFAULT 'donor'`
	).catch(() => {});
}


async function findByEmail(email, { includeArchived = false } = {}) {
	console.log('[DEBUG] userModel.findByEmail called with:', email);
	let sql = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.role,
	        u.avatar_url, u.cover_url, u.notification_prefs, u.deleted_at, u.date_registered,
	        EXISTS (SELECT 1 FROM ngo_profiles n WHERE n.user_id = u.user_id) AS has_ngo_profile
	 FROM users u
	 WHERE LOWER(u.email) = LOWER(?)`;
	if (!includeArchived) {
		sql += ` AND u.deleted_at IS NULL`;
	}
	sql += ` LIMIT 1`;

	const [rows] = await db.query(
		sql,
		[email]
	);
	return mapUser(rows[0]);
}

async function findById(id) {
	const [rows] = await db.query(
		`SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.role,
		        u.avatar_url, u.cover_url, u.notification_prefs, u.deleted_at, u.date_registered,
		        EXISTS (SELECT 1 FROM ngo_profiles n WHERE n.user_id = u.user_id) AS has_ngo_profile
		 FROM users u
		 WHERE u.user_id = ? AND u.deleted_at IS NULL
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
		`SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.role,
		        u.avatar_url, u.cover_url, u.notification_prefs, u.deleted_at, u.date_registered,
		        EXISTS (SELECT 1 FROM ngo_profiles n WHERE n.user_id = u.user_id) AS has_ngo_profile
		 FROM users u
		 WHERE u.deleted_at IS NULL
		 ORDER BY u.date_registered DESC
		 LIMIT ? OFFSET ?`,
		[limit, offset]
	);
	return rows.map(mapUser);
}

async function updateRole(id, newRole) {
	const role = normalizeRole(newRole);
	if (!VALID_ROLES.includes(role)) {
		throw {
			statusCode: 400,
			message: constants.ERROR_MESSAGES.INVALID_ROLE
		};
	}

	await db.query(
		`UPDATE users SET role = ? WHERE user_id = ? AND deleted_at IS NULL`,
		[role, Number(id)]
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
	await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ? AND deleted_at IS NULL`, values);
	return findById(id);
}

async function archive(id, { deletedBy = null, reason = 'Archived by administrator' } = {}) {
	const [result] = await db.query(
		`UPDATE users
		 SET deleted_at = NOW(), deleted_by = ?, deleted_reason = ?
		 WHERE user_id = ? AND deleted_at IS NULL`,
		[deletedBy ? Number(deletedBy) : null, reason, Number(id)]
	);
	return result.affectedRows > 0;
}

async function countActiveByRole(role) {
	const [rows] = await db.query(
		`SELECT COUNT(*) AS total
		 FROM users
		 WHERE role = ? AND deleted_at IS NULL`,
		[normalizeRole(role)]
	);
	return Number(rows[0]?.total || 0);
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
	archive,
	countActiveByRole,
	delete: delete_
};
