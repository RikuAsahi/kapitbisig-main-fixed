const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createDemoNGO() {
	try {
		console.log('🔄 Connecting to MySQL...');
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST || '127.0.0.1',
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: 'kapitbisig_db'
		});

		console.log('✅ Connected to database');

		// Check if demo account already exists
		const [existing] = await connection.query(
			'SELECT user_id FROM users WHERE email = ?',
			['demo@kapitbisig.ph']
		);

		if (existing.length > 0) {
			console.log('⚠️  Demo account already exists');
			await connection.end();
			return;
		}

		// Hash password
		const passwordHash = await bcrypt.hash('kapitbisig2025!', 10);

		// Create NGO admin user
		console.log('📝 Creating demo NGO admin account...');
		const [userResult] = await connection.query(
			'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
			['KapitBisig', 'Demo', 'demo@kapitbisig.ph', passwordHash, 'ngo_admin']
		);
		const userId = userResult.insertId;
		console.log('✅ Created user account');

		// Create NGO profile
		console.log('📝 Creating NGO profile...');
		await connection.query(
			'INSERT INTO ngos (ngo_name, description, contact_person, verification_status, user_id) VALUES (?, ?, ?, ?, ?)',
			['KapitBisig Foundation', 'A community-led NGO empowering communities through education, health, and livelihood programs.', 'Demo User', 'verified', userId]
		);
		console.log('✅ Created NGO profile');

		await connection.end();
		console.log('\n✅ Demo NGO account created successfully!');
		console.log('\n📋 Demo Credentials:');
		console.log('   Email: demo@kapitbisig.ph');
		console.log('   Password: kapitbisig2025!');
		console.log('   Role: ngo_admin');
	} catch (error) {
		console.error('❌ Error creating demo account:', error.message);
		process.exit(1);
	}
}

createDemoNGO();
