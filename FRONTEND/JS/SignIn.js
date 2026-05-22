/* Sign-in page interactions */
(function () {
	const API_BASE = window.KB_API_BASE || 'http://localhost:5001';
	const hamburger = document.getElementById('hamburger');
	const navDrawer = document.getElementById('navDrawer');
	const pwdToggle = document.getElementById('pwdToggle');
	const passwordInput = document.getElementById('password');
	const signinForm = document.getElementById('signinForm');
	const socialButtons = document.querySelectorAll('.js-social-auth');

	function showToast(message, type) {
		const toast = document.createElement('div');
		toast.textContent = message;
		toast.style.position = 'fixed';
		toast.style.right = '16px';
		toast.style.bottom = '16px';
		toast.style.zIndex = '9999';
		toast.style.maxWidth = '320px';
		toast.style.padding = '12px 14px';
		toast.style.borderRadius = '10px';
		toast.style.color = '#fff';
		toast.style.font = "600 12px 'DM Sans', sans-serif";
		toast.style.letterSpacing = '0.2px';
		toast.style.boxShadow = '0 12px 28px rgba(0,0,0,.18)';
		toast.style.background = type === 'error' ? '#d94f4f' : '#1B2A4A';
		document.body.appendChild(toast);
		setTimeout(function () { toast.remove(); }, 2400);
	}

	function hideErrors() {
		document.querySelectorAll('.error-msg.show').forEach(function (el) {
			el.classList.remove('show');
		});
	}

	function setDrawer(open) {
		if (!hamburger || !navDrawer) return;
		hamburger.classList.toggle('open', open);
		navDrawer.classList.toggle('open', open);
		hamburger.setAttribute('aria-expanded', String(open));
	}

	if (hamburger && navDrawer) {
		hamburger.addEventListener('click', function () {
			const open = !navDrawer.classList.contains('open');
			setDrawer(open);
		});
	}

	if (pwdToggle && passwordInput) {
		pwdToggle.addEventListener('click', function () {
			const hidden = passwordInput.type === 'password';
			passwordInput.type = hidden ? 'text' : 'password';
		});
	}

	if (signinForm) {
		signinForm.addEventListener('submit', async function (event) {
			event.preventDefault();
			hideErrors();

			const email = document.getElementById('email');
			const password = document.getElementById('password');
			let valid = true;

			if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
				const emailErr = document.getElementById('emailErr');
				if (emailErr) emailErr.classList.add('show');
				valid = false;
			}

			if (!password || !password.value.trim()) {
				const pwdErr = document.getElementById('pwdErr');
				if (pwdErr) pwdErr.classList.add('show');
				valid = false;
			}

			if (!valid) return;

			try {
				const response = await fetch(`${API_BASE}/auth/signin`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						email: email.value.trim(),
						password: password.value
					})
				});

				const data = await response.json().catch(function () { return {}; });
				if (!response.ok) {
					showToast(data.message || 'Unable to sign in right now.', 'error');
					return;
				}

				const role = data.user && data.user.role;
				if (role === 'admin' || role === 'superadmin' || role === 'ngo') {
					// Log them out and redirect to the correct portal
					await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(function () {});
					showToast('Please sign in via the Admin / NGO Portal.', 'error');
					setTimeout(function () {
						window.location.href = 'AdminLogIn.html';
					}, 1800);
					return;
				}
				showToast('Signed in successfully.', 'info');
				setTimeout(function () {
					window.location.href = 'Landingpage.html';
				}, 400);
			} catch (_error) {
				showToast('Backend is unreachable. Start the auth server first.', 'error');
			}
		});
	}

	socialButtons.forEach(function (button) {
		button.addEventListener('click', function (event) {
			event.preventDefault();
			const provider = button.getAttribute('data-provider');
			const label = provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : provider;
			showToast(`${label} sign-in is coming soon.`, 'info');
		});
	});

	const query = new URLSearchParams(window.location.search);
	if (query.get('oauth') === 'failed') {
		showToast('OAuth sign-in failed. Please try again.', 'error');
	}

	// ── Panel switcher ──────────────────────────────────────────
	function showPanel(id) {
		['loginPanel', 'forgotPanel', 'resetPanel'].forEach(function (panelId) {
			const el = document.getElementById(panelId);
			if (el) el.style.display = panelId === id ? '' : 'none';
		});
	}

	// If ?token= present on load, jump straight to reset panel
	const resetToken = query.get('token');
	if (resetToken) {
		showPanel('resetPanel');
	}

	const forgotLink = document.getElementById('forgotLink');
	if (forgotLink) {
		forgotLink.addEventListener('click', function (e) {
			e.preventDefault();
			showPanel('forgotPanel');
		});
	}

	const backToLogin = document.getElementById('backToLogin');
	if (backToLogin) {
		backToLogin.addEventListener('click', function (e) {
			e.preventDefault();
			showPanel('loginPanel');
		});
	}

	// ── Forgot password form ─────────────────────────────────────
	const forgotForm = document.getElementById('forgotForm');
	if (forgotForm) {
		forgotForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			const emailEl = document.getElementById('forgotEmail');
			const errEl = document.getElementById('forgotEmailErr');
			if (errEl) errEl.classList.remove('show');

			if (!emailEl || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
				if (errEl) errEl.classList.add('show');
				return;
			}

			try {
				const res = await fetch(`${API_BASE}/auth/forgot-password`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ email: emailEl.value.trim() })
				});
				const data = await res.json().catch(function () { return {}; });
				showToast(data.message || 'If that email is registered, a reset link has been sent.', 'info');
				emailEl.value = '';
				setTimeout(function () { showPanel('loginPanel'); }, 2500);
			} catch (_) {
				showToast('Backend is unreachable. Start the auth server first.', 'error');
			}
		});
	}

	// ── Reset password form ──────────────────────────────────────
	const resetForm = document.getElementById('resetForm');
	if (resetForm) {
		resetForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			const newPwd = document.getElementById('newPassword');
			const confirmPwd = document.getElementById('confirmNewPwd');
			const newPwdErr = document.getElementById('newPwdErr');
			const confirmPwdErr = document.getElementById('confirmNewPwdErr');
			if (newPwdErr) newPwdErr.classList.remove('show');
			if (confirmPwdErr) confirmPwdErr.classList.remove('show');

			let valid = true;
			if (!newPwd || newPwd.value.length < 8) {
				if (newPwdErr) newPwdErr.classList.add('show');
				valid = false;
			}
			if (!confirmPwd || confirmPwd.value !== (newPwd ? newPwd.value : '')) {
				if (confirmPwdErr) confirmPwdErr.classList.add('show');
				valid = false;
			}
			if (!valid) return;

			try {
				const res = await fetch(`${API_BASE}/auth/reset-password`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ token: resetToken, password: newPwd.value })
				});
				const data = await res.json().catch(function () { return {}; });
				if (res.ok) {
					showToast(data.message || 'Password updated. Redirecting to sign in…', 'info');
					setTimeout(function () {
						window.location.href = 'SignIn.html';
					}, 1800);
				} else {
					showToast(data.message || 'Reset failed. The link may have expired.', 'error');
				}
			} catch (_) {
				showToast('Backend is unreachable. Start the auth server first.', 'error');
			}
		});
	}

	// New password toggle in reset panel
	const newPwdToggle = document.getElementById('newPwdToggle');
	const newPwdInput = document.getElementById('newPassword');
	if (newPwdToggle && newPwdInput) {
		newPwdToggle.addEventListener('click', function () {
			newPwdInput.type = newPwdInput.type === 'password' ? 'text' : 'password';
		});
	}
})();
