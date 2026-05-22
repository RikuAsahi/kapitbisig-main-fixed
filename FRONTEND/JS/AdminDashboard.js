(function () {
	const SESSION_SECONDS = 60 * 60;
	const ROLE_KEY = 'kb.dashboard.role';
	const THEME_KEY = 'kb.dashboard.theme';
	const SESSION_KEY = 'kb.dashboard.session.start';
	const CREATED_CAMPAIGNS_KEY = 'kb.campaigns.created';
	const PLACEHOLDER_MODE = false;

	const state = {
		role: 'superadmin',
		accountName: '',
		accountEmail: '',
		theme: 'light',
		currentPage: 'dashboard',
		campaignSearch: '',
		ngoSearch: '',
		sessionInterval: null,
		analyticsInterval: null,
		ngoId: null,
		charts: {}
	};

	const pagesByRole = {
		superadmin: [
			'dashboard',
			'analytics',
			'ngo-management',
			'user-management',
			'approvals',
			'moderation',
			'support',
			'notifications',
			'activity-logs',
			'settings'
		],
		ngo: ['dashboard', 'campaigns', 'analytics', 'support', 'settings']
	};

	const roleProfiles = {
		superadmin: {
			label: 'Super Admin',
			dotClass: 'superadmin',
			name: 'Super Admin Account',
			avatar: 'SA'
		},
		ngo: {
			label: 'NGO User',
			dotClass: 'ngo',
			name: 'NGO Account',
			avatar: 'NG'
		}
	};

	const navItems = {
		dashboard: { label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
		campaigns: { label: 'Campaigns', icon: 'M12 21s-8-4.5-8-11V5l8-3 8 3v5c0 6.5-8 11-8 11z' },
		analytics: { label: 'Analytics', icon: 'M3 3v18h18M7 15l3-3 3 2 4-5' },
		'ngo-management': { label: 'NGO Management', icon: 'M4 21h16M7 21V8h10v13M9 8V5h6v3' },
		'user-management': { label: 'User Management', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87' },
		approvals: { label: 'Approval Queue', icon: 'M20 6L9 17l-5-5' },
		moderation: { label: 'Moderation', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
		support: { label: 'Support Center', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
		notifications: { label: 'Notifications', icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
		'activity-logs': { label: 'Activity Logs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
		settings: { label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82' }
	};

	const data = {
		campaigns: [
			{ id: 1, title: 'Tondo Learning Kits', category: 'Education', status: 'Approved', raised: 72000, goal: 100000, donors: 214 },
			{ id: 2, title: 'Barangay Health Caravan', category: 'Health', status: 'Ongoing', raised: 51000, goal: 65000, donors: 143 },
			{ id: 3, title: 'Flood Relief Operations', category: 'Natural Disasters', status: 'Pending', raised: 15000, goal: 120000, donors: 67 },
			{ id: 4, title: 'Mothers Livelihood Tools', category: 'Community', status: 'Draft', raised: 5000, goal: 40000, donors: 19 },
			{ id: 5, title: 'Scholarship 2026 Batch', category: 'Education', status: 'Approved', raised: 93000, goal: 100000, donors: 289 },
			{ id: 6, title: 'Mobile Clinic Upgrades', category: 'Health', status: 'Flagged', raised: 14000, goal: 75000, donors: 42 }
		],
		ngos: [
			{ name: 'Bayanihan Foundation', contact: 'Joana Reyes', status: 'Verified', campaigns: 7, raised: 385000 },
			{ name: 'Hope in Tondo', contact: 'Carlo Dizon', status: 'Pending', campaigns: 3, raised: 92000 },
			{ name: 'Kalinga Youth', contact: 'Mia Tan', status: 'Inactive', campaigns: 2, raised: 41000 },
			{ name: 'Sulong Kabataan', contact: 'Luis Ramos', status: 'Verified', campaigns: 4, raised: 168000 }
		],
		users: [
			{ name: 'Maria Santos', email: 'maria@kapitbisig.ph', role: 'superadmin', status: 'Active' },
			{ name: 'Paolo Cruz', email: 'paolo@kapitbisig.ph', role: 'admin', status: 'Active' },
			{ name: 'Nadine Flores', email: 'nadine@ngo.ph', role: 'ngo', status: 'Pending Setup' }
		],
		approvals: [
			{ campaign: 'Emergency Food Packs', ngo: 'Hope in Tondo', requested: '2026-05-06', amount: 80000 },
			{ campaign: 'School Bag Drive', ngo: 'Sulong Kabataan', requested: '2026-05-05', amount: 45000 }
		],
		moderation: [
			{ campaign: 'Mobile Clinic Upgrades', reason: 'Missing liquidation report', severity: 'High' },
			{ campaign: 'Flood Relief Operations', reason: 'Pending document verification', severity: 'Medium' }
		],
		support: [
			{ org: 'Hope in Tondo', ticket: 'SUP-1012', concern: 'Campaign photo upload fails', status: 'Open' },
			{ org: 'Kalinga Youth', ticket: 'SUP-1011', concern: 'Cannot export donations report', status: 'In Progress' }
		],
		notifications: [
			{ text: '2 campaigns are waiting for approval.', time: '5 min ago', read: false },
			{ text: 'Monthly report is ready for export.', time: '20 min ago', read: false },
			{ text: 'New NGO account registered.', time: '1 hour ago', read: true }
		],
		logs: [
			{ date: '2026-05-08 09:10', action: 'login', actor: 'Maria Santos', detail: 'Successful login from 192.168.1.11' },
			{ date: '2026-05-08 08:58', action: 'approve', actor: 'Maria Santos', detail: 'Approved campaign Tondo Learning Kits' },
			{ date: '2026-05-08 08:40', action: 'create', actor: 'Paolo Cruz', detail: 'Created user account nadine@ngo.ph' }
		],
		ngoAnalytics: null
	};

	function qs(id) {
		return document.getElementById(id);
	}

	function fmtMoney(value) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value || 0);
	}

	function getRoleFromURL() {
		const role = new URLSearchParams(window.location.search).get('role');
		return role === 'ngo' || role === 'superadmin' ? role : null;
	}

	function mapRole(inputRole) {
		const raw = String(inputRole || '').trim().toLowerCase();
		if (raw === 'admin' || raw === 'superadmin' || raw === 'super_admin') return 'superadmin';
		if (raw === 'ngo' || raw === 'ngo_admin' || raw === 'ngo-user') return 'ngo';
		return null;
	}

	function readAccountContext() {
		const params = new URLSearchParams(window.location.search);
		const roleFromQuery = mapRole(params.get('accountRole') || params.get('userRole') || params.get('role'));

		let parsedUser = null;
		const rawUser = localStorage.getItem('kb.auth.user') || localStorage.getItem('kb.user') || '';
		if (rawUser) {
			try {
				parsedUser = JSON.parse(rawUser);
			} catch (_error) {
				parsedUser = null;
			}
		}

		const roleFromStorage = mapRole(
			localStorage.getItem('kb.auth.role') ||
				localStorage.getItem('kb.user.role') ||
				(parsedUser && parsedUser.role)
		);

		const nameFromStorage =
			(parsedUser && (parsedUser.fullName || `${parsedUser.firstName || ''} ${parsedUser.lastName || ''}`.trim())) ||
			localStorage.getItem('kb.auth.name') ||
			'';
		const emailFromStorage = (parsedUser && parsedUser.email) || localStorage.getItem('kb.auth.email') || '';

		return {
			role: roleFromQuery || roleFromStorage || null,
			name: String(nameFromStorage || '').trim(),
			email: String(emailFromStorage || '').trim()
		};
	}

	function getAllowedPages() {
		return pagesByRole[state.role] || pagesByRole.superadmin;
	}

	function badgeClass(status) {
		return `badge-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;
	}

	function renderSidebarNav() {
		const nav = qs('sidebarNav');
		if (!nav) return;
		nav.innerHTML = '';

		getAllowedPages().forEach((pageKey) => {
			const item = navItems[pageKey];
			if (!item) return;

			const button = document.createElement('button');
			button.className = `nav-item ${state.currentPage === pageKey ? 'active' : ''}`;
			button.innerHTML = `<svg viewBox="0 0 24 24"><path d="${item.icon}"/></svg>${item.label}`;
			button.addEventListener('click', function () {
				showPage(pageKey);
			});
			nav.appendChild(button);
		});
	}

	function applyRoleProfile() {
		const profile = roleProfiles[state.role] || roleProfiles.superadmin;
		const roleDot = qs('roleDot');
		const roleName = qs('roleUserName');
		const roleLabel = qs('roleLabel');
		const avatarBtn = qs('avatarBtn');

		if (roleDot) {
			roleDot.classList.remove('superadmin', 'admin', 'ngo');
			roleDot.classList.add(profile.dotClass);
		}
		if (roleName) roleName.textContent = state.accountName || profile.name;
		if (roleLabel) roleLabel.textContent = profile.label;
		if (avatarBtn) {
			const fallbackAvatar = profile.avatar;
			const source = state.accountName || profile.name;
			const initials = source
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((part) => part[0]?.toUpperCase() || '')
				.join('');
			avatarBtn.textContent = initials || fallbackAvatar;
		}

		const dashLabel = qs('dashPrimaryLabel');
		if (dashLabel) {
			dashLabel.textContent = state.role === 'ngo' ? 'Create Campaign' : 'Create Account';
		}
	}

	function renderRoleSwitcher() {
		// Roles are account-driven. We intentionally keep the switcher hidden.
	}

	function setRole(role) {
		if (!(role in pagesByRole)) return;
		state.role = role;
		localStorage.setItem(ROLE_KEY, role);

		const allowed = getAllowedPages();
		if (!allowed.includes(state.currentPage)) {
			state.currentPage = 'dashboard';
		}

		applyRoleProfile();
		renderSidebarNav();
		renderRoleSwitcher();
		showPage(state.currentPage);
	}

	function setTheme(theme) {
		state.theme = theme === 'dark' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', state.theme);
		localStorage.setItem(THEME_KEY, state.theme);

		const darkLabel = qs('darkLabel');
		if (darkLabel) {
			darkLabel.textContent = state.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
		}

		renderCharts();
	}

	function updateTopbar(pageKey) {
		const title = qs('topbarTitle');
		const sub = qs('topbarSub');
		const item = navItems[pageKey] || navItems.dashboard;
		if (title) {
			title.childNodes[0].textContent = item.label;
		}
		if (sub) {
			sub.textContent = state.role === 'ngo' ? 'NGO Portal' : 'Super Admin Portal';
		}
	}

	function renderDashboardStats() {
		const host = qs('dashStats');
		if (!host) return;

		if (PLACEHOLDER_MODE) {
			host.innerHTML = `
				<div class="stat-card sky"><div class="stat-label">Overview</div><div class="stat-value sky">--</div><div class="stat-sub">Awaiting backend metrics</div></div>
				<div class="stat-card green"><div class="stat-label">Funding</div><div class="stat-value green">--</div><div class="stat-sub">Awaiting backend metrics</div></div>
				<div class="stat-card gold"><div class="stat-label">Users</div><div class="stat-value gold">--</div><div class="stat-sub">Awaiting backend metrics</div></div>
				<div class="stat-card purple"><div class="stat-label">Operations</div><div class="stat-value">--</div><div class="stat-sub">Awaiting backend metrics</div></div>
			`;
			return;
		}

		const activeCampaigns = data.campaigns.filter((c) => c.status.toLowerCase() === 'active').length;
		const pendingCampaigns = data.approvals.length;
		const totalRaised = data.campaigns.reduce((s, c) => s + c.raised, 0);
		const verifiedNgos = data.ngos.filter((n) => n.status.toLowerCase() === 'verified').length;

		const cards = state.role === 'ngo'
			? [
					{ label: 'Active Campaigns', value: String(activeCampaigns), sub: `${pendingCampaigns} pending`, color: 'sky', icon: 'M12 21s-8-4.5-8-11V5l8-3 8 3v5c0 6.5-8 11-8 11z' },
					{ label: 'Total Raised', value: fmtMoney(totalRaised), sub: 'All campaigns', color: 'green', icon: 'M12 1v22M17 6H9a4 4 0 0 0 0 8h6a4 4 0 1 1 0 8H7' },
					{ label: 'Donors Reached', value: '--', sub: 'Across all drives', color: 'gold', icon: 'M17 21v-2a4 4 0 0 0-4-4H5' },
					{ label: 'Pending Tasks', value: String(pendingCampaigns), sub: 'Need action today', color: 'red', icon: 'M12 8v4l3 3M22 12A10 10 0 1 1 12 2' }
				]
			: [
					{ label: 'Total Raised', value: fmtMoney(totalRaised), sub: 'All campaigns', color: 'green', icon: 'M12 1v22M17 6H9a4 4 0 0 0 0 8h6a4 4 0 1 1 0 8H7' },
					{ label: 'Active Campaigns', value: String(activeCampaigns), sub: `${pendingCampaigns} pending approvals`, color: 'sky', icon: 'M12 21s-8-4.5-8-11V5l8-3 8 3v5c0 6.5-8 11-8 11z' },
					{ label: 'NGO Partners', value: String(data.ngos.length), sub: `${verifiedNgos} verified`, color: 'gold', icon: 'M4 21h16M7 21V8h10v13' },
					{ label: 'Total Users', value: String(data.users.length), sub: 'Registered accounts', color: 'red', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' }
				];

		host.innerHTML = cards
			.map(
				(card) => `
					<div class="stat-card ${card.color}">
						<div class="stat-icon ${card.color}"><svg viewBox="0 0 24 24"><path d="${card.icon}"/></svg></div>
						<div class="stat-label">${card.label}</div>
						<div class="stat-value ${card.color}">${card.value}</div>
						<div class="stat-sub">${card.sub}</div>
					</div>
				`
			)
			.join('');
	}

	function renderActivityFeed() {
		const host = qs('activityFeed');
		if (!host) return;

		if (PLACEHOLDER_MODE) {
			host.innerHTML = `
				<div class="empty-state" style="padding:20px 10px">
					<h3>Activity Feed Placeholder</h3>
					<p>Recent activity will appear after backend events are connected.</p>
				</div>
			`;
			return;
		}

		const feed = data.logs.slice(0, 4).map((l) => ({
			title: l.detail,
			meta: `by ${l.actor}`,
			time: l.date,
			color: l.action === 'approve' ? 'green' : l.action === 'login' ? 'sky' : 'gold'
		}));

		host.innerHTML = feed
			.map(
				(item) => `
					<div class="activity-item">
						<div class="activity-icon ${item.color}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></div>
						<div class="activity-text"><div class="activity-title">${item.title}</div><div class="activity-meta">${item.meta}</div></div>
						<div class="activity-time">${item.time}</div>
					</div>
				`
			)
			.join('');
	}

	function renderTopCampaigns() {
		const host = qs('topCampaigns');
		if (!host) return;

		if (PLACEHOLDER_MODE) {
			host.innerHTML = `
				<div class="empty-state" style="padding:20px 10px">
					<h3>Top Campaigns Placeholder</h3>
					<p>Ranking will be available once backend analytics are ready.</p>
				</div>
			`;
			return;
		}

		const sorted = [...data.campaigns]
			.sort((a, b) => b.raised / b.goal - a.raised / a.goal)
			.slice(0, 4);

		host.innerHTML = sorted
			.map((campaign) => {
				const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
				return `
					<div class="donor-item">
						<div class="donor-avatar">${campaign.title.slice(0, 2).toUpperCase()}</div>
						<div>
							<div class="donor-name">${campaign.title}</div>
							<div class="donor-time">${campaign.category} · ${campaign.donors} donors</div>
						</div>
						<div class="donor-amount">${progress}%</div>
					</div>
				`;
			})
			.join('');
	}

	function renderCampaignGrid() {
		const host = qs('campaignGrid');
		if (!host) return;

		if (state.role !== 'ngo') {
			host.innerHTML = '<div class="empty-state"><h3>Campaign Module Hidden</h3><p>Campaign management is not shown for Super Admin on this version.</p></div>';
			return;
		}

		if (PLACEHOLDER_MODE) {
			host.innerHTML = `
				<div class="camp-card"><div class="camp-thumb"></div><div class="camp-body"><div class="camp-category">Template</div><div class="camp-title">Campaign Card Template</div><div class="camp-foot"><div class="camp-donors">No backend data yet</div></div></div></div>
				<div class="camp-card"><div class="camp-thumb"></div><div class="camp-body"><div class="camp-category">Template</div><div class="camp-title">Campaign Card Template</div><div class="camp-foot"><div class="camp-donors">No backend data yet</div></div></div></div>
				<div class="camp-card"><div class="camp-thumb"></div><div class="camp-body"><div class="camp-category">Template</div><div class="camp-title">Campaign Card Template</div><div class="camp-foot"><div class="camp-donors">No backend data yet</div></div></div></div>
			`;
			return;
		}

		const category = (qs('catFilter')?.value || '').toLowerCase();
		const status = (qs('statusFilter')?.value || '').toLowerCase();
		const perf = (qs('perfFilter')?.value || '').toLowerCase();
		const query = state.campaignSearch.toLowerCase();

		const filtered = data.campaigns.filter((campaign) => {
			const ratio = campaign.raised / campaign.goal;
			const perfMatch =
				!perf ||
				(perf === 'high' && ratio > 0.75) ||
				(perf === 'mid' && ratio >= 0.25 && ratio <= 0.75) ||
				(perf === 'low' && ratio < 0.25);

			return (
				(!category || campaign.category.toLowerCase() === category) &&
				(!status || campaign.status.toLowerCase() === status) &&
				perfMatch &&
				(!query || campaign.title.toLowerCase().includes(query) || campaign.category.toLowerCase().includes(query))
			);
		});

		if (!filtered.length) {
			host.innerHTML = '<div class="empty-state"><h3>No campaigns found</h3><p>Try changing the filters or search query.</p></div>';
			return;
		}

		host.innerHTML = filtered
			.map((campaign) => {
				const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
				return `
					<div class="camp-card" onclick="openCampaignDetail(${campaign.id})">
						<div class="camp-thumb"><svg viewBox="0 0 24 24"><path d="M12 21s-8-4.5-8-11V5l8-3 8 3v5c0 6.5-8 11-8 11z"/></svg><span class="badge ${badgeClass(campaign.status)} camp-badge-float">${campaign.status}</span></div>
						<div class="camp-body">
							<div class="camp-category">${campaign.category}</div>
							<div class="camp-title">${campaign.title}</div>
							<div class="progress-wrap">
								<div class="progress-label"><span>${fmtMoney(campaign.raised)}</span><span>${progress}%</span></div>
								<div class="progress-bar"><div class="progress-fill sky" style="width:${progress}%"></div></div>
							</div>
							<div class="camp-foot"><div class="camp-donors">${campaign.donors} donors</div><strong>${fmtMoney(campaign.goal)}</strong></div>
						</div>
					</div>
				`;
			})
			.join('');
	}

	function renderNGOTable() {
		const table = qs('ngoTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Organization</th><th>Contact</th><th>Status</th><th>Campaigns</th><th>Raised</th></tr></thead>
				<tbody>
					<tr>
						<td><strong>Template Organization</strong></td>
						<td>Template Contact</td>
						<td><span class="badge badge-pending">Template</span></td>
						<td>--</td>
						<td>--</td>
					</tr>
					<tr><td colspan="5">NGO Management is template-only until backend data is connected.</td></tr>
				</tbody>
			`;
			return;
		}

		const rows = data.ngos
			.filter((ngo) => !state.ngoSearch || ngo.name.toLowerCase().includes(state.ngoSearch))
			.map(
				(ngo) => `
					<tr>
						<td><strong>${ngo.name}</strong></td>
						<td>${ngo.contact}</td>
						<td><span class="badge ${badgeClass(ngo.status)}">${ngo.status}</span></td>
						<td>${ngo.campaigns}</td>
						<td>${fmtMoney(ngo.raised)}</td>
					</tr>
				`
			)
			.join('');

		table.innerHTML = `
			<thead><tr><th>Organization</th><th>Contact</th><th>Status</th><th>Campaigns</th><th>Raised</th></tr></thead>
			<tbody>${rows || '<tr><td colspan="5">No NGO records.</td></tr>'}</tbody>
		`;
	}

	function renderUserTable() {
		const table = qs('userTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
				<tbody><tr><td><strong>Template User</strong></td><td>template@domain</td><td><span class="badge badge-admin">template</span></td><td>Awaiting backend</td></tr></tbody>
			`;
			return;
		}

		table.innerHTML = `
			<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
			<tbody>
				${data.users
					.map(
						(user) => `
							<tr>
								<td><strong>${user.name}</strong></td>
								<td>${user.email}</td>
								<td><span class="badge badge-${user.role}">${user.role}</span></td>
								<td>${user.status}</td>
							</tr>
						`
					)
					.join('')}
			</tbody>
		`;
	}

	function renderApprovals() {
		const table = qs('approvalTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Campaign</th><th>NGO</th><th>Date</th><th>Goal</th><th>Action</th></tr></thead>
				<tbody><tr><td colspan="5">Approval Queue placeholder. Pending items will load from backend.</td></tr></tbody>
			`;
			return;
		}

		table.innerHTML = `
			<thead><tr><th>Campaign</th><th>NGO</th><th>Date</th><th>Goal</th><th>Action</th></tr></thead>
			<tbody>
				${data.approvals
					.map(
						(row, idx) => `
							<tr>
								<td><strong>${row.campaign}</strong></td>
								<td>${row.ngo}</td>
								<td>${row.requested}</td>
								<td>${fmtMoney(row.amount)}</td>
								<td class="td-actions">
									<button class="btn btn-success btn-sm" onclick="openApprovalModal('approve', ${idx})">Approve</button>
									<button class="btn btn-danger btn-sm" onclick="openApprovalModal('reject', ${idx})">Reject</button>
								</td>
							</tr>
						`
					)
					.join('')}
			</tbody>
		`;
	}

	function renderModeration() {
		const table = qs('moderationTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Campaign</th><th>Reason</th><th>Severity</th><th>Action</th></tr></thead>
				<tbody><tr><td colspan="4">Moderation placeholder. Flagged items will come from backend.</td></tr></tbody>
			`;
			return;
		}

		table.innerHTML = `
			<thead><tr><th>Campaign</th><th>Reason</th><th>Severity</th><th>Action</th></tr></thead>
			<tbody>
				${data.moderation
					.map(
						(row) => `
							<tr>
								<td><strong>${row.campaign}</strong></td>
								<td>${row.reason}</td>
								<td><span class="badge ${row.severity === 'High' ? 'badge-flagged' : 'badge-pending'}">${row.severity}</span></td>
								<td><button class="btn btn-warn btn-sm" onclick="showToast('Flag under review.','info')">Review</button></td>
							</tr>
						`
					)
					.join('')}
			</tbody>
		`;
	}

	function renderSupport() {
		const table = qs('supportTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Organization</th><th>Ticket</th><th>Concern</th><th>Status</th></tr></thead>
				<tbody><tr><td colspan="4">Support Center placeholder. Tickets will load from backend.</td></tr></tbody>
			`;
			return;
		}

		table.innerHTML = `
			<thead><tr><th>Organization</th><th>Ticket</th><th>Concern</th><th>Status</th></tr></thead>
			<tbody>
				${data.support
					.map(
						(row) => `
							<tr>
								<td><strong>${row.org}</strong></td>
								<td>${row.ticket}</td>
								<td>${row.concern}</td>
								<td><span class="badge ${row.status === 'Open' ? 'badge-pending' : 'badge-approved'}">${row.status}</span></td>
							</tr>
						`
					)
					.join('')}
			</tbody>
		`;
	}

	function renderNotifications() {
		const list = qs('notifList');
		if (!list) return;

		if (PLACEHOLDER_MODE) {
			list.innerHTML = `
				<div class="empty-state" style="padding:24px 10px">
					<h3>Notifications Placeholder</h3>
					<p>Notifications will appear once backend notification service is connected.</p>
				</div>
			`;
			return;
		}

		list.innerHTML = data.notifications
			.map(
				(n) => `
					<div class="notif-item ${n.read ? '' : 'unread'}">
						<div class="notif-dot-indicator ${n.read ? 'read' : ''}"></div>
						<div>
							<div class="activity-title">${n.text}</div>
							<div class="activity-meta">${n.time}</div>
						</div>
					</div>
				`
			)
			.join('');
	}

	function renderLogs() {
		const table = qs('logsTable');
		if (!table) return;

		if (PLACEHOLDER_MODE) {
			table.innerHTML = `
				<thead><tr><th>Date/Time</th><th>Action</th><th>Actor</th><th>Details</th></tr></thead>
				<tbody><tr><td colspan="4">Activity Logs placeholder. Audit logs will load from backend.</td></tr></tbody>
			`;
			return;
		}

		table.innerHTML = `
			<thead><tr><th>Date/Time</th><th>Action</th><th>Actor</th><th>Details</th></tr></thead>
			<tbody>
				${data.logs
					.map(
						(row) => `
							<tr class="log-row">
								<td>${row.date}</td>
								<td><span class="action-tag ${row.action}">${row.action}</span></td>
								<td><strong>${row.actor}</strong></td>
								<td>${row.detail}</td>
							</tr>
						`
					)
					.join('')}
			</tbody>
		`;
	}

	function renderSettings() {
		const general = qs('settingsGeneral');
		const security = qs('settingsSecurity');
		if (!general || !security) return;

		const isSuperAdmin = state.role === 'superadmin';

		if (!isSuperAdmin) {
			general.innerHTML = `
				<div class="form-group">
					<label class="form-label">Organization Display Name</label>
					<input class="form-input" value="${state.accountName || 'NGO Account'}" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Public Contact Email</label>
					<input class="form-input" value="${state.accountEmail || 'ngo@kapitbisig.ph'}" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Public Contact Number</label>
					<input class="form-input" value="+63 900 000 0000" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Address</label>
					<input class="form-input" value="Barangay 105, Tondo, Manila" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Campaign Notification Emails</label>
					<label class="toggle"><input type="checkbox" checked><span class="toggle-track"></span></label>
				</div>
			`;

			security.innerHTML = `
				<div class="form-group">
					<label class="form-label">Change Password</label>
					<input class="form-input" type="password" placeholder="Enter new password" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Confirm New Password</label>
					<input class="form-input" type="password" placeholder="Confirm new password" />
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Two-Factor Authentication</label>
					<label class="toggle"><input type="checkbox"><span class="toggle-track"></span></label>
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Login Alerts</label>
					<label class="toggle"><input type="checkbox" checked><span class="toggle-track"></span></label>
				</div>
				<div class="form-group" style="margin-top:12px">
					<label class="form-label">Session Timeout</label>
					<select class="form-input"><option>60 minutes</option><option>30 minutes</option><option>15 minutes</option></select>
				</div>
			`;
			return;
		}

		general.innerHTML = `
			<div class="form-group">
				<label class="form-label">Platform Name</label>
				<input class="form-input" value="Kapitbisig" />
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Support Email</label>
				<input class="form-input" value="support@kapitbisig.ph" />
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Support Contact Number</label>
				<input class="form-input" value="+63 912 345 6789" />
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Default Currency</label>
				<select class="form-input"><option>PHP (Philippine Peso)</option></select>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Default Timezone</label>
				<select class="form-input"><option>Asia/Manila (GMT+8)</option></select>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Campaign Submission Policy</label>
				<select class="form-input"><option>Require Admin Review</option><option>Auto-approve trusted NGOs</option></select>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Email Notifications</label>
				<label class="toggle"><input type="checkbox" checked><span class="toggle-track"></span></label>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Maintenance Mode</label>
				<label class="toggle"><input type="checkbox"><span class="toggle-track"></span></label>
			</div>
		`;

		security.innerHTML = `
			<div class="form-group">
				<label class="form-label">Session Timeout</label>
				<select class="form-input"><option>60 minutes</option><option>30 minutes</option><option>15 minutes</option></select>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Require 2FA for Admins</label>
				<label class="toggle"><input type="checkbox"><span class="toggle-track"></span></label>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Password Policy</label>
				<select class="form-input"><option>Strong (12+ chars, mixed)</option><option>Standard (8+ chars)</option></select>
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Max Login Attempts</label>
				<input class="form-input" type="number" value="5" min="3" max="10" />
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">Account Lock Duration (minutes)</label>
				<input class="form-input" type="number" value="15" min="5" max="120" />
			</div>
			<div class="form-group" style="margin-top:12px">
				<label class="form-label">IP Allowlist Enforcement</label>
				<label class="toggle"><input type="checkbox"><span class="toggle-track"></span></label>
			</div>
		`;
	}

	function chartPalette() {
		return state.theme === 'dark'
			? { text: '#9db0cc', grid: 'rgba(157,176,204,0.12)' }
			: { text: '#5a7090', grid: 'rgba(90,112,144,0.16)' };
	}

	function destroyCharts() {
		Object.keys(state.charts).forEach((key) => {
			try {
				state.charts[key].destroy();
			} catch (_error) {
				// ignore
			}
		});
		state.charts = {};
	}

	function createChart(id, config) {
		if (!window.Chart) return null;
		const canvas = qs(id);
		if (!canvas) return null;
		return new window.Chart(canvas, config);
	}

	function renderCharts() {
		destroyCharts();

		if (PLACEHOLDER_MODE) {
			['donationChart', 'statusChart', 'dailyChart', 'categoryChart', 'donorChart'].forEach((id) => {
				const canvas = qs(id);
				const wrap = canvas && canvas.parentElement;
				if (!wrap) return;
				wrap.innerHTML = `
					<div class="empty-state" style="padding:24px 12px">
						<h3>Analytics Placeholder</h3>
						<p>Chart values will appear after backend analytics endpoints are available.</p>
					</div>
				`;
			});
			return;
		}

		if (!window.Chart) return;

		const palette = chartPalette();
		window.Chart.defaults.color = palette.text;
		window.Chart.defaults.borderColor = palette.grid;

		state.charts.donation = createChart('donationChart', {
			type: 'line',
			data: {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
				datasets: [{
					label: 'Donations',
					data: [12000, 9000, 14500, 18000, 13000, 22000, 19500],
					borderColor: '#4a9cc7',
					backgroundColor: 'rgba(74,156,199,0.2)',
					tension: 0.35,
					fill: true
				}]
			},
			options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
		});

		state.charts.status = createChart('statusChart', {
			type: 'doughnut',
			data: {
				labels: ['Approved', 'Pending', 'Flagged'],
				datasets: [{ data: [9, 3, 2], backgroundColor: ['#2e9e6e', '#c9a84c', '#d94f4f'] }]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});

		const ngoA = state.role === 'ngo' ? data.ngoAnalytics : null;

		const dailyLabels = ngoA && ngoA.dailyDonations.length
			? ngoA.dailyDonations.map((d) => d.date.slice(5))
			: ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
		const dailyAmounts = ngoA && ngoA.dailyDonations.length
			? ngoA.dailyDonations.map((d) => d.amount)
			: [178000, 214000, 163000, 241000];

		state.charts.daily = createChart('dailyChart', {
			type: 'bar',
			data: {
				labels: dailyLabels,
				datasets: [{ label: 'PHP', data: dailyAmounts, backgroundColor: '#4a9cc7' }]
			},
			options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
		});

		const categoryLabels = ngoA && ngoA.campaigns.length
			? ngoA.campaigns.slice(0, 6).map((c) => c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title)
			: ['Education', 'Health', 'Disaster', 'Community'];
		const categoryAmounts = ngoA && ngoA.campaigns.length
			? ngoA.campaigns.slice(0, 6).map((c) => c.currentAmount)
			: [40, 28, 20, 12];

		state.charts.category = createChart('categoryChart', {
			type: 'pie',
			data: {
				labels: categoryLabels,
				datasets: [{ data: categoryAmounts, backgroundColor: ['#4a9cc7', '#2e9e6e', '#d4821a', '#7c4de8', '#c9a84c', '#d94f4f'] }]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});

		const donorLabels = ngoA && ngoA.monthlyDonors.length
			? ngoA.monthlyDonors.map((m) => m.month)
			: ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
		const donorCounts = ngoA && ngoA.monthlyDonors.length
			? ngoA.monthlyDonors.map((m) => m.count)
			: [42, 55, 61, 73, 89];

		state.charts.donor = createChart('donorChart', {
			type: 'line',
			data: {
				labels: donorLabels,
				datasets: [{ label: 'New donors', data: donorCounts, borderColor: '#c9a84c', tension: 0.35 }]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});
	}

	async function loadNgoAnalytics() {
		if (!state.ngoId) return;
		try {
			const res = await NGOAPI.getAnalytics(state.ngoId);
			data.ngoAnalytics = res.analytics || null;
		} catch (_err) {
			// keep existing data on failure
		}
	}

	function renderAnalyticsActivityFeed() {
		const feed = qs('analyticsActivityFeed');
		const card = qs('analyticsActivityCard');
		if (!feed) return;

		if (state.role !== 'ngo') {
			if (card) card.style.display = 'none';
			return;
		}
		if (card) card.style.display = '';

		const a = data.ngoAnalytics;
		if (!a || !a.recentActivity || a.recentActivity.length === 0) {
			feed.innerHTML = '<p style="color:var(--text-muted);padding:8px 0">No recent donations yet.</p>';
			return;
		}

		feed.innerHTML = a.recentActivity.map((item) => `
			<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
				<div>
					<div style="font-weight:600;font-size:13px">${item.donorName}</div>
					<div style="font-size:12px;color:var(--text-muted)">${item.campaignTitle}</div>
					${item.message ? `<div style="font-size:12px;color:var(--text-muted);font-style:italic">"${item.message}"</div>` : ''}
				</div>
				<div style="text-align:right">
					<div style="font-weight:700;color:var(--green)">${fmtMoney(item.amount)}</div>
					<div style="font-size:11px;color:var(--text-muted)">${new Date(item.createdAt).toLocaleDateString('en-PH')}</div>
				</div>
			</div>
		`).join('');
	}

	function renderAnalyticsStats() {
		const host = qs('analyticsStats');
		if (!host) return;

		if (state.role === 'ngo') {
			const a = data.ngoAnalytics;
			const avgDonation = a && a.totalDonationCount > 0
				? a.totalDonations / a.totalDonationCount
				: 0;
			const activeCampaigns = a ? (a.campaigns || []).filter((c) => c.status === 'active').length : 0;
			host.innerHTML = `
				<div class="stat-card sky"><div class="stat-label">Total Raised</div><div class="stat-value sky">${fmtMoney(a ? a.totalDonations : 0)}</div><div class="stat-sub">${a ? a.totalDonationCount : 0} completed donations</div></div>
				<div class="stat-card green"><div class="stat-label">Unique Donors</div><div class="stat-value green">${a ? a.uniqueDonors : 0}</div><div class="stat-sub">Across all campaigns</div></div>
				<div class="stat-card gold"><div class="stat-label">Avg Donation</div><div class="stat-value gold">${fmtMoney(avgDonation)}</div><div class="stat-sub">Per transaction</div></div>
				<div class="stat-card purple"><div class="stat-label">Active Campaigns</div><div class="stat-value">${activeCampaigns}</div><div class="stat-sub">${a ? (a.campaigns || []).length : 0} total campaigns</div></div>
			`;
			return;
		}

		if (PLACEHOLDER_MODE) {
			host.innerHTML = `
				<div class="stat-card sky"><div class="stat-label">Conversion Rate</div><div class="stat-value sky">--</div><div class="stat-sub">Awaiting backend analytics</div></div>
				<div class="stat-card green"><div class="stat-label">Average Donation</div><div class="stat-value green">--</div><div class="stat-sub">Awaiting backend analytics</div></div>
				<div class="stat-card gold"><div class="stat-label">Donor Growth</div><div class="stat-value gold">--</div><div class="stat-sub">Awaiting backend analytics</div></div>
				<div class="stat-card purple"><div class="stat-label">Retention</div><div class="stat-value">--</div><div class="stat-sub">Awaiting backend analytics</div></div>
			`;
			return;
		}

		host.innerHTML = `
			<div class="stat-card sky"><div class="stat-label">Conversion Rate</div><div class="stat-value sky">4.8%</div><div class="stat-sub">Visitor to donor</div></div>
			<div class="stat-card green"><div class="stat-label">Avg Donation</div><div class="stat-value green">${fmtMoney(1240)}</div><div class="stat-sub">Per transaction</div></div>
			<div class="stat-card gold"><div class="stat-label">New Donors</div><div class="stat-value gold">89</div><div class="stat-sub">Last 30 days</div></div>
			<div class="stat-card purple"><div class="stat-label">Retention</div><div class="stat-value">63%</div><div class="stat-sub">Returning donors</div></div>
		`;
	}

	function updateSessionTimer() {
		const timerEl = qs('sessionTimer');
		if (!timerEl) return;

		const start = Number(localStorage.getItem(SESSION_KEY) || Date.now());
		const elapsed = Math.floor((Date.now() - start) / 1000);
		const remaining = Math.max(0, SESSION_SECONDS - elapsed);
		const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
		const ss = String(remaining % 60).padStart(2, '0');
		timerEl.textContent = `${mm}:${ss}`;

		if (remaining <= 300) {
			timerEl.style.color = '#f07070';
		} else {
			timerEl.style.color = '';
		}

		if (remaining === 0) {
			clearInterval(state.sessionInterval);
			showToast('Session expired. Please sign in again.', 'error');
		}
	}

	function bootstrapSessionTimer() {
		if (!localStorage.getItem(SESSION_KEY)) {
			localStorage.setItem(SESSION_KEY, String(Date.now()));
		}
		updateSessionTimer();
		clearInterval(state.sessionInterval);
		state.sessionInterval = setInterval(updateSessionTimer, 1000);
	}

	function showToast(message, type) {
		const toastEl = qs('toastEl');
		const toastMsg = qs('toastMsg');
		if (!toastEl || !toastMsg) return;

		toastMsg.textContent = message;
		toastEl.style.opacity = '1';
		toastEl.style.transform = 'translateY(0)';

		if (type === 'error') {
			toastEl.style.background = 'linear-gradient(135deg,#d94f4f,#a33030)';
			toastEl.style.color = '#fff';
		} else if (type === 'success') {
			toastEl.style.background = 'linear-gradient(135deg,#2e9e6e,#1f7d56)';
			toastEl.style.color = '#fff';
		} else {
			toastEl.style.background = 'linear-gradient(135deg,#4a9cc7,#233566)';
			toastEl.style.color = '#fff';
		}

		setTimeout(function () {
			toastEl.style.opacity = '0';
			toastEl.style.transform = 'translateY(10px)';
		}, 2100);
	}

	async function loadDashboardData() {
		try {
			const campaignFilters = { limit: 100 };
			if (state.role === 'ngo' && state.ngoId) campaignFilters.ngoId = state.ngoId;

			const [campaignsRes, usersRes, ngosRes, logsRes] = await Promise.all([
				CampaignAPI.list(campaignFilters),
				AdminAPI.getAllUsers({ limit: 100 }),
				NGOAPI.list({ limit: 100 }),
				AdminAPI.getActivityLogs({ limit: 50 })
			]);

			const campaigns = campaignsRes.campaigns || [];
			const users = usersRes.users || [];
			const ngos = ngosRes.profiles || ngosRes.ngos || [];
			const logs = logsRes.logs || [];

			data.campaigns = campaigns.map((c) => ({
				id: c.id,
				title: c.title,
				category: c.category,
				status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
				raised: Number(c.currentAmount || 0),
				goal: Number(c.targetAmount || 0),
				donors: 0,
				rejectionReason: c.rejectionReason || null
			}));

			data.users = users.map((u) => ({
				name: u.fullName || `${u.firstName} ${u.lastName}`.trim(),
				email: u.email,
				role: u.role,
				status: 'Active',
				id: u.id
			}));

			data.ngos = ngos.map((n) => ({
				name: n.name,
				contact: n.phoneNumber || '',
				status: n.verificationStatus.charAt(0).toUpperCase() + n.verificationStatus.slice(1),
				campaigns: 0,
				raised: 0,
				id: n.id
			}));

			const ngoMap = {};
			ngos.forEach((n) => { ngoMap[String(n.id)] = n.name; });

			data.approvals = campaigns
				.filter((c) => c.status === 'pending')
				.map((c) => ({
					campaign: c.title,
					ngo: ngoMap[String(c.ngoId)] || `NGO #${c.ngoId}`,
					requested: new Date(c.createdAt).toISOString().slice(0, 10),
					amount: Number(c.targetAmount || 0),
					id: c.id
				}));

			data.logs = logs.map((l) => ({
				date: new Date(l.createdAt).toLocaleString('en-PH'),
				action: l.action,
				actor: l.adminId,
				detail: l.description || `${l.action} on ${l.entityType}`
			}));
		} catch (_err) {
			// keep existing mock data if API fails
		}
	}

	function readCreatedCampaigns() {
		const raw = localStorage.getItem(CREATED_CAMPAIGNS_KEY);
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch (_error) {
			return [];
		}
	}

	function writeCreatedCampaigns(campaigns) {
		localStorage.setItem(CREATED_CAMPAIGNS_KEY, JSON.stringify(campaigns));
	}

	function createCampaignRecord(status) {
		const title = String(qs('campaignTitleInput')?.value || '').trim();
		const category = String(qs('campaignCategoryInput')?.value || '').trim();
		const goal = Number(qs('campaignGoalInput')?.value || 0);
		const description = String(qs('campaignDescriptionInput')?.value || '').trim();

		const bankName = String(qs('campaignBankNameInput')?.value || '').trim();
		const bankAccount = String(qs('campaignBankAccountInput')?.value || '').trim();
		const bankPayee = String(qs('campaignBankPayeeInput')?.value || '').trim();
		const gcashNumber = String(qs('campaignGCashInput')?.value || '').trim();
		const paymayaNumber = String(qs('campaignPayMayaInput')?.value || '').trim();

		if (!title) {
			showToast('Campaign title is required.', 'error');
			return null;
		}
		if (!category) {
			showToast('Campaign category is required.', 'error');
			return null;
		}
		if (!(goal > 0)) {
			showToast('Goal amount must be greater than zero.', 'error');
			return null;
		}

		const hasBank = bankName && bankAccount && bankPayee;
		const hasEwallet = gcashNumber || paymayaNumber;
		if (!hasBank && !hasEwallet) {
			showToast('Add a bank account or at least one e-wallet number.', 'error');
			return null;
		}

		return {
			id: `CAMP-${Date.now()}`,
			title,
			category,
			description: description || 'No campaign description yet.',
			goalAmount: goal,
			status,
			ngoName: state.accountName || 'NGO Account',
			createdAt: new Date().toISOString(),
			payout: {
				bankName: bankName || 'Not provided',
				bankAccount: bankAccount || 'Not provided',
				bankPayee: bankPayee || (state.accountName || 'NGO Account'),
				gcashNumber: gcashNumber || 'Not provided',
				paymayaNumber: paymayaNumber || 'Not provided'
			}
		};
	}

	function stopAnalyticsPolling() {
		if (state.analyticsInterval) {
			clearInterval(state.analyticsInterval);
			state.analyticsInterval = null;
		}
	}

	function startAnalyticsPolling() {
		stopAnalyticsPolling();
		if (state.role !== 'ngo' || !state.ngoId) return;
		state.analyticsInterval = setInterval(async function () {
			await loadNgoAnalytics();
			renderAnalyticsStats();
			renderAnalyticsActivityFeed();
			destroyCharts();
			renderCharts();
		}, 10000);
	}

	function showPage(pageKey) {
		if (!getAllowedPages().includes(pageKey)) {
			showToast('This page is not available for your role.', 'error');
			return;
		}

		state.currentPage = pageKey;
		document.querySelectorAll('.page').forEach((page) => {
			page.classList.remove('active');
		});

		const active = qs(`page-${pageKey}`);
		if (active) active.classList.add('active');

		renderSidebarNav();
		updateTopbar(pageKey);

		if (pageKey === 'analytics') {
			startAnalyticsPolling();
		} else {
			stopAnalyticsPolling();
		}
	}

	function toggleSidebar() {
		qs('sidebar')?.classList.toggle('open');
	}

	function toggleDropdown() {
		qs('avatarDd')?.classList.toggle('open');
	}

	function toggleDark() {
		setTheme(state.theme === 'dark' ? 'light' : 'dark');
	}

	function globalFilter(value) {
		if (state.currentPage === 'campaigns') {
			filterCampaigns(value);
			return;
		}
		if (state.currentPage === 'ngo-management') {
			filterNGOs(value);
			return;
		}
		const term = String(value || '').trim().toLowerCase();
		if (!term) return;

		const pages = getAllowedPages().filter((key) => navItems[key].label.toLowerCase().includes(term));
		if (pages[0]) {
			showPage(pages[0]);
			showToast(`Navigated to ${navItems[pages[0]].label}.`, 'info');
		}
	}

	function filterCampaigns(value) {
		state.campaignSearch = String(value || state.campaignSearch || '').trim();
		renderCampaignGrid();
	}

	function filterNGOs(value) {
		state.ngoSearch = String(value || '').trim().toLowerCase();
		renderNGOTable();
	}

	function updateChart(_range) {
		if (PLACEHOLDER_MODE) {
			showToast('Analytics is in placeholder mode until backend is connected.', 'info');
			return;
		}
		renderCharts();
		showToast('Chart updated.', 'info');
	}

	function exportReport() {
		showToast('Report export started.', 'success');
	}

	function markAllRead() {
		data.notifications = data.notifications.map((n) => ({ ...n, read: true }));
		renderNotifications();
		showToast('All notifications marked as read.', 'success');
	}

	function openModal(id) {
		qs(id)?.classList.add('open');
	}

	function closeModal(id) {
		qs(id)?.classList.remove('open');
	}

	function handleOverlay(event, id) {
		if (event.target && event.target.id === id) {
			closeModal(id);
		}
	}

	function dashPrimaryAction() {
		if (state.role === 'ngo') {
			openModal('createCampaignModal');
		} else {
			openModal('createUserModal');
		}
	}

	function applyCampaignTemplate() {
		const map = {
			scholarship: {
				title: 'Scholarship Support Program',
				category: 'Education',
				goal: 100000,
				description: 'Provide school tuition, supplies, and mentoring for underserved students.'
			},
			healthMission: {
				title: 'Community Medical Mission',
				category: 'Health',
				goal: 75000,
				description: 'Fund medicines, checkups, and medical volunteers for barangay outreach.'
			},
			disasterRelief: {
				title: 'Disaster Relief Drive',
				category: 'Natural Disasters',
				goal: 150000,
				description: 'Collect emergency kits, food packs, and shelter essentials for affected families.'
			},
			communitySupport: {
				title: 'Livelihood Starter Kits',
				category: 'Community',
				goal: 60000,
				description: 'Provide livelihood toolkits and micro-support for community members.'
			}
		};

		const selected = map[qs('campaignTemplate')?.value || ''];
		if (!selected) return;

		if (qs('campaignTitleInput')) qs('campaignTitleInput').value = selected.title;
		if (qs('campaignCategoryInput')) qs('campaignCategoryInput').value = selected.category;
		if (qs('campaignGoalInput')) qs('campaignGoalInput').value = selected.goal;
		if (qs('campaignDescriptionInput')) qs('campaignDescriptionInput').value = selected.description;
	}

	async function refreshNgoCampaigns() {
		if (!state.ngoId) return;
		try {
			const res = await CampaignAPI.list({ ngoId: state.ngoId, limit: 100 });
			const campaigns = res.campaigns || [];
			data.campaigns = campaigns.map((c) => ({
				id: c.id,
				title: c.title,
				category: c.category,
				status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
				raised: Number(c.currentAmount || 0),
				goal: Number(c.targetAmount || 0),
				donors: 0,
				rejectionReason: c.rejectionReason || null
			}));
			renderCampaignGrid();
		} catch (_err) {
			// keep existing list on failure
		}
	}

	async function saveCampaign() {
		const title = String(qs('campaignTitleInput')?.value || '').trim();
		const category = String(qs('campaignCategoryInput')?.value || '').trim();
		const goal = Number(qs('campaignGoalInput')?.value || 0);
		const description = String(qs('campaignDescriptionInput')?.value || '').trim();

		if (!title) { showToast('Campaign title is required.', 'error'); return; }
		if (!category) { showToast('Campaign category is required.', 'error'); return; }
		if (!(goal > 0)) { showToast('Goal amount must be greater than zero.', 'error'); return; }

		try {
			await CampaignAPI.create({
				title,
				category,
				description: description || 'No description provided.',
				targetAmount: goal,
				ngoId: state.ngoId
			});
			showToast('Campaign saved as draft.', 'success');
			closeModal('createCampaignModal');
			await refreshNgoCampaigns();
		} catch (_err) {
			showToast('Failed to save campaign. Please try again.', 'error');
		}
	}

	async function submitCampaign() {
		const title = String(qs('campaignTitleInput')?.value || '').trim();
		const category = String(qs('campaignCategoryInput')?.value || '').trim();
		const goal = Number(qs('campaignGoalInput')?.value || 0);
		const description = String(qs('campaignDescriptionInput')?.value || '').trim();

		const bankName = String(qs('campaignBankNameInput')?.value || '').trim();
		const bankAccount = String(qs('campaignBankAccountInput')?.value || '').trim();
		const bankPayee = String(qs('campaignBankPayeeInput')?.value || '').trim();
		const gcashNumber = String(qs('campaignGCashInput')?.value || '').trim();
		const paymayaNumber = String(qs('campaignPayMayaInput')?.value || '').trim();

		if (!title) { showToast('Campaign title is required.', 'error'); return; }
		if (!category) { showToast('Campaign category is required.', 'error'); return; }
		if (!(goal > 0)) { showToast('Goal amount must be greater than zero.', 'error'); return; }
		if (!(bankName && bankAccount && bankPayee) && !gcashNumber && !paymayaNumber) {
			showToast('Add a bank account or at least one e-wallet number.', 'error');
			return;
		}

		try {
			const createRes = await CampaignAPI.create({
				title,
				category,
				description: description || 'No description provided.',
				targetAmount: goal,
				ngoId: state.ngoId
			});
			const newId = createRes.campaign && createRes.campaign.id;
			if (newId) {
				await CampaignAPI.submitForApproval(newId);
			}
			showToast('Campaign submitted for approval.', 'success');
			closeModal('createCampaignModal');
			await refreshNgoCampaigns();
		} catch (_err) {
			showToast('Failed to submit campaign. Please try again.', 'error');
		}
	}

	function openCampaignDetail(id) {
		const campaign = data.campaigns.find((c) => String(c.id) === String(id));
		if (!campaign) return;

		if (qs('cdTitle')) qs('cdTitle').textContent = campaign.title;
		if (qs('cdBody')) {
			const progress = campaign.goal > 0
				? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
				: 0;
			const rejectionBlock = campaign.rejectionReason
				? `<p style="background:#fff0f0;border-left:4px solid #d94f4f;padding:10px 14px;border-radius:4px;margin-top:12px;font-size:13px"><strong>Rejection reason:</strong> ${campaign.rejectionReason}</p>`
				: '';
			qs('cdBody').innerHTML = `
				<p style="color:var(--text-mid);margin-bottom:10px">Category: <strong>${campaign.category}</strong></p>
				<p style="color:var(--text-mid);margin-bottom:8px">Raised: ${fmtMoney(campaign.raised)} of ${fmtMoney(campaign.goal)} (${progress}%)</p>
				<p style="color:var(--text-mid);margin-bottom:4px">Status: <span class="badge ${badgeClass(campaign.status)}">${campaign.status}</span></p>
				${rejectionBlock}
			`;
		}
		if (qs('cdFooter')) {
			qs('cdFooter').innerHTML = '<button class="btn btn-ghost btn-sm" onclick="closeModal(\'campaignDetailModal\')">Close</button>';
		}
		openModal('campaignDetailModal');
	}

	function openApprovalModal(mode, index) {
		const row = data.approvals[index];
		if (!row) return;

		const isReject = mode === 'reject';
		if (qs('approvalTitle')) qs('approvalTitle').textContent = isReject ? 'Reject Campaign' : 'Approve Campaign';
		if (qs('approvalDesc')) qs('approvalDesc').textContent = `${isReject ? 'Reject' : 'Approve'} "${row.campaign}" from ${row.ngo}?`;

		const feedbackGroup = qs('approvalFeedback') && qs('approvalFeedback').closest('.form-group');
		const feedbackTextarea = qs('approvalFeedback');
		if (feedbackTextarea) feedbackTextarea.value = '';
		if (feedbackGroup) {
			const label = feedbackGroup.querySelector('.form-label');
			if (label) label.textContent = isReject ? 'Rejection reason (sent to NGO)' : 'Notes (optional)';
			feedbackTextarea.placeholder = isReject ? 'Explain why the campaign was rejected…' : 'Add any notes for the NGO…';
			feedbackTextarea.required = isReject;
		}

		if (qs('approvalFooter')) {
			qs('approvalFooter').innerHTML = `
				<button class="btn btn-ghost btn-sm" onclick="closeModal('approvalModal')">Cancel</button>
				<button class="btn ${isReject ? 'btn-danger' : 'btn-success'} btn-sm" onclick="submitApproval('${mode}', ${index})">Confirm</button>
			`;
		}

		openModal('approvalModal');
	}

	async function submitApproval(mode, index) {
		const row = data.approvals[index];
		if (!row) return;

		const reason = (qs('approvalFeedback')?.value || '').trim() || null;

		if (mode === 'reject' && !reason) {
			showToast('Please provide a rejection reason.', 'error');
			return;
		}

		try {
			if (mode === 'approve') {
				await CampaignAPI.approve(row.id);
			} else {
				await CampaignAPI.reject(row.id, reason);
			}
			data.approvals.splice(index, 1);
			renderApprovals();
			closeModal('approvalModal');
			showToast(`Campaign ${mode === 'approve' ? 'approved' : 'rejected'}: ${row.campaign}`, 'success');
		} catch (_err) {
			showToast('Action failed. Please try again.', 'error');
		}
	}

	function createUser() {
		const role = qs('newUserRole')?.value || 'admin';
		const generatedId = qs('generatedId')?.value || 'USR-000';
		showToast(`User created (${role.toUpperCase()} · ${generatedId}).`, 'success');
		closeModal('createUserModal');
	}

	function createNGO() {
		showToast('NGO registration saved.', 'success');
		closeModal('createNGOModal');
	}

	function updateUserForm() {
		const role = qs('newUserRole')?.value || 'admin';
		const prefix = role === 'superadmin' ? 'SUP' : role === 'ngo' ? 'NGO' : 'ADM';
		if (qs('generatedId')) qs('generatedId').value = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
		if (qs('genPassword')) qs('genPassword').textContent = `Kb@Tmp${Math.floor(1000 + Math.random() * 9000)}!`;
	}

	async function logout() {
		localStorage.removeItem(SESSION_KEY);
		showToast('Signing out...', 'info');
		try { await AuthAPI.logout(); } catch (_err) { /* ignore */ }
		setTimeout(function () {
			window.location.href = 'AdminLogIn.html';
		}, 450);
	}

	function bindOutsideClick() {
		document.addEventListener('click', function (event) {
			const avatarBtn = qs('avatarBtn');
			const avatarDd = qs('avatarDd');
			if (!avatarBtn || !avatarDd) return;

			if (!avatarDd.contains(event.target) && !avatarBtn.contains(event.target)) {
				avatarDd.classList.remove('open');
			}
		});
	}

	async function init() {
		const account = readAccountContext();
		const roleFromURL = getRoleFromURL();
		state.role = account.role || roleFromURL || localStorage.getItem(ROLE_KEY) || 'superadmin';
		state.accountName = account.name;
		state.accountEmail = account.email;
		state.theme = localStorage.getItem(THEME_KEY) || 'light';
		localStorage.setItem(ROLE_KEY, state.role);

		setTheme(state.theme);
		applyRoleProfile();
		renderRoleSwitcher();
		renderSidebarNav();

		await loadDashboardData();

		if (state.role === 'ngo') {
			try {
				const profileRes = await NGOAPI.getMyProfile();
				state.ngoId = profileRes.profile && profileRes.profile.id ? profileRes.profile.id : null;
				if (state.ngoId) {
					await loadNgoAnalytics();
				}
			} catch (_err) {
				// ngoId stays null; analytics shows empty state
			}
		}

		renderDashboardStats();
		renderActivityFeed();
		renderTopCampaigns();
		renderCampaignGrid();
		renderAnalyticsStats();
		renderAnalyticsActivityFeed();
		renderNGOTable();
		renderUserTable();
		renderApprovals();
		renderModeration();
		renderSupport();
		renderNotifications();
		renderLogs();
		renderSettings();
		updateUserForm();
		renderCharts();
		bootstrapSessionTimer();
		bindOutsideClick();

		showPage(state.currentPage);
	}

	window.showPage = showPage;
	window.toggleSidebar = toggleSidebar;
	window.toggleDropdown = toggleDropdown;
	window.toggleDark = toggleDark;
	window.globalFilter = globalFilter;
	window.filterCampaigns = filterCampaigns;
	window.filterNGOs = filterNGOs;
	window.updateChart = updateChart;
	window.exportReport = exportReport;
	window.markAllRead = markAllRead;
	window.openModal = openModal;
	window.closeModal = closeModal;
	window.handleOverlay = handleOverlay;
	window.dashPrimaryAction = dashPrimaryAction;
	window.applyCampaignTemplate = applyCampaignTemplate;
	window.saveCampaign = saveCampaign;
	window.submitCampaign = submitCampaign;
	window.openCampaignDetail = openCampaignDetail;
	window.openApprovalModal = openApprovalModal;
	window.submitApproval = submitApproval;
	window.createUser = createUser;
	window.createNGO = createNGO;
	window.updateUserForm = updateUserForm;
	window.showToast = showToast;
	window.logout = logout;

	init();
})();
