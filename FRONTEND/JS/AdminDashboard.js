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
		user: null,
		ngoProfile: null,
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
		campaigns: [],
		ngos: [],
		users: [],
		approvals: [],
		moderation: [],
		support: [],
		notifications: [],
		logs: [],
		ngoAnalytics: null
	};

	function qs(id) {
		return document.getElementById(id);
	}

	function fmtMoney(value) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value || 0);
	}

	function escHtml(text) {
		const d = document.createElement('div');
		d.appendChild(document.createTextNode(String(text || '')));
		return d.innerHTML;
	}

	function emptyBlock(title, copy) {
		return `<div class="empty-state" style="padding:24px 10px"><h3>${title}</h3><p>${copy}</p></div>`;
	}

	function tableEmpty(colspan, message) {
		return `<tr><td colspan="${colspan}" style="text-align:center;padding:24px;color:var(--text-soft)">${message}</td></tr>`;
	}

	function normalizeStatus(status) {
		const raw = String(status || '').trim();
		if (!raw) return 'Pending';
		return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
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

	async function readSessionAccount() {
		try {
			const res = await AuthAPI.getMe();
			const user = res.user || null;
			const role = mapRole(user && user.role);
			if (!user || !role) return null;

			const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
			localStorage.setItem('kb.auth.user', JSON.stringify(user));
			localStorage.setItem('kb.auth.role', user.role || '');
			localStorage.setItem('kb.auth.name', name || '');
			localStorage.setItem('kb.auth.email', user.email || '');

			return {
				role,
				name,
				email: user.email || ''
			};
		} catch (_error) {
			return null;
		}
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

		if (!feed.length) {
			host.innerHTML = emptyBlock('No recent activity', 'Activity will appear here after database events are recorded.');
			return;
		}

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

		if (!sorted.length) {
			host.innerHTML = emptyBlock('No campaign data', 'Top campaigns will appear when campaigns exist in the database.');
			return;
		}

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

        const canAct = state.role === 'admin' || state.role === 'superadmin';

		const rows = data.ngos
			.filter((ngo) => !state.ngoSearch || ngo.name.toLowerCase().includes(state.ngoSearch))
			.map((ngo) => `
				<tr>
					<td>
						<strong>${escHtml(ngo.name)}</strong>
						<div style="font-size:11px;color:var(--text-soft);margin-top:2px">${escHtml(ngo.registrationNumber || '')}</div>
					</td>
					<td>
						<div>${escHtml(ngo.contact || '—')}</div>
						<div style="font-size:11px;color:var(--text-soft)">${escHtml(ngo.email || '')}</div>
					</td>
					<td><span class="badge ${badgeClass(ngo.status)}">${ngo.status}</span></td>
					<td>${ngo.campaigns}</td>
					<td>${fmtMoney(ngo.raised)}</td>
					${canAct ? `<td class="td-actions">
						${ngo.status !== 'Verified' ? `<button class="btn btn-success btn-sm" onclick="verifyNGO('${ngo.id}')">Verify</button>` : ''}
						${ngo.status !== 'Rejected' ? `<button class="btn btn-danger btn-sm" onclick="rejectNGO('${ngo.id}')">Reject</button>` : ''}
						<button class="btn btn-ghost btn-sm" onclick="editNGO('${ngo.id}')">Edit</button>
						<button class="btn btn-danger btn-sm" onclick="deleteNGO('${ngo.id}')">Delete</button>
					</td>` : ''}
				</tr>
			`).join('');

		const actionsHeader = canAct ? '<th>Actions</th>' : '';

		table.innerHTML = `
			<thead><tr><th>Organization</th><th>Contact</th><th>Status</th><th>Campaigns</th><th>Raised</th>${actionsHeader}</tr></thead>
			<tbody>${rows || tableEmpty(canAct ? 6 : 5, 'No NGO records found.')}</tbody>
		`;
	}

	function renderUserTable() {
		const table = qs('userTable');
		if (!table) return;

		const isSuperAdmin = state.role === 'superadmin';
		const rows = data.users.map((user) => `
			<tr>
				<td>
					<strong>${escHtml(user.name)}</strong>
					<div style="font-size:11px;color:var(--text-soft);margin-top:2px">#${user.id}</div>
				</td>
				<td>${escHtml(user.email)}</td>
				<td><span class="badge badge-${user.role}">${user.role}</span></td>
				<td><span class="badge badge-approved">Active</span></td>
				<td style="font-size:12px;color:var(--text-soft)">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : '—'}</td>
				${isSuperAdmin ? `<td class="td-actions">
					<select class="filter-select" style="font-size:11px;padding:4px 8px;height:auto"
					        onchange="changeUserRole('${user.id}', this.value)" title="Change role">
						<option value="donor"      ${user.role==='donor'      ? 'selected':''}>Donor</option>
						<option value="ngo_admin"  ${user.role==='ngo' || user.role==='ngo_admin' ? 'selected':''}>NGO</option>
						<option value="admin"      ${user.role==='admin'      ? 'selected':''}>Admin</option>
						<option value="superadmin" ${user.role==='superadmin' ? 'selected':''}>Super Admin</option>
					</select>
					<button class="btn btn-danger btn-sm" onclick="deleteUserAccount('${user.id}')">Delete</button>
				</td>` : ''}
			</tr>
		`).join('');

		const actionsHeader = isSuperAdmin ? '<th>Actions</th>' : '';

		table.innerHTML = `
			<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>${actionsHeader}</tr></thead>
			<tbody>${rows || tableEmpty(isSuperAdmin ? 6 : 5, 'No user records found.')}</tbody>
		`;
	}

	function renderApprovals() {
		const table = qs('approvalTable');
		if (!table) return;

		const rows = data.approvals.map((row, idx) => `
			<tr>
				<td><strong>${escHtml(row.title)}</strong></td>
				<td>${escHtml(row.typeLabel)}</td>
				<td>${escHtml(row.owner)}</td>
				<td>${escHtml(row.requested)}</td>
				<td>${row.amount !== null && row.amount !== undefined ? fmtMoney(row.amount) : 'N/A'}</td>
				<td class="td-actions">
					<button class="btn btn-success btn-sm" onclick="openApprovalModal('approve', ${idx})">Approve</button>
					<button class="btn btn-danger btn-sm" onclick="openApprovalModal('reject', ${idx})">Reject</button>
				</td>
			</tr>
		`).join('');

		table.innerHTML = `
			<thead><tr><th>Application</th><th>Type</th><th>Submitted By</th><th>Date</th><th>Amount</th><th>Action</th></tr></thead>
			<tbody>${rows || tableEmpty(6, 'No pending approvals.')}</tbody>
		`;
	}

	function renderModeration() {
		const table = qs('moderationTable');
		if (!table) return;

		const rows = data.moderation.map((row) => `
			<tr>
				<td><strong>${escHtml(row.campaign)}</strong></td>
				<td>${escHtml(row.reason)}</td>
				<td><span class="badge ${row.severity === 'High' ? 'badge-flagged' : 'badge-pending'}">${escHtml(row.severity)}</span></td>
				<td><button class="btn btn-warn btn-sm" onclick="showToast('Flag under review.','info')">Review</button></td>
			</tr>
		`).join('');

		table.innerHTML = `
			<thead><tr><th>Campaign</th><th>Reason</th><th>Severity</th><th>Action</th></tr></thead>
			<tbody>${rows || tableEmpty(4, 'No moderation records found.')}</tbody>
		`;
	}

	function renderSupport() {
		const table = qs('supportTable');
		if (!table) return;

		const rows = data.support.map((row) => `
			<tr>
				<td><strong>${escHtml(row.org)}</strong></td>
				<td>${escHtml(row.ticket)}</td>
				<td>${escHtml(row.concern)}</td>
				<td><span class="badge ${row.status === 'Open' ? 'badge-pending' : 'badge-approved'}">${escHtml(row.status)}</span></td>
			</tr>
		`).join('');

		table.innerHTML = `
			<thead><tr><th>Organization</th><th>Ticket</th><th>Concern</th><th>Status</th></tr></thead>
			<tbody>${rows || tableEmpty(4, 'No support requests found.')}</tbody>
		`;
	}

	function renderNotifications() {
		const list = qs('notifList');
		if (!list) return;
		document.querySelectorAll('.notif-dot').forEach((dot) => {
			dot.style.display = data.notifications.some((n) => !n.read) ? '' : 'none';
		});

		if (!data.notifications.length) {
			list.innerHTML = emptyBlock('No notifications', 'Notifications will appear here when records are available.');
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

	function renderLogs(filterAction, filterDate) {
		const table = qs('logsTable');
		if (!table) return;

		const actionColors = {
			LOGIN: '#4a9cc7', LOGOUT: '#888',
			CREATE_CAMPAIGN: '#2e9e6e', EDIT_CAMPAIGN: '#F39C12', DELETE_CAMPAIGN: '#E74C3C',
			DONATE: '#27AE60',
			APPROVE: '#2e9e6e', REJECT: '#E74C3C',
			UPDATE_ROLE: '#9b59b6', DELETE_USER: '#E74C3C',
		};

		let logs = data.logs;
		if (filterAction && filterAction !== 'all') {
			logs = logs.filter((l) => l.action === filterAction);
		}
		if (filterDate) {
			logs = logs.filter((l) => l.rawDate && l.rawDate.slice(0, 10) === filterDate);
		}

		const rows = logs.map((row) => {
			const color = actionColors[row.action] || '#999';
			const label = row.action.replace(/_/g, ' ');
			return `
				<tr class="log-row">
					<td style="white-space:nowrap;font-size:12px">${row.date}</td>
					<td><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${color}22;color:${color};letter-spacing:0.3px">${label}</span></td>
					<td>
						<strong>${escHtml(row.actorName || row.actor)}</strong>
						<div style="font-size:11px;color:var(--text-soft)">${escHtml(row.actorEmail || '')}</div>
					</td>
					<td style="font-size:13px">${escHtml(row.detail)}</td>
				</tr>
			`;
		}).join('');


		table.innerHTML = `
			<thead><tr><th>Date / Time</th><th>Action</th><th>Actor</th><th>Details</th></tr></thead>
			<tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-soft)">No activity logs found.</td></tr>'}</tbody>
		`;
	}

	function renderSettings() {
		const general = qs('settingsGeneral');
		const security = qs('settingsSecurity');
		if (!general || !security) return;

		// General Settings Form
		general.innerHTML = `
			<div class="form-grid">
				<div class="form-group">
					<label class="form-label">First Name</label>
					<input id="settingsFirstName" class="form-input" type="text" placeholder="Your first name" value="${escHtml(state.user?.firstName || '')}"/>
				</div>
				<div class="form-group">
					<label class="form-label">Last Name</label>
					<input id="settingsLastName" class="form-input" type="text" placeholder="Your last name" value="${escHtml(state.user?.lastName || '')}"/>
				</div>
				<div class="form-group form-full">
					<label class="form-label">Email Address</label>
					<input id="settingsEmail" class="form-input" type="email" placeholder="your@email.com" value="${escHtml(state.user?.email || '')}" disabled/>
					<div style="font-size:11px;color:var(--text-soft);margin-top:4px">Email cannot be changed directly. Contact support to update.</div>
				</div>
				${state.role === 'ngo' ? `
					<div class="form-group form-full">
						<label class="form-label">Organization Name</label>
						<input id="settingsOrgName" class="form-input" type="text" placeholder="Organization name" value="${escHtml(state.ngoProfile?.name || '')}"/>
					</div>
					<div class="form-group form-full">
						<label class="form-label">Organization Address</label>
						<input id="settingsOrgAddress" class="form-input" type="text" placeholder="Street address" value="${escHtml(state.ngoProfile?.address || '')}"/>
					</div>
					<div class="form-group">
						<label class="form-label">Phone Number</label>
						<input id="settingsOrgPhone" class="form-input" type="tel" placeholder="09XX XXX XXXX" value="${escHtml(state.ngoProfile?.phoneNumber || '')}"/>
					</div>
					<div class="form-group">
						<label class="form-label">Website</label>
						<input id="settingsOrgWebsite" class="form-input" type="url" placeholder="https://organization.com" value="${escHtml(state.ngoProfile?.websiteUrl || '')}"/>
					</div>
					<div class="form-group form-full">
						<label class="form-label">Organization Description</label>
						<textarea id="settingsOrgDescription" class="form-input" placeholder="Tell us about your organization…" style="min-height:100px">${escHtml(state.ngoProfile?.description || '')}</textarea>
					</div>
				` : ''}
			</div>
		`;

		// Security Settings Form
		security.innerHTML = `
			<div class="form-grid">
				<div class="form-group form-full">
					<label class="form-label">Current Password</label>
					<input id="settingsCurrentPwd" class="form-input" type="password" placeholder="Enter your current password"/>
				</div>
				<div class="form-group form-full">
					<label class="form-label">New Password</label>
					<input id="settingsNewPwd" class="form-input" type="password" placeholder="Enter new password (min. 8 characters)"/>
				</div>
				<div class="form-group form-full">
					<label class="form-label">Confirm New Password</label>
					<input id="settingsConfirmPwd" class="form-input" type="password" placeholder="Confirm new password"/>
					<div style="font-size:11px;color:var(--text-soft);margin-top:4px">Leave blank to keep current password unchanged.</div>
				</div>
			</div>
		`;

		// Show card footers with save buttons
		document.querySelectorAll('#page-settings .card-footer').forEach((footer) => {
			footer.style.display = 'block';
		});

		// Update button handlers
		const generalFooter = document.querySelector('#page-settings .card:nth-child(1) .card-footer');
		const securityFooter = document.querySelector('#page-settings .card:nth-child(2) .card-footer');
		
		if (generalFooter) {
			generalFooter.querySelector('button').onclick = saveGeneralSettings;
		}
		if (securityFooter) {
			securityFooter.querySelector('button').onclick = saveSecuritySettings;
		}
	}

	async function saveGeneralSettings() {
		const firstName = (qs('settingsFirstName')?.value || '').trim();
		const lastName = (qs('settingsLastName')?.value || '').trim();
		
		if (!firstName || !lastName) {
			showToast('First name and last name are required.', 'error');
			return;
		}

		try {
			const payload = { firstName, lastName };

			// For NGO users, also update organization profile
			if (state.role === 'ngo') {
				const orgName = (qs('settingsOrgName')?.value || '').trim();
				const orgAddress = (qs('settingsOrgAddress')?.value || '').trim();
				const orgPhone = (qs('settingsOrgPhone')?.value || '').trim();
				const orgWebsite = (qs('settingsOrgWebsite')?.value || '').trim();
				const orgDescription = (qs('settingsOrgDescription')?.value || '').trim();

				if (state.ngoProfile?.id) {
					await NGOAPI.update(state.ngoProfile.id, {
						name: orgName || null,
						address: orgAddress || null,
						phoneNumber: orgPhone || null,
						websiteUrl: orgWebsite || null,
						description: orgDescription || null
					});
				}
			}

			// Update user profile
			await AuthAPI.updateMe(payload);
			
			// Refresh data
			const meRes = await AuthAPI.getMe();
			Object.assign(state.user, meRes.user);
			
			showToast('Profile updated successfully!', 'success');
			renderSettings();
		} catch (err) {
			showToast(err.message || 'Failed to update profile.', 'error');
		}
	}

	async function saveSecuritySettings() {
		const currentPwd = qs('settingsCurrentPwd')?.value || '';
		const newPwd = qs('settingsNewPwd')?.value || '';
		const confirmPwd = qs('settingsConfirmPwd')?.value || '';

		// Only attempt to change password if new password is provided
		if (!newPwd && !confirmPwd) {
			showToast('No password changes to save.', 'info');
			return;
		}

		if (!currentPwd) {
			showToast('Please enter your current password.', 'error');
			return;
		}

		if (newPwd.length < 8) {
			showToast('New password must be at least 8 characters.', 'error');
			return;
		}

		if (newPwd !== confirmPwd) {
			showToast('New passwords do not match.', 'error');
			return;
		}

		try {
			// For now, show a message that this requires reauthentication
			// In a real app, you'd validate current password on backend
			showToast('Password change feature coming soon. Please contact support.', 'info');
			// TODO: Implement actual password change API endpoint
		} catch (err) {
			showToast(err.message || 'Failed to update security settings.', 'error');
		}
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

	function showChartEmpty(id) {
		const canvas = qs(id);
		const wrap = canvas && canvas.parentElement;
		if (!wrap) return;
		canvas.style.display = 'none';
		let empty = wrap.querySelector('[data-chart-empty]');
		if (!empty) {
			empty = document.createElement('div');
			empty.setAttribute('data-chart-empty', 'true');
			wrap.appendChild(empty);
		}
		empty.className = 'empty-state';
		empty.style.padding = '24px 12px';
		empty.innerHTML = `
			<h3>No analytics data</h3>
			<p>Charts will appear when donation or campaign analytics are available.</p>
		`;
	}

	function restoreChartCanvas(id) {
		const canvas = qs(id);
		const wrap = canvas && canvas.parentElement;
		if (!wrap) return;
		canvas.style.display = '';
		const empty = wrap.querySelector('[data-chart-empty]');
		if (empty) empty.remove();
	}

	function renderCharts() {
		destroyCharts();

		const chartIds = ['donationChart', 'statusChart', 'dailyChart', 'categoryChart', 'donorChart'];
		const ngoA = state.role === 'ngo' ? data.ngoAnalytics : null;
		const dailyDonations = ngoA && Array.isArray(ngoA.dailyDonations) ? ngoA.dailyDonations : [];
		const campaigns = ngoA && Array.isArray(ngoA.campaigns) ? ngoA.campaigns : [];
		const monthlyDonors = ngoA && Array.isArray(ngoA.monthlyDonors) ? ngoA.monthlyDonors : [];
		const hasAnalytics = dailyDonations.length || campaigns.length || monthlyDonors.length;

		if (PLACEHOLDER_MODE || !hasAnalytics) {
			chartIds.forEach(showChartEmpty);
			return;
		}

		if (!window.Chart) return;
		chartIds.forEach(restoreChartCanvas);

		const palette = chartPalette();
		window.Chart.defaults.color = palette.text;
		window.Chart.defaults.borderColor = palette.grid;

		const dailyLabels = dailyDonations.map((d) => d.date.slice(5));
		const dailyAmounts = dailyDonations.map((d) => d.amount);

		state.charts.donation = createChart('donationChart', {
			type: 'line',
			data: {
				labels: dailyLabels,
				datasets: [{
					label: 'Donations',
					data: dailyAmounts,
					borderColor: '#4a9cc7',
					backgroundColor: 'rgba(74,156,199,0.2)',
					tension: 0.35,
					fill: true
				}]
			},
			options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
		});

		const statusCounts = campaigns.reduce((acc, c) => {
			const key = normalizeStatus(c.status);
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		state.charts.status = createChart('statusChart', {
			type: 'doughnut',
			data: {
				labels: Object.keys(statusCounts),
				datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#2e9e6e', '#c9a84c', '#d94f4f', '#4a9cc7', '#7c4de8'] }]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});

		state.charts.daily = createChart('dailyChart', {
			type: 'bar',
			data: {
				labels: dailyLabels,
				datasets: [{ label: 'PHP', data: dailyAmounts, backgroundColor: '#4a9cc7' }]
			},
			options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
		});

		const categoryLabels = campaigns.slice(0, 6).map((c) => c.title.length > 20 ? `${c.title.slice(0, 20)}...` : c.title);
		const categoryAmounts = campaigns.slice(0, 6).map((c) => c.currentAmount);

		state.charts.category = createChart('categoryChart', {
			type: 'pie',
			data: {
				labels: categoryLabels,
				datasets: [{ data: categoryAmounts, backgroundColor: ['#4a9cc7', '#2e9e6e', '#d4821a', '#7c4de8', '#c9a84c', '#d94f4f'] }]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});

		const donorLabels = monthlyDonors.map((m) => m.month);
		const donorCounts = monthlyDonors.map((m) => m.count);

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
			const hasNgoStats = !!(a && (a.totalDonations || a.totalDonationCount || a.uniqueDonors || (a.campaigns && a.campaigns.length)));
			if (!hasNgoStats) {
				host.innerHTML = emptyBlock('No analytics records', 'Analytics will appear when this NGO has campaign or donation records.');
				return;
			}
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

		host.innerHTML = emptyBlock('No analytics records', 'Platform analytics will appear when analytics records are available in the database.');
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
			let currentNgoProfile = null;
			if (state.role === 'ngo' && !state.ngoId) {
				try {
					const profileRes = await NGOAPI.getMyProfile();
					currentNgoProfile = profileRes.profile || null;
					state.ngoId = currentNgoProfile && currentNgoProfile.id ? currentNgoProfile.id : null;
				} catch (_profileErr) {
					currentNgoProfile = null;
				}
			}

			const campaignFilters = { limit: 100 };
			if (state.role === 'ngo' && state.ngoId) campaignFilters.ngoId = state.ngoId;

			const campaignsPromise = CampaignAPI.list(campaignFilters);
			const usersPromise = state.role === 'ngo' ? Promise.resolve({ users: [] }) : AdminAPI.getAllUsers({ limit: 100 });
			const ngosPromise = state.role === 'ngo'
				? Promise.resolve({ profiles: currentNgoProfile ? [currentNgoProfile] : [] })
				: NGOAPI.list({ limit: 100 });
			const logsPromise = state.role === 'ngo' ? Promise.resolve({ logs: [] }) : AdminAPI.getActivityLogs({ limit: 50 });

			const [campaignsRes, usersRes, ngosRes, logsRes] = await Promise.all([
				campaignsPromise,
				usersPromise,
				ngosPromise,
				logsPromise
			]);

			const campaigns = campaignsRes.campaigns || [];
			const users = usersRes.users || [];
			const ngos = ngosRes.profiles || ngosRes.ngos || [];
			const logs = logsRes.logs || [];

			data.campaigns = campaigns.map((c) => ({
				id: c.id,
				title: c.title,
				category: c.category,
				status: normalizeStatus(c.status),
				raised: Number(c.currentAmount || 0),
				goal: Number(c.targetAmount || 0),
				donors: 0,
				rejectionReason: c.rejectionReason || null,
				ngoId: c.ngoId,
				createdAt: c.createdAt
			}));

			data.users = users.map((u) => ({
				name: u.fullName || `${u.firstName} ${u.lastName}`.trim(),
				email: u.email || '',
				role: u.role || '',
				id: u.id,
				createdAt: u.createdAt
			}));

			data.ngos = ngos.map((n) => ({
				name: n.name,
				contact: n.phoneNumber || '',
				email: n.email || '',
				registrationNumber: n.registrationNumber || '',
				status: normalizeStatus(n.verificationStatus),
				campaigns: 0,
				raised: 0,
				id: n.id,
				websiteUrl: n.websiteUrl || '',
				address: n.address || '',
				description: n.description || ''
			}));

			const ngoMap = {};
			ngos.forEach((n) => { ngoMap[String(n.id)] = n.name; });

			const campaignApprovals = campaigns
				.filter((c) => String(c.status || '').toLowerCase() === 'pending')
				.map((c) => ({
					type: 'campaign',
					typeLabel: 'Campaign',
					title: c.title,
					owner: ngoMap[String(c.ngoId)] || `NGO #${c.ngoId}`,
					requested: new Date(c.createdAt).toISOString().slice(0, 10),
					amount: Number(c.targetAmount || 0),
					id: c.id
				}));

			const ngoApprovals = ngos
				.filter((n) => String(n.verificationStatus || '').toLowerCase() === 'pending')
				.map((n) => ({
					type: 'ngo',
					typeLabel: 'NGO Registration',
					title: n.name,
					owner: n.registrationNumber || `NGO #${n.id}`,
					requested: n.createdAt ? new Date(n.createdAt).toISOString().slice(0, 10) : '',
					amount: null,
					id: n.id
				}));

			data.approvals = [...campaignApprovals, ...ngoApprovals];
			data.moderation = campaigns
				.filter((c) => ['flagged', 'reported'].includes(String(c.status || '').toLowerCase()))
				.map((c) => ({
					campaign: c.title,
					reason: c.rejectionReason || 'Flagged for review',
					severity: 'High',
					id: c.id
				}));
			data.support = [];
			data.notifications = [];
			data.logs = logs.map((l) => ({
				date: new Date(l.createdAt).toLocaleString('en-PH'),
				rawDate: l.createdAt,
				action: l.action,
				actor: l.actorName || l.adminId,
				actorName: l.actorName || null,
				actorEmail: l.actorEmail || null,
				detail: l.description || `${l.action} on ${l.entityType}`
			}));
		} catch (_err) {
			data.campaigns = [];
			data.ngos = [];
			data.users = [];
			data.approvals = [];
			data.moderation = [];
			data.support = [];
			data.notifications = [];
			data.logs = [];
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
    function filterLogs() {
		const actionEl = document.querySelector('#page-activity-logs .filter-select');
		const dateEl   = document.querySelector('#page-activity-logs input[type="date"]');
		const action   = actionEl ? actionEl.value : '';
		const date     = dateEl   ? dateEl.value   : '';
		renderLogs(action, date);
	}

	async function verifyNGO(id) {
		if (!confirm('Mark this NGO as Verified?')) return;
		try {
			await NGOAPI.verify(id);
			showToast('NGO verified.', 'success');
			await loadDashboardData();
			renderNGOTable();
		} catch (err) {
			showToast(err.message || 'Failed to verify NGO.', 'error');
		}
	}

	async function rejectNGO(id) {
		if (!confirm('Reject this NGO? This will mark them as rejected.')) return;
		try {
			await NGOAPI.reject(id);
			showToast('NGO rejected.', 'info');
			await loadDashboardData();
			renderNGOTable();
		} catch (err) {
			showToast(err.message || 'Failed to reject NGO.', 'error');
		}
	}

	async function changeUserRole(userId, newRole) {
		if (!confirm(`Change this user's role to "${newRole}"?`)) {
			renderUserTable();
			return;
		}
		try {
			await AdminAPI.updateUserRole(userId, newRole);
			showToast(`Role updated to ${newRole}.`, 'success');
			const idx = data.users.findIndex((u) => String(u.id) === String(userId));
			if (idx !== -1) data.users[idx].role = newRole;
			renderUserTable();
		} catch (err) {
			showToast(err.message || 'Failed to update role.', 'error');
			renderUserTable();
		}
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
				status: normalizeStatus(c.status),
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
		const itemLabel = row.type === 'ngo' ? 'NGO Registration' : 'Campaign';
		if (qs('approvalTitle')) qs('approvalTitle').textContent = `${isReject ? 'Reject' : 'Approve'} ${itemLabel}`;
		if (qs('approvalDesc')) qs('approvalDesc').textContent = `${isReject ? 'Reject' : 'Approve'} "${row.title}" from ${row.owner}?`;

		const feedbackGroup = qs('approvalFeedback') && qs('approvalFeedback').closest('.form-group');
		const feedbackTextarea = qs('approvalFeedback');
		if (feedbackTextarea) feedbackTextarea.value = '';
		if (feedbackGroup) {
			const label = feedbackGroup.querySelector('.form-label');
			if (label) label.textContent = isReject ? 'Rejection reason (sent to NGO)' : 'Notes (optional)';
			feedbackTextarea.placeholder = isReject ? `Explain why the ${row.type === 'ngo' ? 'registration' : 'campaign'} was rejected...` : 'Add any notes for the NGO...';
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
		const itemLabel = row.type === 'ngo' ? 'NGO Registration' : 'Campaign';

		const reason = (qs('approvalFeedback')?.value || '').trim() || null;

		if (mode === 'reject' && !reason) {
			showToast('Please provide a rejection reason.', 'error');
			return;
		}

		try {
			if (row.type === 'ngo') {
				if (mode === 'approve') {
					await NGOAPI.verify(row.id);
				} else {
					await NGOAPI.reject(row.id);
				}
			} else if (mode === 'approve') {
				await CampaignAPI.approve(row.id);
			} else {
				await CampaignAPI.reject(row.id, reason);
			}
			data.approvals.splice(index, 1);
			renderApprovals();
			closeModal('approvalModal');
			showToast(`${itemLabel} ${mode === 'approve' ? 'approved' : 'rejected'}: ${row.title}`, 'success');
		} catch (_err) {
			showToast('Action failed. Please try again.', 'error');
		}
	}
	     async function createUser() {
		const fullName = (qs('newUserFullName')?.value || '').trim();
		const email = (qs('newUserEmail')?.value || '').trim();
		const role = qs('newUserRole')?.value || 'admin';
		const password = (qs('genPassword')?.textContent || '').trim();

		if (!fullName) { showToast('Full name is required.', 'error'); return; }
		if (!email) { showToast('Email is required.', 'error'); return; }

		const parts = fullName.split(/\s+/);
		const firstName = parts[0];
		const lastName = parts.slice(1).join(' ') || parts[0];

		try {
			await AdminAPI.createUser({ firstName, lastName, email, password, role });
			showToast(`${role.charAt(0).toUpperCase() + role.slice(1)} account created for ${email}.`, 'success');
			closeModal('createUserModal');
			if (qs('newUserFullName')) qs('newUserFullName').value = '';
			if (qs('newUserEmail')) qs('newUserEmail').value = '';
			await loadDashboardData();
			renderUserTable();
		} catch (err) {
			showToast(err.message || 'Failed to create account.', 'error');
		}
	}

	async function createNGO() {
		const orgName = (qs('ngoOrgName')?.value || '').trim();
		const contactPerson = (qs('ngoContactPerson')?.value || '').trim();
		const email = (qs('ngoEmail')?.value || '').trim();
		const phone = (qs('ngoPhone')?.value || '').trim();
		const regNumber = (qs('ngoRegNumber')?.value || '').trim();
		const address = (qs('ngoAddress')?.value || '').trim();

		if (!orgName) { showToast('Organization name is required.', 'error'); return; }
		if (!email) { showToast('Email is required.', 'error'); return; }
		if (!regNumber) { showToast('Registration number is required.', 'error'); return; }

		const parts = contactPerson.split(/\s+/);
		const firstName = parts[0] || orgName.split(/\s+/)[0];
		const lastName = parts.slice(1).join(' ') || 'NGO';
		const tempPassword = `Kb@Ngo${Math.floor(1000 + Math.random() * 9000)}!`;

		try {
			const userRes = await AdminAPI.createUser({ firstName, lastName, email, password: tempPassword, role: 'ngo_admin' });
			const userId = userRes.user && userRes.user.id;
			if (!userId) throw new Error('User creation failed.');

			await AdminAPI.createNGOProfile({
				userId,
				name: orgName,
				phoneNumber: phone || null,
				address: address || null,
				registrationNumber: regNumber
			});

			showToast(`NGO "${orgName}" registered. Login: ${email} / ${tempPassword}`, 'success');
			closeModal('createNGOModal');
			['ngoOrgName','ngoContactPerson','ngoEmail','ngoPhone','ngoRegNumber','ngoAddress'].forEach((id) => {
				if (qs(id)) qs(id).value = '';
			});
			await loadDashboardData();
			renderNGOTable();
		} catch (err) {
			showToast(err.message || 'Failed to register NGO.', 'error');
		}
	}

	function editNGO(id) {
		const ngo = data.ngos.find((n) => String(n.id) === String(id));
		if (!ngo) return;
		if (qs('editNGOId')) qs('editNGOId').value = id;
		if (qs('editNGOName')) qs('editNGOName').value = ngo.name || '';
		if (qs('editNGOPhone')) qs('editNGOPhone').value = ngo.contact || '';
		if (qs('editNGOWebsite')) qs('editNGOWebsite').value = ngo.websiteUrl || '';
		if (qs('editNGOAddress')) qs('editNGOAddress').value = ngo.address || '';
		if (qs('editNGODescription')) qs('editNGODescription').value = ngo.description || '';
		openModal('editNGOModal');
	}

	async function saveEditNGO() {
		const id = qs('editNGOId')?.value;
		if (!id) return;
		const name = (qs('editNGOName')?.value || '').trim();
		if (!name) { showToast('Organization name is required.', 'error'); return; }

		const payload = {
			name,
			phoneNumber: (qs('editNGOPhone')?.value || '').trim() || null,
			websiteUrl: (qs('editNGOWebsite')?.value || '').trim() || null,
			address: (qs('editNGOAddress')?.value || '').trim() || null,
			description: (qs('editNGODescription')?.value || '').trim() || null
		};

		try {
			await NGOAPI.update(id, payload);
			showToast('NGO profile updated.', 'success');
			closeModal('editNGOModal');
			await loadDashboardData();
			renderNGOTable();
		} catch (err) {
			showToast(err.message || 'Failed to update NGO.', 'error');
		}
	}

	async function deleteNGO(id) {
		const ngo = data.ngos.find((n) => String(n.id) === String(id));
		if (!confirm(`Delete NGO "${ngo ? ngo.name : id}"? This cannot be undone.`)) return;
		try {
			await NGOAPI.delete(id);
			showToast('NGO deleted.', 'success');
			await loadDashboardData();
			renderNGOTable();
		} catch (err) {
			showToast(err.message || 'Failed to delete NGO.', 'error');
		}
	}

	async function deleteUserAccount(userId) {
		const user = data.users.find((u) => String(u.id) === String(userId));
		if (!confirm(`Delete account for "${user ? user.name : userId}"? This cannot be undone.`)) return;
		try {
			await AdminAPI.deleteUser(userId);
			showToast('User account deleted.', 'success');
			await loadDashboardData();
			renderUserTable();
		} catch (err) {
			showToast(err.message || 'Failed to delete user.', 'error');
		}
	}

	function updateUserForm() {
		const role = qs('newUserRole')?.value || 'admin';
		const prefix = role === 'superadmin' ? 'SUP' : role === 'ngo' || role === 'ngo_admin' ? 'NGO' : 'ADM';
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
		const account = (await readSessionAccount()) || readAccountContext();
		const roleFromURL = getRoleFromURL();
		state.role = account.role || roleFromURL || mapRole(localStorage.getItem(ROLE_KEY)) || 'superadmin';
		state.accountName = account.name;
		state.accountEmail = account.email;
		state.theme = localStorage.getItem(THEME_KEY) || 'light';
		localStorage.setItem(ROLE_KEY, state.role);

		// Load user data for settings
		try {
			const meRes = await AuthAPI.getMe();
			state.user = meRes.user;
		} catch (_err) {
			// user stays null
		}

		setTheme(state.theme);
		applyRoleProfile();
		renderRoleSwitcher();
		renderSidebarNav();

		await loadDashboardData();

		if (state.role === 'ngo') {
			try {
				const profileRes = await NGOAPI.getMyProfile();
				state.ngoId = profileRes.profile && profileRes.profile.id ? profileRes.profile.id : null;
				state.ngoProfile = profileRes.profile || null;
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
	window.verifyNGO = verifyNGO;
	window.rejectNGO = rejectNGO;
	window.editNGO = editNGO;
	window.saveEditNGO = saveEditNGO;
	window.deleteNGO = deleteNGO;
	window.deleteUserAccount = deleteUserAccount;
	window.changeUserRole = changeUserRole;
	window.filterLogs = filterLogs;
	window.saveGeneralSettings = saveGeneralSettings;
	window.saveSecuritySettings = saveSecuritySettings;

	init();
})();
