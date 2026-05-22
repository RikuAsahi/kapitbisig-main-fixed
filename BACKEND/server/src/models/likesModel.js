const db = require('../database');

async function createCampaignLikesTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS campaign_likes (
			like_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			user_id BIGINT UNSIGNED NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (like_id),
			UNIQUE KEY uq_like (campaign_id, user_id),
			KEY idx_likes_campaign (campaign_id),
			KEY idx_likes_user (user_id),
			CONSTRAINT fk_likes_campaign
				FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
			CONSTRAINT fk_likes_user
				FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);
}

async function getLikeCount(campaignId) {
	const [rows] = await db.query(
		`SELECT COUNT(*) AS cnt FROM campaign_likes WHERE campaign_id = ?`,
		[Number(campaignId)]
	);
	return Number(rows[0]?.cnt || 0);
}

async function hasUserLiked(campaignId, userId) {
	const [rows] = await db.query(
		`SELECT 1 FROM campaign_likes WHERE campaign_id = ? AND user_id = ? LIMIT 1`,
		[Number(campaignId), Number(userId)]
	);
	return rows.length > 0;
}

async function toggleLike(campaignId, userId) {
	const already = await hasUserLiked(campaignId, userId);
	if (already) {
		await db.query(
			`DELETE FROM campaign_likes WHERE campaign_id = ? AND user_id = ?`,
			[Number(campaignId), Number(userId)]
		);
	} else {
		await db.query(
			`INSERT INTO campaign_likes (campaign_id, user_id) VALUES (?, ?)`,
			[Number(campaignId), Number(userId)]
		);
	}
	const likeCount = await getLikeCount(campaignId);
	return { liked: !already, likeCount };
}

module.exports = { createCampaignLikesTable, getLikeCount, hasUserLiked, toggleLike };
