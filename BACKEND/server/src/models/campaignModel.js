const db = require('../database');
const { CAMPAIGN_STATUS } = require('../utils/constants');

function mapCampaign(row) {
	if (!row) return null;

	return {
		id: String(row.campaign_id),
		title: row.title,
		description: row.description,
		category: row.category,
		targetAmount: Number(row.target_amount),
		currentAmount: Number(row.current_amount) || 0,
		status: row.status,
		imageUrl: row.image_url,
		ngoId: String(row.ngo_id),
		ngoName: row.ngo_name || null,
		createdBy: String(row.created_by),
		rejectionReason: row.rejection_reason || null,
		startDate: row.start_date,
		endDate: row.end_date,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

async function createCampaignsTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS campaigns (
			campaign_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			title VARCHAR(255) NOT NULL,
			description LONGTEXT NOT NULL,
			category VARCHAR(50) NOT NULL,
			target_amount DECIMAL(12, 2) NOT NULL,
			current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
			status ENUM('draft', 'pending', 'active', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'draft',
			image_url VARCHAR(255),
			rejection_reason TEXT,
			ngo_id BIGINT UNSIGNED NOT NULL,
			created_by BIGINT UNSIGNED NOT NULL,
			start_date DATETIME,
			end_date DATETIME,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (campaign_id),
			FOREIGN KEY (ngo_id) REFERENCES ngo_profiles(ngo_id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
			INDEX idx_status (status),
			INDEX idx_ngo_id (ngo_id),
			INDEX idx_created_by (created_by)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
	// Add rejection_reason to existing tables that pre-date this column
	await db.query(`
		ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS rejection_reason TEXT AFTER image_url
	`).catch(() => {});
}

async function findById(id) {
	const [rows] = await db.query(
		`SELECT c.*, n.ngo_name
		 FROM campaigns c
		 LEFT JOIN ngo_profiles n ON n.ngo_id = c.ngo_id
		 WHERE c.campaign_id = ? AND (n.archived_at IS NULL OR n.ngo_id IS NULL) LIMIT 1`,
		[Number(id)]
	);
	return mapCampaign(rows[0]);
}

async function findByStatus(status, limit = 50, offset = 0) {
	const [rows] = await db.query(
		`SELECT c.*, n.ngo_name
		 FROM campaigns c
		 LEFT JOIN ngo_profiles n ON n.ngo_id = c.ngo_id
		 WHERE c.status = ? AND n.archived_at IS NULL
		 ORDER BY c.created_at DESC
		 LIMIT ? OFFSET ?`,
		[status, limit, offset]
	);
	return rows.map(mapCampaign);
}

async function findByNgoId(ngoId, limit = 50, offset = 0) {
	const [rows] = await db.query(
		`SELECT c.*, n.ngo_name
		 FROM campaigns c
		 LEFT JOIN ngo_profiles n ON n.ngo_id = c.ngo_id
		 WHERE c.ngo_id = ? AND n.archived_at IS NULL
		 ORDER BY c.created_at DESC
		 LIMIT ? OFFSET ?`,
		[Number(ngoId), limit, offset]
	);
	return rows.map(mapCampaign);
}

async function findAll(filters = {}, limit = 50, offset = 0) {
	let sql = `SELECT c.*, n.ngo_name
	           FROM campaigns c
	           LEFT JOIN ngo_profiles n ON n.ngo_id = c.ngo_id
	           WHERE 1=1`;
	const values = [];

	if (filters.status) {
		sql += ` AND c.status = ?`;
		values.push(filters.status);
	}

	sql += ` AND n.archived_at IS NULL`;

	if (filters.category) {
		sql += ` AND c.category = ?`;
		values.push(filters.category);
	}

	if (filters.ngoId) {
		sql += ` AND c.ngo_id = ?`;
		values.push(Number(filters.ngoId));
	}

	if (filters.search) {
		sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
		const searchTerm = `%${filters.search}%`;
		values.push(searchTerm, searchTerm);
	}

	sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
	values.push(limit, offset);

	const [rows] = await db.query(sql, values);
	return rows.map(mapCampaign);
}

async function create(data) {
	const [result] = await db.query(
		`INSERT INTO campaigns (title, description, category, target_amount, ngo_id, created_by, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			data.title,
			data.description,
			data.category,
			data.targetAmount,
			Number(data.ngoId),
			Number(data.createdBy),
			data.status || CAMPAIGN_STATUS.DRAFT
		]
	);
	return findById(result.insertId);
}

async function update(id, data) {
	const updates = [];
	const values = [];

	if (data.title !== undefined) {
		updates.push(`title = ?`);
		values.push(data.title);
	}
	if (data.description !== undefined) {
		updates.push(`description = ?`);
		values.push(data.description);
	}
	if (data.targetAmount !== undefined) {
		updates.push(`target_amount = ?`);
		values.push(data.targetAmount);
	}
	if (data.status !== undefined) {
		updates.push(`status = ?`);
		values.push(data.status);
	}
	if (data.imageUrl !== undefined) {
		updates.push(`image_url = ?`);
		values.push(data.imageUrl);
	}
	if (data.rejectionReason !== undefined) {
		updates.push(`rejection_reason = ?`);
		values.push(data.rejectionReason);
	}
	if (data.startDate !== undefined) {
		updates.push(`start_date = ?`);
		values.push(data.startDate);
	}
	if (data.endDate !== undefined) {
		updates.push(`end_date = ?`);
		values.push(data.endDate);
	}

	if (updates.length === 0) return findById(id);

	values.push(Number(id));
	const sql = `UPDATE campaigns SET ${updates.join(', ')} WHERE campaign_id = ?`;
	await db.query(sql, values);
	return findById(id);
}

async function updateAmount(id, amount) {
	await db.query(
		`UPDATE campaigns SET current_amount = current_amount + ? WHERE campaign_id = ?`,
		[amount, Number(id)]
	);
}

async function delete_(id) {
	const [result] = await db.query(`DELETE FROM campaigns WHERE campaign_id = ?`, [Number(id)]);
	return result.affectedRows > 0;
}

async function cancelByNgoId(ngoId) {
	const [result] = await db.query(
		`UPDATE campaigns
		 SET status = ?
		 WHERE ngo_id = ?
		   AND status IN (?, ?, ?)`,
		[
			CAMPAIGN_STATUS.CANCELLED,
			Number(ngoId),
			CAMPAIGN_STATUS.DRAFT,
			CAMPAIGN_STATUS.PENDING,
			CAMPAIGN_STATUS.ACTIVE
		]
	);
	return result.affectedRows;
}

module.exports = {
	createCampaignsTable,
	findById,
	findByStatus,
	findByNgoId,
	findAll,
	create,
	update,
	updateAmount,
	cancelByNgoId,
	delete: delete_
};
