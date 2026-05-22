const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
	try {
		console.log('🔄 Connecting to MySQL...');
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST || '127.0.0.1',
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: 'kapitbisig_db'
		});

		console.log('✅ Connected to database');

		// Hash passwords
		const donorPassword = await bcrypt.hash('TestPass123!', 10);
		const ngoPassword = await bcrypt.hash('NGOPass123!', 10);
		const adminPassword = await bcrypt.hash('AdminPass123!', 10);

		// 1. Create test users
		console.log('\n📝 Creating test users...');
		await connection.query(
			'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
			['John', 'Donor', 'john.donor@example.com', donorPassword, 'donor']
		);
		const [donors] = await connection.query('SELECT user_id FROM users WHERE email = ?', ['john.donor@example.com']);
		const donorId = donors[0].user_id;

		await connection.query(
			'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
			['Jane', 'Admin', 'jane.ngo@example.com', ngoPassword, 'ngo_admin']
		);
		const [ngoAdmins] = await connection.query('SELECT user_id FROM users WHERE email = ?', ['jane.ngo@example.com']);
		const ngoAdminId = ngoAdmins[0].user_id;

		await connection.query(
			'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
			['Super', 'Admin', 'admin@example.com', adminPassword, 'admin']
		);

		console.log('✅ Created test users');

		// 2. Create test NGO
		console.log('📝 Creating test NGO...');
		await connection.query(
			'INSERT INTO ngos (ngo_name, description, contact_person, verification_status, user_id) VALUES (?, ?, ?, ?, ?)',
			['Hope Foundation', 'Helping underprivileged communities', 'Maria Santos', 'verified', ngoAdminId]
		);
		const [ngos] = await connection.query('SELECT ngo_id FROM ngos WHERE ngo_name = ?', ['Hope Foundation']);
		const ngoId = ngos[0].ngo_id;
		console.log('✅ Created test NGO');

		// 3. Create test campaigns
		console.log('📝 Creating test campaigns...');
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 30);

		await connection.query(
			'INSERT INTO campaigns (title, description, target_amount, current_amount, start_date, end_date, status, ngo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			['School Building Project', 'Build a school in rural area', 100000.00, 0.00,
				startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 'active', ngoId]
		);
		const [campaigns] = await connection.query('SELECT campaign_id FROM campaigns WHERE title = ?', ['School Building Project']);
		const campaignId = campaigns[0].campaign_id;
		console.log('✅ Created test campaign');

		// 4. Create test donation
		console.log('📝 Creating test donation...');
		await connection.query(
			'INSERT INTO donations (amount, user_id, campaign_id, message) VALUES (?, ?, ?, ?)',
			[5000.00, donorId, campaignId, 'Happy to help build the school!']
		);
		console.log('✅ Created test donation');

		// 5. Update campaign current_amount
		console.log('📝 Updating campaign amount...');
		await connection.query(
			'UPDATE campaigns SET current_amount = ? WHERE campaign_id = ?',
			[5000.00, campaignId]
		);
		console.log('✅ Updated campaign amount');

		await connection.end();
		console.log('\n✅ Database seeding complete!');
		console.log('\n📋 Test Credentials:');
		console.log('   Donor: john.donor@example.com / TestPass123!');
		console.log('   NGO Admin: jane.ngo@example.com / NGOPass123!');
		console.log('   System Admin: admin@example.com / AdminPass123!');
	} catch (error) {
		console.error('❌ Error seeding database:', error.message);
		process.exit(1);
	}
}

seedDatabase();
