const db = require('../database');
const { PAYMENT_METHODS } = require('../utils/constants');

function mapDonation(row) {
	if (!row) return null;

	return {
		id: String(row.donation_id),
		campaignId: String(row.campaign_id),
		donorId: String(row.donor_id),
		amount: Number(row.amount),
		paymentMethod: row.payment_method,
		status: row.status,
		transactionRef: row.transaction_ref,
		message: row.message,
		createdAt: row.created_at
	};
}

async function createDonationsTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS donations (
			donation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			donor_id BIGINT UNSIGNED NOT NULL,
			amount DECIMAL(12, 2) NOT NULL,
			payment_method ENUM('gcash', 'paymaya', 'card', 'bank_transfer') NOT NULL,
			status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
			transaction_ref VARCHAR(100),
			message TEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (donation_id),
			FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
			FOREIGN KEY (donor_id) REFERENCES users(user_id) ON DELETE CASCADE,
			INDEX idx_campaign_id (campaign_id),
			INDEX idx_donor_id (donor_id),
			INDEX idx_status (status)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
}

async function findById(id) {
	const [rows] = await db.query(
		`SELECT * FROM donations WHERE donation_id = ? LIMIT 1`,
		[Number(id)]
	);
	return mapDonation(rows[0]);
}

async function findByCampaignId(campaignId, limit = 100, offset = 0) {
	const [rows] = await db.query(
		`SELECT * FROM donations
		 WHERE campaign_id = ?
		 ORDER BY created_at DESC
		 LIMIT ? OFFSET ?`,
		[Number(campaignId), limit, offset]
	);
	return rows.map(mapDonation);
}

async function findByDonorId(donorId, limit = 50, offset = 0) {
	const [rows] = await db.query(
		`SELECT * FROM donations
		 WHERE donor_id = ?
		 ORDER BY created_at DESC
		 LIMIT ? OFFSET ?`,
		[Number(donorId), limit, offset]
	);
	return rows.map(mapDonation);
}

async function create(data) {
	const [result] = await db.query(
		`INSERT INTO donations (campaign_id, donor_id, amount, payment_method, status, message)
		 VALUES (?, ?, ?, ?, 'pending', ?)`,
		[
			Number(data.campaignId),
			Number(data.donorId),
			data.amount,
			data.paymentMethod,
			data.message || null
		]
	);
	return findById(result.insertId);
}

async function updateStatus(id, status, transactionRef = null) {
	const updates = [`status = ?`];
	const values = [status];

	if (transactionRef) {
		updates.push(`transaction_ref = ?`);
		values.push(transactionRef);
	}

	values.push(Number(id));
	const sql = `UPDATE donations SET ${updates.join(', ')} WHERE donation_id = ?`;
	await db.query(sql, values);
	return findById(id);
}

async function getCampaignStats(campaignId) {
	const [rows] = await db.query(
		`SELECT COUNT(*) as total_donations, SUM(amount) as total_amount
		 FROM donations
		 WHERE campaign_id = ? AND status = 'completed'`,
		[Number(campaignId)]
	);

	return {
		totalDonations: rows[0]?.total_donations || 0,
		totalAmount: Number(rows[0]?.total_amount) || 0
	};
}

async function delete_(id) {
	const [result] = await db.query(`DELETE FROM donations WHERE donation_id = ?`, [Number(id)]);
	return result.affectedRows > 0;
}

module.exports = {
	createDonationsTable,
	findById,
	findByCampaignId,
	findByDonorId,
	create,
	updateStatus,
	getCampaignStats,
	delete: delete_
};
