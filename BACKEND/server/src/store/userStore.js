const mysql = require('mysql2/promise');

let pool;

async function getPool() {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.DB_HOST || '127.0.0.1',
			port: Number(process.env.DB_PORT || 3306),
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: process.env.DB_NAME || 'kapitbisig_db',
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		});
	}
	return pool;
}

function mapUser(row) {
	if (!row) return null;

	return {
		id: String(row.user_id),
		firstName: row.first_name || '',
		lastName: row.last_name || '',
		fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
		email: row.email,
		passwordHash: row.password_hash,
		role: row.role,
		createdAt: row.date_registered
	};
}

async function initStore() {
	// Schema created via SQL migrations in database/001_init_schema.sql
}

async function findByEmail(email) {
	const db = await getPool();
	const [rows] = await db.query(
		`SELECT user_id, first_name, last_name, email, password_hash, role, date_registered
		 FROM users
		 WHERE LOWER(email) = LOWER(?)
		 LIMIT 1`,
		[email]
	);
	return mapUser(rows[0]);
}

async function findById(id) {
	const db = await getPool();
	const [rows] = await db.query(
		`SELECT user_id, first_name, last_name, email, password_hash, role, date_registered
		 FROM users
		 WHERE user_id = ?
		 LIMIT 1`,
		[Number(id)]
	);
	return mapUser(rows[0]);
}

async function createLocalUser({ firstName, lastName, email, passwordHash }) {
	const db = await getPool();

	const [result] = await db.query(
		`INSERT INTO users (first_name, last_name, email, password_hash, role)
		 VALUES (?, ?, ?, ?, 'donor')`,
		[String(firstName || '').trim(), String(lastName || '').trim(), String(email || '').toLowerCase(), passwordHash]
	);

	return findById(result.insertId);
}

module.exports = {
	initStore,
	findByEmail,
	findById,
	createLocalUser
};
