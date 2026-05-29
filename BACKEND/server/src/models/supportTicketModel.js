const db = require('../database');

function mapTicket(row) {
	if (!row) return null;
	return {
		id: row.ticket_id,
		ngoId: row.ngo_id,
		ngoName: row.ngo_name || '',
		ngoEmail: row.ngo_email || '',
		category: row.category,
		subject: row.subject,
		description: row.description,
		status: row.status,
		adminReply: row.admin_reply || '',
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

async function createTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS support_tickets (
			ticket_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			ngo_id BIGINT UNSIGNED NOT NULL,
			ngo_name VARCHAR(255) NOT NULL DEFAULT '',
			ngo_email VARCHAR(255) NOT NULL DEFAULT '',
			category VARCHAR(100) NOT NULL DEFAULT 'General',
			subject VARCHAR(255) NOT NULL,
			description TEXT NOT NULL,
			status ENUM('Open','In Progress','Resolved') NOT NULL DEFAULT 'Open',
			admin_reply TEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (ticket_id),
			INDEX idx_ngo (ngo_id),
			INDEX idx_status (status)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
}

async function createTicket({ ngoId, ngoName, ngoEmail, category, subject, description }) {
	const [result] = await db.query(
		`INSERT INTO support_tickets (ngo_id, ngo_name, ngo_email, category, subject, description)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		[ngoId, ngoName || '', ngoEmail || '', category || 'General', subject, description]
	);
	const [rows] = await db.query('SELECT * FROM support_tickets WHERE ticket_id = ?', [result.insertId]);
	return mapTicket(rows[0]);
}

async function getAllTickets({ status, limit = 100, offset = 0 } = {}) {
	let sql = 'SELECT * FROM support_tickets';
	const params = [];
	if (status) { sql += ' WHERE status = ?'; params.push(status); }
	sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
	params.push(Number(limit), Number(offset));
	const [rows] = await db.query(sql, params);
	return rows.map(mapTicket);
}

async function getTicketsByNgo(ngoId, { limit = 50, offset = 0 } = {}) {
	const [rows] = await db.query(
		'SELECT * FROM support_tickets WHERE ngo_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
		[ngoId, Number(limit), Number(offset)]
	);
	return rows.map(mapTicket);
}

async function updateTicket(ticketId, { status, adminReply }) {
	const fields = [];
	const params = [];
	if (status !== undefined) { fields.push('status = ?'); params.push(status); }
	if (adminReply !== undefined) { fields.push('admin_reply = ?'); params.push(adminReply); }
	if (!fields.length) return null;
	params.push(ticketId);
	await db.query(`UPDATE support_tickets SET ${fields.join(', ')} WHERE ticket_id = ?`, params);
	const [rows] = await db.query('SELECT * FROM support_tickets WHERE ticket_id = ?', [ticketId]);
	return mapTicket(rows[0]);
}

module.exports = { createTable, createTicket, getAllTickets, getTicketsByNgo, updateTicket };