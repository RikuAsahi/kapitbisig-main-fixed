const bcrypt = require('bcryptjs');
const db = require('./database');
const constants = require('./utils/constants');

const SEED_CAMPAIGNS = [
	{
		title: 'Scholars of Tondo — Education Fund 2025',
		description:
			'Help send 50 out-of-school youth from Barangay 105 back to the classroom. Funds cover tuition, school supplies, and daily allowances for one full academic year. Every peso goes directly to the scholars — zero admin overhead.',
		category: 'Education',
		targetAmount: 250000,
		currentAmount: 87500,
		imageUrl:
			'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&q=80',
		startDate: '2025-06-01 00:00:00',
		endDate: '2025-12-31 23:59:59'
	},
	{
		title: 'Free Medical Mission — Tondo Community Clinic',
		description:
			'Providing free consultations, medicines, and lab tests to 500 low-income families in Barangay 105. Your donation covers doctor\'s fees, medicine kits, and on-site laboratory services for two weekend missions.',
		category: 'Health',
		targetAmount: 180000,
		currentAmount: 63000,
		imageUrl:
			'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&q=80',
		startDate: '2025-07-01 00:00:00',
		endDate: '2025-09-30 23:59:59'
	},
	{
		title: 'Typhoon Relief — Barangay 105 Recovery',
		description:
			'After the recent typhoon, more than 120 families in Barangay 105 lost their homes and livelihoods. Donations provide emergency food packs, shelter materials, and livelihood seed capital to rebuild faster.',
		category: 'Natural Disaster',
		targetAmount: 500000,
		currentAmount: 212000,
		imageUrl:
			'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80',
		startDate: '2025-05-01 00:00:00',
		endDate: '2026-01-31 23:59:59'
	},
	{
		title: 'Bayanihan Community Center Renovation',
		description:
			'The Barangay 105 community hall has been the heart of local events for 30 years. Help us renovate the roof, repaint the walls, and install new benches so the space can serve hundreds of residents for the next decade.',
		category: 'Community',
		targetAmount: 320000,
		currentAmount: 45000,
		imageUrl:
			'https://images.unsplash.com/photo-1577896852618-01da09f9c1b4?w=800&q=80',
		startDate: '2025-08-01 00:00:00',
		endDate: '2026-03-31 23:59:59'
	},
	{
		title: 'Livelihood Training for Single Mothers',
		description:
			'A 3-month skills training program (dressmaking, food processing, handicrafts) for 40 single mothers in Tondo. Graduates receive a starter kit worth ₱5,000 to launch their small business.',
		category: 'Community',
		targetAmount: 200000,
		currentAmount: 130000,
		imageUrl:
			'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
		startDate: '2025-09-01 00:00:00',
		endDate: '2025-12-15 23:59:59'
	},
	{
		title: 'Clean Water for Barangay 105',
		description:
			'Installing 10 community water purification stations to give 2,000 residents access to safe drinking water. Each station serves around 200 households and requires annual filter maintenance covered by this fund.',
		category: 'Health',
		targetAmount: 400000,
		currentAmount: 155000,
		imageUrl:
			'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80',
		startDate: '2025-06-15 00:00:00',
		endDate: '2026-06-14 23:59:59'
	}
];

async function ensureSeedUser({ firstName, lastName, email, password, role }) {
	const [[existing]] = await db.query(
		`SELECT user_id, password_hash, role, deleted_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
		[email]
	);

	if (!existing) {
		const passwordHash = await bcrypt.hash(password, 10);
		const [result] = await db.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role)
			 VALUES (?, ?, ?, ?, ?)`,
			[firstName, lastName, email, passwordHash, role]
		);
		return { id: result.insertId, created: true, repaired: false };
	}

	let passwordMatches = false;
	try {
		passwordMatches = !!existing.password_hash && await bcrypt.compare(password, existing.password_hash);
	} catch (_error) {
		passwordMatches = false;
	}

	const normalizedExistingRole = constants.normalizeRole(existing.role);
	if (!passwordMatches || normalizedExistingRole !== role || existing.deleted_at) {
		const passwordHash = passwordMatches ? existing.password_hash : await bcrypt.hash(password, 10);
		await db.query(
			`UPDATE users
			 SET first_name = ?, last_name = ?, password_hash = ?, role = ?,
			     deleted_at = NULL, deleted_by = NULL, deleted_reason = NULL
			 WHERE user_id = ?`,
			[firstName, lastName, passwordHash, role, existing.user_id]
		);
		return { id: existing.user_id, created: false, repaired: true };
	}

	return { id: existing.user_id, created: false, repaired: false };
}

