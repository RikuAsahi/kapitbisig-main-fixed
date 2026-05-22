const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const config = require('./config');
const userModel = require('./models/userModel');
const campaignModel = require('./models/campaignModel');
const donationModel = require('./models/donationModel');
const ngoModel = require('./models/ngoModel');
const activityLogModel = require('./models/activityLogModel');
const passwordResetModel = require('./models/passwordResetModel');
const likesModel = require('./models/likesModel');
const commentsModel = require('./models/commentsModel');
const { seed } = require('./seed');
const errorHandler = require('./middleware/errorHandler');
const { limiter, authLimiter, donationLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(limiter);

app.use(
	cors({
		origin: true,
		credentials: true
	})
);

app.use(express.json());
app.use(
	session({
		name: 'kb.sid',
		secret: config.sessionSecret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: 'lax',
			secure: config.nodeEnv === 'production',
			maxAge: 1000 * 60 * 60 * 24 * 7
		}
	})
);

app.get('/health', (_req, res) => {
	res.json({ ok: true, service: 'kapitbisig-api' });
});

app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/donations', donationLimiter, donationRoutes);
app.use('/ngos', ngoRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
	res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

async function start() {
	try {
		await userModel.createUsersTable();
		await ngoModel.createNgoProfilesTable();
		await campaignModel.createCampaignsTable();
		await donationModel.createDonationsTable();
		await activityLogModel.createActivityLogsTable();
		await passwordResetModel.createPasswordResetTokensTable();
		await likesModel.createCampaignLikesTable();
		await commentsModel.createCampaignCommentsTable();
		await seed();

		app.listen(config.port, () => {
			console.log(`✓ KapitBisig API server running on http://localhost:${config.port}`);
			console.log(`  Environment: ${config.nodeEnv}`);
		});
	} catch (error) {
		console.error('✗ Failed to start server:', error);
		process.exit(1);
	}
}

start();
