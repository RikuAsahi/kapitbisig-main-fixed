const db = require('../database');

const DEFAULTS = {
	payment_gcash_enabled: 'false',
	payment_paymaya_enabled: 'false',
	payment_card_enabled: 'false',
	payment_bank_transfer_enabled: 'true',
	payment_bank_name: '',
	payment_bank_account_number: '',
	payment_bank_account_name: '',
	payment_bank_instructions: 'Transfer the exact donation amount to the bank account above, then upload a screenshot of your transaction receipt as proof.',
	payment_gcash_number: '',
	payment_gcash_name: '',
	payment_gcash_instructions: 'Send the exact donation amount to the GCash number above, then upload a screenshot of your transaction receipt as proof.'
};

async function createSystemSettingsTable() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS system_settings (
			setting_key VARCHAR(100) NOT NULL,
			setting_value TEXT,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (setting_key)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
	`);

	for (const [key, value] of Object.entries(DEFAULTS)) {
		await db.query(
			`INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
			[key, value]
		);
	}
}

async function getAll() {
	const [rows] = await db.query(`SELECT setting_key, setting_value FROM system_settings`);
	const result = {};
	rows.forEach((r) => { result[r.setting_key] = r.setting_value; });
	return result;
}

async function setMany(pairs) {
	for (const [key, value] of Object.entries(pairs)) {
		await db.query(
			`INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
			 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
			[key, String(value)]
		);
	}
}

function parsePaymentSettings(raw) {
	return {
		gcashEnabled: raw.payment_gcash_enabled === 'true',
		paymayaEnabled: raw.payment_paymaya_enabled === 'true',
		cardEnabled: raw.payment_card_enabled === 'true',
		bankTransferEnabled: raw.payment_bank_transfer_enabled === 'true',
		bankName: raw.payment_bank_name || '',
		bankAccountNumber: raw.payment_bank_account_number || '',
		bankAccountName: raw.payment_bank_account_name || '',
		bankInstructions: raw.payment_bank_instructions || '',
		gcashNumber: raw.payment_gcash_number || '',
		gcashName: raw.payment_gcash_name || '',
		gcashInstructions: raw.payment_gcash_instructions || ''
	};
}

module.exports = { createSystemSettingsTable, getAll, setMany, parsePaymentSettings };