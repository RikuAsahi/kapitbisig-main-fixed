const db = require('../database');

async function createCampaignCommentsTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS campaign_comments (
			comment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			user_id BIGINT UNSIGNED NOT NULL,
			text TEXT NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (comment_id),
			KEY idx_comments_campaign (campaign_id),
			KEY idx_comments_user (user_id),
			CONSTRAINT fk_comments_campaign
				FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
			CONSTRAINT fk_comments_user
				FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
}

async function addComment(campaignId, userId, text) {
	const [result] = await db.query(
		`INSERT INTO campaign_comments (campaign_id, user_id, text) VALUES (?, ?, ?)`,
		[Number(campaignId), Number(userId), String(text).trim()]
	);
	const [rows] = await db.query(
		`SELECT c.comment_id, c.text, c.created_at,
		        u.first_name, u.last_name
		 FROM campaign_comments c
		 JOIN users u ON u.user_id = c.user_id
		 WHERE c.comment_id = ?`,
		[result.insertId]
	);
	return mapComment(rows[0]);
}

async function getComments(campaignId, limit = 20, offset = 0) {
	const [rows] = await db.query(
		`SELECT c.comment_id, c.text, c.created_at,
		        u.first_name, u.last_name
		 FROM campaign_comments c
		 JOIN users u ON u.user_id = c.user_id
		 WHERE c.campaign_id = ?
		 ORDER BY c.created_at DESC
		 LIMIT ? OFFSET ?`,
		[Number(campaignId), Number(limit), Number(offset)]
	);
	return rows.map(mapComment);
}

function mapComment(row) {
	if (!row) return null;
	return {
		id: String(row.comment_id),
		text: row.text,
		authorName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Anonymous',
		createdAt: row.created_at
	};
}

module.exports = { createCampaignCommentsTable, addComment, getComments };
