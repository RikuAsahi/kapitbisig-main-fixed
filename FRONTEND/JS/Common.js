/* Shared public UI helpers */
(function () {
	'use strict';

	const API_BASE = window.KB_API_BASE || 'http://localhost:5001';
	const USER_KEY = 'kb.auth.user';
	const AUTH_KEYS = ['kb.auth.user', 'kb.auth.role', 'kb.auth.name', 'kb.auth.email', 'kb.user'];
	let navBound = false;

	function injectNavStyles() {
		if (document.getElementById('kb-common-nav-styles')) return;

		const style = document.createElement('style');
		style.id = 'kb-common-nav-styles';
		style.textContent = `
			.kb-nav-profile-item {
				position: relative;
				display: flex;
				align-items: center;
			}
			.kb-nav-avatar-button {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				border: 1.5px solid rgba(255,255,255,0.34);
				background: rgba(255,255,255,0.08);
				color: #fff;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 0;
				cursor: pointer;
				font: 700 13px 'DM Sans', sans-serif;
				overflow: hidden;
				transition: background .2s, border-color .2s, transform .2s;
			}
			.kb-nav-avatar-button:hover,
			.kb-nav-avatar-button:focus-visible {
				background: rgba(255,255,255,0.14);
				border-color: rgba(255,255,255,0.62);
				outline: none;
				transform: translateY(-1px);
			}
			.kb-nav-avatar-button svg {
				width: 20px;
				height: 20px;
				fill: none;
				stroke: currentColor;
				stroke-width: 2;
				stroke-linecap: round;
				stroke-linejoin: round;
			}
			.kb-nav-avatar-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
			.kb-nav-profile-dropdown {
				position: absolute;
				top: calc(100% + 12px);
				right: 0;
				min-width: 190px;
				padding: 8px;
				border-radius: 8px;
				background: #fff;
				box-shadow: 0 18px 42px rgba(0,0,0,.22);
				border: 1px solid rgba(27,42,74,.08);
				display: none;
				z-index: 260;
			}
			.kb-nav-profile-item.open .kb-nav-profile-dropdown {
				display: block;
			}
			.kb-nav-profile-summary {
				padding: 8px 10px 10px;
				border-bottom: 1px solid rgba(27,42,74,.1);
				margin-bottom: 6px;
			}
			.kb-nav-profile-name {
				display: block;
				color: #1B2A4A;
				font: 700 13px 'DM Sans', sans-serif;
				letter-spacing: 0;
				text-transform: none;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 168px;
			}
			.kb-nav-profile-email {
				display: block;
				margin-top: 2px;
				color: #6b7a99;
				font: 500 11px 'DM Sans', sans-serif;
				letter-spacing: 0;
				text-transform: none;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 168px;
			}
			.kb-nav-profile-dropdown a,
			.kb-nav-profile-dropdown button {
				width: 100%;
				display: flex;
				align-items: center;
				gap: 9px;
				padding: 10px;
				border: 0;
				border-radius: 7px;
				background: transparent;
				color: #1B2A4A !important;
				text-decoration: none;
				font: 700 12px 'DM Sans', sans-serif;
				letter-spacing: 0;
				text-transform: none;
				text-align: left;
				cursor: pointer;
			}
			.kb-nav-profile-dropdown a:hover,
			.kb-nav-profile-dropdown button:hover {
				background: rgba(91,164,207,.12);
				color: #1B2A4A !important;
			}
			.kb-nav-profile-dropdown svg {
				width: 16px;
				height: 16px;
				fill: none;
				stroke: currentColor;
				stroke-width: 2;
				stroke-linecap: round;
				stroke-linejoin: round;
				flex: 0 0 auto;
			}
			.nav-drawer .drawer-profile-item,
			.nav-drawer .drawer-profile-logout {
				display: none;
			}
			.nav-drawer .drawer-profile-logout {
				width: 100%;
				background: transparent;
				border: 0;
				border-bottom: 1px solid rgba(255,255,255,0.06);
				color: rgba(255,255,255,0.75);
				font: 500 13px 'DM Sans', sans-serif;
				letter-spacing: 1.4px;
				text-transform: uppercase;
				text-align: left;
				padding: 15px 0;
				cursor: pointer;
			}
			.nav-drawer .drawer-profile-logout:hover {
				color: var(--sky-light, #A8D4EE);
			}
			.nav-drawer.is-authenticated .drawer-profile-item,
			.nav-drawer.is-authenticated .drawer-profile-logout {
				display: block;
			}
		`;
		document.head.appendChild(style);
	}

	function readStoredUser() {
		try {
			const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('kb.user');
			return raw ? JSON.parse(raw) : null;
		} catch (_error) {
			return null;
		}
	}

	function storeUser(user) {
		if (!user) return;
		try {
			localStorage.setItem(USER_KEY, JSON.stringify(user));
			localStorage.setItem('kb.auth.role', user.role || '');
			localStorage.setItem('kb.auth.name', getUserName(user));
			localStorage.setItem('kb.auth.email', user.email || '');
		} catch (_error) {}
	}

	function clearStoredUser() {
		AUTH_KEYS.forEach(function (key) {
			try { localStorage.removeItem(key); } catch (_error) {}
		});
	}

	function getUserName(user) {
		if (!user) return 'Profile';
		return user.fullName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'Profile';
	}

	function getInitials(user) {
		const source = getUserName(user);
		const parts = source.split(/\s+/).filter(Boolean);
		if (!parts.length || source.indexOf('@') > -1) return 'KB';
		return parts.slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('');
	}

	function escapeHtml(value) {
		return String(value || '').replace(/[&<>"']/g, function (char) {
			return {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			}[char];
		});
	}

	function isAuthHref(el, page) {
		const href = (el.getAttribute('href') || '').toLowerCase();
		return href.indexOf(page.toLowerCase()) !== -1;
	}

	function setAuthLinksVisible(isVisible) {
		document.querySelectorAll('.nav-signin, .nav-signup').forEach(function (el) {
			if (el.closest('.kb-nav-profile-item')) return;
			const item = el.closest('li') || el;
			item.style.display = isVisible ? '' : 'none';
		});

		document.querySelectorAll('.nav-drawer a').forEach(function (el) {
			if (el.classList.contains('drawer-profile-item')) return;
			if (el.classList.contains('drawer-signin') || el.classList.contains('drawer-signup') || isAuthHref(el, 'SignIn.html') || isAuthHref(el, 'Signup.html')) {
				el.style.display = isVisible ? '' : 'none';
			}
		});
	}

	function icon(name) {
		const paths = {
			user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
			settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.36.22.73.44 1.1.6.37.16.75.4 1.1.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/>',
			logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
			avatar: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
		};
		return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>';
	}

	function createAvatarContent(user) {
		if (user && user.avatarUrl) {
			return '<img class="kb-nav-avatar-img" src="' + escapeHtml(user.avatarUrl) + '" alt="">';
		}
		const initials = getInitials(user);
		return initials === 'KB' ? icon('avatar') : initials;
	}

	function ensureDesktopProfile(user) {
		const navLinks = document.querySelector('nav .nav-links');
		if (!navLinks) return;

		document.querySelectorAll('.nav-profile-item').forEach(function (el) { el.remove(); });
		document.querySelectorAll('.kb-nav-profile-item').forEach(function (el) { el.remove(); });

		const name = escapeHtml(getUserName(user));
		const email = user && user.email ? escapeHtml(user.email) : '';
		const item = document.createElement('li');
		item.className = 'nav-profile-item kb-nav-profile-item';
		item.innerHTML = `
			<button type="button" class="kb-nav-avatar-button" aria-label="Open profile menu" aria-expanded="false">
				${createAvatarContent(user)}
			</button>
			<div class="kb-nav-profile-dropdown" role="menu">
				<div class="kb-nav-profile-summary">
					<span class="kb-nav-profile-name">${name}</span>
					${email ? '<span class="kb-nav-profile-email">' + email + '</span>' : ''}
				</div>
				<a href="UserProfile.html" role="menuitem">${icon('user')}Profile</a>
				<a href="UserProfile.html#sec-account" role="menuitem">${icon('settings')}Settings</a>
				<button type="button" class="kb-nav-logout" role="menuitem">${icon('logout')}Log Out</button>
			</div>
		`;
		navLinks.appendChild(item);
	}

	function ensureDrawerProfile() {
		const drawer = document.getElementById('navDrawer') || document.querySelector('.nav-drawer');
		if (!drawer) return;

		drawer.querySelectorAll('.drawer-profile-item, .drawer-profile-logout').forEach(function (el) {
			if (el.getAttribute('data-kb-common') === 'true') el.remove();
		});

		const profile = document.createElement('a');
		profile.href = 'UserProfile.html';
		profile.className = 'drawer-profile-item';
		profile.setAttribute('data-kb-common', 'true');
		profile.textContent = 'Profile';

		const settings = document.createElement('a');
		settings.href = 'UserProfile.html#sec-account';
		settings.className = 'drawer-profile-item';
		settings.setAttribute('data-kb-common', 'true');
		settings.textContent = 'Settings';

		const logout = document.createElement('button');
		logout.type = 'button';
		logout.className = 'drawer-profile-logout kb-nav-logout';
		logout.setAttribute('data-kb-common', 'true');
		logout.textContent = 'Log Out';

		drawer.appendChild(profile);
		drawer.appendChild(settings);
		drawer.appendChild(logout);
	}

	function updateNavigation(user) {
		injectNavStyles();
		const isAuthenticated = !!user;
		const drawer = document.getElementById('navDrawer') || document.querySelector('.nav-drawer');

		setAuthLinksVisible(!isAuthenticated);
		if (drawer) drawer.classList.toggle('is-authenticated', isAuthenticated);

		if (isAuthenticated) {
			ensureDesktopProfile(user);
			ensureDrawerProfile();
		} else {
			document.querySelectorAll('.nav-profile-item, .kb-nav-profile-item').forEach(function (el) { el.remove(); });
			document.querySelectorAll('.drawer-profile-item, .drawer-profile-logout').forEach(function (el) {
				if (el.getAttribute('data-kb-common') === 'true') el.remove();
				else el.style.display = 'none';
			});
		}

		bindNavEvents();
	}

	async function resolveUser() {
		try {
			const response = await fetch(API_BASE + '/auth/me', { credentials: 'include' });
			if (response.ok) {
				const data = await response.json().catch(function () { return {}; });
				if (data.user) {
					storeUser(data.user);
					return data.user;
				}
			}
			if (response.status === 401 || response.status === 403) {
				clearStoredUser();
				return null;
			}
		} catch (_error) {
			return readStoredUser();
		}
		return readStoredUser();
	}

	async function logout() {
		try {
			await fetch(API_BASE + '/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});
		} catch (_error) {}
		clearStoredUser();
		updateNavigation(null);
		window.location.href = 'SignIn.html';
	}

	function bindNavEvents() {
		if (navBound) return;
		navBound = true;

		document.addEventListener('click', function (event) {
			const avatarButton = event.target.closest('.kb-nav-avatar-button');
			if (avatarButton) {
				const item = avatarButton.closest('.kb-nav-profile-item');
				const open = item && !item.classList.contains('open');
				document.querySelectorAll('.kb-nav-profile-item.open').forEach(function (el) {
					el.classList.remove('open');
					const button = el.querySelector('.kb-nav-avatar-button');
					if (button) button.setAttribute('aria-expanded', 'false');
				});
				if (item) {
					item.classList.toggle('open', open);
					avatarButton.setAttribute('aria-expanded', String(open));
				}
				return;
			}

			if (event.target.closest('.kb-nav-logout')) {
				event.preventDefault();
				logout();
				return;
			}

			if (!event.target.closest('.kb-nav-profile-item')) {
				document.querySelectorAll('.kb-nav-profile-item.open').forEach(function (el) {
					el.classList.remove('open');
					const button = el.querySelector('.kb-nav-avatar-button');
					if (button) button.setAttribute('aria-expanded', 'false');
				});
			}
		});

		document.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') return;
			document.querySelectorAll('.kb-nav-profile-item.open').forEach(function (el) {
				el.classList.remove('open');
				const button = el.querySelector('.kb-nav-avatar-button');
				if (button) button.setAttribute('aria-expanded', 'false');
			});
		});
	}

	async function init() {
		if (!document.querySelector('nav')) return;
		const user = await resolveUser();
		updateNavigation(user);
	}

	window.KBCommonNav = {
		init: init,
		update: updateNavigation,
		storeUser: storeUser,
		clearUser: clearStoredUser,
		logout: logout
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
