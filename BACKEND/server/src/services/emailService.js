const nodemailer = require('nodemailer');

function createTransport() {
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
	if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

	return nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT) || 587,
		secure: Number(SMTP_PORT) === 465,
		auth: { user: SMTP_USER, pass: SMTP_PASS }
	});
}

async function sendCampaignRejectionEmail({ toEmail, toName, campaignTitle, reason }) {
	const transport = createTransport();
	if (!transport) {
		console.warn('[email] SMTP not configured — skipping rejection email to', toEmail);
		return;
	}

	const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
	const reasonBlock = reason
		? `<p style="background:#fff3cd;border-left:4px solid #c9a84c;padding:12px 16px;margin:16px 0;border-radius:4px"><strong>Reason:</strong> ${reason}</p>`
		: '';

	await transport.sendMail({
		from: `"KapitBisig" <${fromAddress}>`,
		to: `${toName} <${toEmail}>`,
		subject: `Your campaign "${campaignTitle}" was not approved`,
		html: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
				<h2 style="color:#d94f4f">Campaign Not Approved</h2>
				<p>Hi ${toName},</p>
				<p>We regret to inform you that your campaign <strong>"${campaignTitle}"</strong> was not approved at this time.</p>
				${reasonBlock}
				<p>You may revise your campaign and re-submit it for review. If you have questions, please contact our support team.</p>
				<p style="color:#666;font-size:12px;margin-top:32px">— The KapitBisig Team</p>
			</div>
		`
	}).catch((err) => {
		console.error('[email] Failed to send rejection email:', err.message);
	});
}

async function sendNewSubmissionNotificationEmail({ campaignTitle, ngoName }) {
	const adminEmail = process.env.ADMIN_EMAIL;
	const transport = createTransport();
	if (!transport || !adminEmail) {
		console.warn('[email] SMTP or ADMIN_EMAIL not configured — skipping submission notification');
		return;
	}

	const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

	await transport.sendMail({
		from: `"KapitBisig" <${fromAddress}>`,
		to: adminEmail,
		subject: `New campaign pending review: "${campaignTitle}"`,
		html: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
				<h2 style="color:#4a9cc7">New Campaign Submitted for Review</h2>
				<p><strong>${ngoName}</strong> has submitted a new campaign that requires your approval.</p>
				<p style="background:#f0f7ff;border-left:4px solid #4a9cc7;padding:12px 16px;border-radius:4px">
					<strong>Campaign:</strong> ${campaignTitle}
				</p>
				<p>Log in to the admin dashboard to review and approve or reject this campaign.</p>
				<p style="color:#666;font-size:12px;margin-top:32px">— The KapitBisig Platform</p>
			</div>
		`
	}).catch((err) => {
		console.error('[email] Failed to send submission notification:', err.message);
	});
}

async function sendPasswordResetEmail({ toEmail, toName, resetUrl }) {
	const transport = createTransport();
	if (!transport) {
		console.warn('[email] SMTP not configured - skipping password reset email to', toEmail);
		return false;
	}

	const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

	try {
		await transport.sendMail({
			from: `"KapitBisig" <${fromAddress}>`,
			to: `${toName || 'KapitBisig user'} <${toEmail}>`,
			subject: 'Reset your KapitBisig password',
			html: `
			<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
				<h2 style="color:#4a9cc7">Reset Your Password</h2>
				<p>Hi ${toName || 'there'},</p>
				<p>We received a request to reset your KapitBisig password. Click the button below to create a new password.</p>
				<p style="margin:24px 0">
					<a href="${resetUrl}" style="display:inline-block;background:#5BA4CF;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Create New Password</a>
				</p>
				<p>If the button does not work, copy and paste this link into your browser:</p>
				<p style="word-break:break-all;color:#4a9cc7">${resetUrl}</p>
				<p>This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
				<p style="color:#666;font-size:12px;margin-top:32px">- The KapitBisig Team</p>
			</div>
		`
		});
	} catch (err) {
		console.error('[email] Failed to send password reset email:', err.message);
		return false;
	}

	return true;
}

module.exports = { sendCampaignRejectionEmail, sendNewSubmissionNotificationEmail, sendPasswordResetEmail };
