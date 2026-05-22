require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
	try {
		console.log('🔄 Connecting to MySQL...');
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST || '127.0.0.1',
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			multipleStatements: true
		});

		console.log('✅ Connected to MySQL');

		// Read and execute schema files
		const files = [
			'database/000_create_database.sql',
			'database/001_init_schema.sql'
		];

		for (const file of files) {
			const filePath = path.join(__dirname, file);
			console.log(`\n📝 Running ${file}...`);
			const sql = fs.readFileSync(filePath, 'utf8');
			await connection.query(sql);
			console.log(`✅ ${file} completed`);
		}

		await connection.end();
		console.log('\n✅ Database setup complete!');
	} catch (error) {
		console.error('❌ Error setting up database:', error.message);
		process.exit(1);
	}
}

setupDatabase();
