const SystemSettings = require('../models/systemSettingsModel');

async function getPaymentSettings(req, res, next) {
	try {
		const raw = await SystemSettings.getAll();
		return res.json({ settings: SystemSettings.parsePaymentSettings(raw) });
	} catch (error) {
		next(error);
	}
}

async function updatePaymentSettings(req, res, next) {
	try {
		const {
			gcashEnabled,
			paymayaEnabled,
			cardEnabled,
			bankTransferEnabled,
			bankName,
			bankAccountNumber,
			bankAccountName,
			bankInstructions,
			gcashNumber,
			gcashName,
			gcashInstructions
		} = req.body || {};

		await SystemSettings.setMany({
			payment_gcash_enabled: gcashEnabled ? 'true' : 'false',
			payment_paymaya_enabled: paymayaEnabled ? 'true' : 'false',
			payment_card_enabled: cardEnabled ? 'true' : 'false',
			payment_bank_transfer_enabled: bankTransferEnabled ? 'true' : 'false',
			payment_bank_name: bankName || '',
			payment_bank_account_number: bankAccountNumber || '',
			payment_bank_account_name: bankAccountName || '',
			payment_bank_instructions: bankInstructions || '',
			payment_gcash_number: gcashNumber || '',
			payment_gcash_name: gcashName || '',
			payment_gcash_instructions: gcashInstructions || ''
		});

		const raw = await SystemSettings.getAll();
		return res.json({ message: 'Payment settings updated.', settings: SystemSettings.parsePaymentSettings(raw) });
	} catch (error) {
		next(error);
	}
}

module.exports = { getPaymentSettings, updatePaymentSettings };