async function seed() {
	// 1. Admin user
	const [[adminRow]] = await db.query(
		`SELECT user_id FROM users WHERE email = ? LIMIT 1`,
		['admin@kapitbisig.ph']
	);
	let adminId;
	if (adminRow) {
		adminId = adminRow.user_id;
	} else {
		const adminHash = await bcrypt.hash('Admin@KB2025!', 10);
		const [r] = await db.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role)
			 VALUES (?, ?, ?, ?, 'admin')`,
			['KB', 'Admin', 'admin@kapitbisig.ph', adminHash]
		);
		adminId = r.insertId;
		console.log('  ↳ Created default admin → admin@kapitbisig.ph');
	}

	const adminRepair = await ensureSeedUser({
		firstName: 'KB',
		lastName: 'Admin',
		email: 'admin@kapitbisig.ph',
		password: 'Admin@KB2025!',
		role: constants.ROLES.ADMIN
	});
	adminId = adminRepair.id;
	if (adminRepair.repaired) {
		console.log('  -> Repaired default admin credentials: admin@kapitbisig.ph');
	}

	// 2. Demo NGO user
	const [[ngoUserRow]] = await db.query(
		`SELECT user_id FROM users WHERE email = ? LIMIT 1`,
		['demo@kapitbisig.ph']
	);
	let userId;
	if (ngoUserRow) {
		userId = ngoUserRow.user_id;
	} else {
		const passwordHash = await bcrypt.hash('kapitbisig2025!', 10);
		const [r] = await db.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role)
			 VALUES (?, ?, ?, ?, 'ngo_admin')`,
			['KapitBisig', 'Demo', 'demo@kapitbisig.ph', passwordHash]
		);
		userId = r.insertId;
		console.log('  ↳ Created demo NGO user → demo@kapitbisig.ph');
	}

	const ngoRepair = await ensureSeedUser({
		firstName: 'KapitBisig',
		lastName: 'Demo',
		email: 'demo@kapitbisig.ph',
		password: 'kapitbisig2025!',
		role: constants.ROLES.NGO_ADMIN
	});
	userId = ngoRepair.id;
	if (ngoRepair.repaired) {
		console.log('  -> Repaired demo NGO credentials: demo@kapitbisig.ph');
	}

	// 3. NGO profile
	const [[ngoProfileRow]] = await db.query(
		`SELECT ngo_id FROM ngo_profiles WHERE user_id = ? LIMIT 1`,
		[userId]
	);
	let ngoId;
	if (ngoProfileRow) {
		ngoId = ngoProfileRow.ngo_id;
		await db.query(
			`UPDATE ngo_profiles
			 SET verification_status = 'verified', verified_at = COALESCE(verified_at, NOW()),
			     archived_at = NULL, archived_by = NULL, archived_reason = NULL
			 WHERE ngo_id = ?`,
			[ngoId]
		);
	} else {
		const [r] = await db.query(
			`INSERT INTO ngo_profiles
			   (user_id, ngo_name, description, phone_number, address, registration_number, verification_status, verified_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'verified', NOW())`,
			[
				userId,
				'KapitBisig Foundation',
				'A community-led NGO empowering Barangay 105 residents in Tondo, Manila through education, health, and livelihood programs.',
				'09171234567',
				'Barangay 105, Tondo, Manila, Metro Manila',
				'NGO-2025-105-001'
			]
		);
		ngoId = r.insertId;
		console.log('  ↳ Created demo NGO profile → KapitBisig Foundation');
	}

	// 4. Campaigns — insert only if title doesn't already exist
	let created = 0;
	for (const c of SEED_CAMPAIGNS) {
		const [[existing]] = await db.query(
			`SELECT campaign_id FROM campaigns WHERE title = ? LIMIT 1`,
			[c.title]
		);
		if (existing) continue;

		await db.query(
			`INSERT INTO campaigns
			   (title, description, category, target_amount, current_amount, status,
			    image_url, ngo_id, created_by, start_date, end_date)
			 VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
			[
				c.title, c.description, c.category,
				c.targetAmount, c.currentAmount,
				c.imageUrl, ngoId, userId,
				c.startDate, c.endDate
			]
		);
		created++;
	}

	if (created > 0) {
		console.log(`  ↳ Seeded ${created} new campaign(s)`);
	}

	console.log('  ↳ Admin login  → email: admin@kapitbisig.ph   password: Admin@KB2025!');
	console.log('  ↳ NGO login    → email: demo@kapitbisig.ph    password: kapitbisig2025!');
}

module.exports = { seed };
