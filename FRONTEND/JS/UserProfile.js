/* User Profile Page */
(function () {
	const state = {
		user: null,
		donations: [],
		dirty: false,
		loading: false,
		avatarDataUrl: null,
		coverDataUrl: null
	};

	function qs(id) { return document.getElementById(id); }

	function setText(id, value) {
		const el = qs(id);
		if (el) el.textContent = value;
	}

	function fmtMoney(value) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
	}

	function escapeHtml(text) {
		const div = document.createElement('div');
		div.appendChild(document.createTextNode(String(text || '')));
		return div.innerHTML;
	}

	function showLoading(show) {
		const loader = qs('profileLoader');
		if (loader) loader.style.display = show ? 'flex' : 'none';
		state.loading = !!show;
	}

	function markDirty() {
		state.dirty = true;
		const bar = qs('saveBar');
		if (bar) bar.style.display = '';
	}

	function markClean() {
		state.dirty = false;
		const bar = qs('saveBar');
		if (bar) bar.style.display = 'none';
	}

	// ── LOAD ──────────────────────────────────────────────────────────

	async function loadUserProfile() {
		try {
			showLoading(true);
			const response = await AuthAPI.getMe();
			state.user = response.user;
			displayUserProfile();
			await loadUserDonations();
		} catch (error) {
			if (error.status === 401) {
				window.location.href = 'SignIn.html';
				return;
			}
			ToastHelper.error('Failed to load profile: ' + error.message);
		} finally {
			showLoading(false);
		}
	}

	function displayUserProfile() {
		if (!state.user) return;
		const user = state.user;

		const fullName = (user.firstName + ' ' + user.lastName).trim() || user.fullName || '';

		setText('displayName', fullName || 'Your Name');

		const slug = fullName.replace(/\s+/g, '').toLowerCase();
		setText('urlSlug', slug);
		setText('urlLive', slug);

		const nameInput = qs('profileName');
		if (nameInput) nameInput.value = fullName;

		const urlInput = qs('profileUrl');
		if (urlInput) urlInput.value = slug;

		const emailInput = qs('emailDisplay');
		if (emailInput) emailInput.value = user.email || '';

		// Restore avatar
		if (user.avatarUrl) {
			state.avatarDataUrl = user.avatarUrl;
			const img = qs('avatarImg');
			const icon = qs('avatarIcon');
			if (img) { img.src = user.avatarUrl; img.style.display = ''; }
			if (icon) icon.style.display = 'none';
		}

		// Restore cover photo
		if (user.coverUrl) {
			state.coverDataUrl = user.coverUrl;
			const strip = qs('coverStrip');
			if (strip) {
				strip.style.backgroundImage = 'url(' + user.coverUrl + ')';
				strip.style.backgroundSize = 'cover';
				strip.style.backgroundPosition = 'center';
			}
		}

		// Restore notification preferences
		const prefs = user.notificationPrefs;
		if (prefs) {
			document.querySelectorAll('.ntog[data-pref]').forEach(function (cb) {
				const key = cb.getAttribute('data-pref');
				if (key in prefs) {
					cb.checked = !!prefs[key];
					const row = cb.closest('.notif-row');
					if (row) {
						const label = row.querySelector('.tog-txt');
						if (label) label.textContent = cb.checked ? 'ON' : 'OFF';
					}
				}
			});
		}
	}

	// ── DONATIONS ─────────────────────────────────────────────────────

	async function loadUserDonations() {
		try {
			const response = await DonationAPI.getMyDonations(20, 0);
			state.donations = response.donations || [];
		} catch (_) {
			state.donations = [];
		}
		displayDonations();
		updateImpactStats();
	}

	function displayDonations() {
		const container = qs('donationsContainer');
		if (!container) return;

		if (!state.donations.length) {
			container.innerHTML = '<p style="text-align:center;color:#999;padding:24px 0;">'
				+ 'No donations yet. <a href="Landingpage.html#campaigns" style="color:inherit;text-decoration:underline;">Browse campaigns</a> to make your first contribution.'
				+ '</p>';
			return;
		}

		const statusColors = { pending: '#F39C12', completed: '#27AE60', failed: '#E74C3C', refunded: '#95A5A6' };

		container.innerHTML = state.donations.map(function (d) {
			const color = statusColors[d.status] || '#999';
			const date = d.createdAt
				? new Date(d.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
				: '';
			const label = d.campaignTitle || ('Campaign #' + escapeHtml(String(d.campaignId || '')));
			const method = d.paymentMethod ? d.paymentMethod.replace(/_/g, ' ') : 'Card';
			return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f4f8;">'
				+ '<div>'
				+ '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">' + label + '</div>'
				+ '<div style="font-size:12px;color:#888;">' + date + (date ? ' · ' : '') + escapeHtml(method) + '</div>'
				+ '</div>'
				+ '<div style="text-align:right;">'
				+ '<div style="font-weight:700;color:#27AE60;font-size:15px;">' + fmtMoney(d.amount) + '</div>'
				+ '<div style="font-size:11px;font-weight:600;color:' + color + ';">' + (d.status || 'pending').toUpperCase() + '</div>'
				+ '</div>'
				+ '</div>';
		}).join('');
	}

	function updateImpactStats() {
		const total = state.donations.reduce(function (sum, d) {
			return sum + Number(d.amount || 0);
		}, 0);
		setText('impactTotal', fmtMoney(total));
	}

	// ── SAVE / DISCARD ─────────────────────────────────────────────────

	async function save() {
		if (!state.user) return;

		const nameInput = qs('profileName');
		const fullName = String((nameInput && nameInput.value) || '').trim();
		if (!fullName) {
			ToastHelper.error('Please enter your profile name.');
			return;
		}

		const parts = fullName.split(/\s+/);
		const firstName = parts[0];
		const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

		// Collect notification preferences
		const notificationPrefs = {};
		document.querySelectorAll('.ntog[data-pref]').forEach(function (cb) {
			notificationPrefs[cb.getAttribute('data-pref')] = cb.checked;
		});

		const payload = { firstName, lastName, notificationPrefs };
		if (state.avatarDataUrl) payload.avatarUrl = state.avatarDataUrl;
		if (state.coverDataUrl)  payload.coverUrl  = state.coverDataUrl;

		try {
			const response = await AuthAPI.updateMe(payload);
			state.user = response.user;
			displayUserProfile();
			markClean();
			ToastHelper.success('Profile updated!');
		} catch (error) {
			ToastHelper.error('Failed to save: ' + error.message);
		}
	}

	function discard() {
		displayUserProfile();
		markClean();
	}

	// ── UI HELPERS ────────────────────────────────────────────────────

	function smoothTo(sectionId) {
		const el = qs(sectionId);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		document.querySelectorAll('.sidebar-link').forEach(function (link) {
			link.classList.toggle('active', link.dataset.section === sectionId);
		});
	}

	function setVis(vis) {
		const vPriv = qs('vPrivate');
		const vPub = qs('vPublic');
		if (vPriv) vPriv.classList.toggle('active', vis === 'private');
		if (vPub) vPub.classList.toggle('active', vis === 'public');
		markDirty();
	}

	function syncUrl(val) {
		const slug = String(val || '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
		setText('urlSlug', slug);
		setText('urlLive', slug);
		markDirty();
	}

	function relabel(checkbox) {
		const row = checkbox.closest('.notif-row');
		if (!row) return;
		const label = row.querySelector('.tog-txt');
		if (label) label.textContent = checkbox.checked ? 'ON' : 'OFF';
		markDirty();
	}

	function enableAll() {
		document.querySelectorAll('.ntog').forEach(function (cb) {
			cb.checked = true;
			const row = cb.closest('.notif-row');
			if (row) {
				const label = row.querySelector('.tog-txt');
				if (label) label.textContent = 'ON';
			}
		});
		markDirty();
	}

	function triggerFile(inputId) {
		const el = qs(inputId);
		if (el) el.click();
	}

	function handleAvatar(event) {
		const file = event.target.files && event.target.files[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			ToastHelper.error('Image must be under 5 MB.');
			return;
		}
		const reader = new FileReader();
		reader.onload = function (e) {
			state.avatarDataUrl = e.target.result;
			const img = qs('avatarImg');
			const icon = qs('avatarIcon');
			if (img) { img.src = e.target.result; img.style.display = ''; }
			if (icon) icon.style.display = 'none';
			markDirty();
		};
		reader.readAsDataURL(file);
	}

	function handleCover(event) {
		const file = event.target.files && event.target.files[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			ToastHelper.error('Image must be under 5 MB.');
			return;
		}
		const reader = new FileReader();
		reader.onload = function (e) {
			state.coverDataUrl = e.target.result;
			const strip = qs('coverStrip');
			if (strip) {
				strip.style.backgroundImage = 'url(' + e.target.result + ')';
				strip.style.backgroundSize = 'cover';
				strip.style.backgroundPosition = 'center';
			}
			markDirty();
		};
		reader.readAsDataURL(file);
	}

	function deactivate() {
		if (!confirm('Are you sure you want to deactivate your account? You can reactivate it by signing in again.')) return;
		ToastHelper.info('Account deactivated. Signing you out…');
		setTimeout(handleLogout, 1500);
	}

	async function handleLogout() {
		try { await AuthState.logout(); } catch (_) {}
		window.location.href = 'Landingpage.html';
	}

	// ── INIT ──────────────────────────────────────────────────────────

	function initDrawer() {
		const hamburger = qs('hamburger');
		const navDrawer = qs('navDrawer');
		if (!hamburger || !navDrawer) return;
		hamburger.addEventListener('click', function () {
			const open = !navDrawer.classList.contains('open');
			navDrawer.classList.toggle('open', open);
			hamburger.classList.toggle('open', open);
		});
	}

	function initSidebarNav() {
		document.querySelectorAll('.sidebar-link[data-section]').forEach(function (link) {
			link.addEventListener('click', function (e) {
				e.preventDefault();
				smoothTo(this.dataset.section);
			});
		});
	}

	function initProfileNameInput() {
		const nameInput = qs('profileName');
		if (!nameInput) return;
		nameInput.addEventListener('input', function () {
			setText('displayName', this.value || 'Your Name');
			markDirty();
		});
	}

	function initUrlInput() {
		const urlInput = qs('profileUrl');
		if (!urlInput) return;
		urlInput.addEventListener('input', function () {
			syncUrl(this.value);
		});
	}

	function init() {
		initDrawer();
		initSidebarNav();
		initProfileNameInput();
		initUrlInput();
		loadUserProfile();
	}

	// Expose to window for inline HTML handlers
	window.save = save;
	window.discard = discard;
	window.smoothTo = smoothTo;
	window.setVis = setVis;
	window.syncUrl = syncUrl;
	window.relabel = relabel;
	window.enableAll = enableAll;
	window.triggerFile = triggerFile;
	window.handleAvatar = handleAvatar;
	window.handleCover = handleCover;
	window.deactivate = deactivate;
	window.handleLogout = handleLogout;
	window.toast = function (msg) { ToastHelper.info(msg); };

	document.addEventListener('DOMContentLoaded', init);
})();
