/**
 * Test seed — run once to upsert test admin and NGO accounts.
 * Safe to re-run: uses INSERT IGNORE so existing records are skipped.
 *
 *   npm run seed:test
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const TEST_ACCOUNTS = [
	{
		firstName: 'Test',
		lastName: 'Admin',
		email: 'testadmin@kapitbisig.ph',
		password: 'TestAdmin123!',
		role: 'admin'
	},
	{
		firstName: 'Test',
		lastName: 'NGO',
		email: 'testngo@kapitbisig.ph',
		password: 'TestNGO123!',
		role: 'ngo_admin',
		ngo: {
			name: 'Test NGO Foundation',
			description: 'A test NGO account for development and QA.',
			phone: '09180000001',
			address: 'Barangay 105, Tondo, Manila',
			registrationNumber: 'NGO-TEST-001'
		}
	}
];

async function seedTest() {
	console.log('\n── KapitBisig Test Seed ──────────────────────────');

	for (const account of TEST_ACCOUNTS) {
		const hash = await bcrypt.hash(account.password, 10);

		const [result] = await db.query(
			`INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role)
			 VALUES (?, ?, ?, ?, ?)`,
			[account.firstName, account.lastName, account.email, hash, account.role]
		);

		const inserted = result.affectedRows > 0;

		if (inserted && account.role === 'ngo_admin' && account.ngo) {
			// Get the new user's ID
			const [[row]] = await db.query(
				`SELECT user_id FROM users WHERE email = ? LIMIT 1`,
				[account.email]
			);

			await db.query(
				`INSERT IGNORE INTO ngo_profiles
				   (user_id, ngo_name, description, phone_number, address,
				    registration_number, verification_status, verified_at)
				 VALUES (?, ?, ?, ?, ?, ?, 'verified', NOW())`,
				[
					row.user_id,
					account.ngo.name,
					account.ngo.description,
					account.ngo.phone,
					account.ngo.address,
					account.ngo.registrationNumber
				]
			);
		}

		const status = inserted ? 'created' : 'already exists (skipped)';
		console.log(`  [${account.role.toUpperCase()}] ${account.email} — ${status}`);
	}

	console.log('\n  Test credentials:');
	for (const a of TEST_ACCOUNTS) {
		console.log(`  ${a.role.padEnd(5)}  email: ${a.email.padEnd(30)} password: ${a.password}`);
	}
	console.log('──────────────────────────────────────────────────\n');

	const pool = await db.getPool();
	await pool.end();
}

seedTest().catch((err) => {
	console.error('Seed failed:', err.message);
	process.exit(1);
});
