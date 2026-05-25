const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.FRONTEND_PORT || 4012);
const ROOT_DIR = __dirname;

const contentTypes = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.ico': 'image/x-icon',
	'.svg': 'image/svg+xml'
};

function resolveRequestPath(urlPath) {
	const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
	let safePath = decodedPath;

	// Redirect root to landing page
	if (decodedPath === '/') {
		safePath = '/HTML/Landingpage.html';
	} else if (decodedPath.startsWith('/') && decodedPath.endsWith('.html') && !decodedPath.slice(1).includes('/')) {
		// Route .html files from root to HTML directory (e.g., /Campaign.html -> /HTML/Campaign.html)
		safePath = `/HTML${decodedPath}`;
	}

	const filePath = path.normalize(path.join(ROOT_DIR, safePath));

	if (!filePath.startsWith(ROOT_DIR)) {
		return null;
	}

	return filePath;
}

const server = http.createServer((req, res) => {
	const filePath = resolveRequestPath(req.url || '/');

	if (!filePath) {
		res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('Forbidden');
		return;
	}

	fs.readFile(filePath, (err, content) => {
		if (err) {
			res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
			res.end('<h1>404 Not Found</h1>');
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
		res.end(content);
	});
});

server.listen(PORT, () => {
	console.log(`Frontend server running on http://localhost:${PORT}`);
	
});
