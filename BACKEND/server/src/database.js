const mysql = require('mysql2/promise');
const config = require('./config');

let pool;

async function getPool() {
	if (!pool) {
		pool = mysql.createPool({
			host: config.database.host,
			port: config.database.port,
			user: config.database.user,
			password: config.database.password,
			database: config.database.database,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		});
	}
	return pool;
}

async function query(sql, values = []) {
	const db = await getPool();
	return db.query(sql, values);
}

async function execute(sql, values = []) {
	const db = await getPool();
	return db.execute(sql, values);
}

module.exports = {
	getPool,
	query,
	execute
};
