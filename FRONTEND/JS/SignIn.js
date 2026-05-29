/* Sign-in page interactions */
(function () {
	const API_BASE = window.KB_API_BASE || 'http://localhost:5001';
	const hamburger = document.getElementById('hamburger');
	const navDrawer = document.getElementById('navDrawer');
	const pwdToggle = document.getElementById('pwdToggle');
	const passwordInput = document.getElementById('password');
	const signinForm = document.getElementById('signinForm');
	const socialButtons = document.querySelectorAll('.js-social-auth');
	const query = new URLSearchParams(window.location.search);

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

	function isValidEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
	}

	function setDrawer(open) {
		if (!hamburger || !navDrawer) return;
		hamburger.classList.toggle('open', open);
		navDrawer.classList.toggle('open', open);
		hamburger.setAttribute('aria-expanded', String(open));
	}

	function openAuthModal(id) {
		const modal = document.getElementById(id);
		if (!modal) return;
		modal.classList.add('open');
		modal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
	}

	function closeAuthModal(id) {
		const modal = document.getElementById(id);
		if (!modal) return;
		modal.classList.remove('open');
		modal.setAttribute('aria-hidden', 'true');
		if (!document.querySelector('.auth-modal-overlay.open')) {
			document.body.style.overflow = '';
		}
	}

	function setStatus(el, message, type, linkUrl) {
		if (!el) return;
		el.classList.toggle('error', type === 'error');
		el.classList.add('show');
		el.textContent = message || '';
		if (linkUrl) {
			const link = document.createElement('a');
			link.href = linkUrl;
			link.textContent = linkUrl;
			link.className = 'auth-dev-link';
			el.appendChild(link);
		}
	}

	function clearStatus(el) {
		if (!el) return;
		el.classList.remove('show', 'error');
		el.textContent = '';
	}

	function setButtonBusy(button, busy, busyText) {
		if (!button) return;
		if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
		button.disabled = !!busy;
		button.style.opacity = busy ? '0.72' : '';
		button.textContent = busy ? busyText : button.dataset.defaultText;
	}

	window.closeAuthModal = closeAuthModal;

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

	document.querySelectorAll('.auth-modal-overlay').forEach(function (modal) {
		modal.addEventListener('click', function (event) {
			if (event.target === modal) closeAuthModal(modal.id);
		});
	});

	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Escape') return;
		document.querySelectorAll('.auth-modal-overlay.open').forEach(function (modal) {
			closeAuthModal(modal.id);
		});
	});

	if (signinForm) {
		signinForm.addEventListener('submit', async function (event) {
			event.preventDefault();
			hideErrors();

			const email = document.getElementById('email');
			const password = document.getElementById('password');
			let valid = true;

			if (!email || !isValidEmail(email.value)) {
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
				const response = await fetch(`${API_BASE}/api/auth/login`, {
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
				if (role === 'admin' || role === 'superadmin' || role === 'ngo' || role === 'ngo_admin') {
					await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(function () {});
					if (window.KBCommonNav) window.KBCommonNav.clearUser();
					showToast('Please sign in via the Admin / NGO Portal.', 'error');
					setTimeout(function () {
						window.location.href = 'AdminLogIn.html';
					}, 1800);
					return;
				}

				if (window.KBCommonNav) window.KBCommonNav.storeUser(data.user);
				showToast('Signed in successfully.', 'info');
				setTimeout(function () {
					window.location.href = 'index.html';
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

	if (query.get('oauth') === 'failed') {
		showToast('OAuth sign-in failed. Please try again.', 'error');
	}

	const forgotLink = document.getElementById('forgotPasswordLink');
	if (forgotLink) {
		forgotLink.addEventListener('click', function (event) {
			event.preventDefault();
			const email = document.getElementById('email');
			const forgotEmail = document.getElementById('forgotEmail');
			const forgotStatus = document.getElementById('forgotStatus');
			if (forgotEmail && email && email.value.trim()) forgotEmail.value = email.value.trim();
			clearStatus(forgotStatus);
			openAuthModal('forgotPasswordModal');
		});
	}

	const resetTokenFromUrl = query.get('token');
	if (resetTokenFromUrl) {
		const resetTokenInput = document.getElementById('resetToken');
		if (resetTokenInput) resetTokenInput.value = resetTokenFromUrl;
		openAuthModal('resetPasswordModal');
	}

	const forgotForm = document.getElementById('forgotPasswordForm');
	if (forgotForm) {
		forgotForm.addEventListener('submit', async function (event) {
			event.preventDefault();
			const emailEl = document.getElementById('forgotEmail');
			const errEl = document.getElementById('forgotEmailErr');
			const statusEl = document.getElementById('forgotStatus');
			const submitBtn = forgotForm.querySelector('.auth-submit');
			if (errEl) errEl.classList.remove('show');
			clearStatus(statusEl);

			if (!emailEl || !isValidEmail(emailEl.value)) {
				if (errEl) errEl.classList.add('show');
				return;
			}

			try {
				setButtonBusy(submitBtn, true, 'Sending...');
				const response = await fetch(`${API_BASE}/auth/forgot-password`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ email: emailEl.value.trim() })
				});
				const data = await response.json().catch(function () { return {}; });
				if (!response.ok) {
					setStatus(statusEl, data.message || 'Unable to send reset link right now.', 'error');
					return;
				}

				setStatus(
					statusEl,
					data.devResetUrl
						? 'SMTP is not configured, so use this development reset link:'
						: (data.message || 'If that email is registered, a reset link has been sent.'),
					'info',
					data.devResetUrl
				);
				showToast('Password reset request submitted.', 'info');
			} catch (_error) {
				setStatus(statusEl, 'Backend is unreachable. Start the auth server first.', 'error');
			} finally {
				setButtonBusy(submitBtn, false);
			}
		});
	}

	const resetForm = document.getElementById('resetPasswordForm');
	if (resetForm) {
		resetForm.addEventListener('submit', async function (event) {
			event.preventDefault();
			const tokenEl = document.getElementById('resetToken');
			const newPwd = document.getElementById('resetPassword');
			const confirmPwd = document.getElementById('resetConfirmPassword');
			const errEl = document.getElementById('resetPasswordErr');
			const statusEl = document.getElementById('resetStatus');
			const submitBtn = resetForm.querySelector('.auth-submit');
			if (errEl) errEl.classList.remove('show');
			clearStatus(statusEl);

			const token = tokenEl ? tokenEl.value.trim() : '';
			if (!token) {
				setStatus(statusEl, 'This reset link is missing or invalid. Request a new password reset link.', 'error');
				return;
			}

			if (!newPwd || newPwd.value.length < 8 || !confirmPwd || confirmPwd.value !== newPwd.value) {
				if (errEl) {
					errEl.classList.add('show');
					const textNode = Array.prototype.find.call(errEl.childNodes, function (node) {
						return node.nodeType === Node.TEXT_NODE;
					});
					if (textNode) {
						textNode.textContent = newPwd && newPwd.value.length < 8
							? ' Password must be at least 8 characters.'
							: ' Passwords do not match.';
					}
				}
				return;
			}

			try {
				setButtonBusy(submitBtn, true, 'Updating...');
				const response = await fetch(`${API_BASE}/auth/reset-password`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ token, password: newPwd.value })
				});
				const data = await response.json().catch(function () { return {}; });
				if (response.ok) {
					setStatus(statusEl, data.message || 'Password updated. Redirecting to sign in...', 'info');
					showToast('Password updated successfully.', 'info');
					setTimeout(function () {
						window.location.href = 'SignIn.html';
					}, 1600);
				} else {
					setStatus(statusEl, data.message || 'Reset failed. The link may have expired.', 'error');
				}
			} catch (_error) {
				setStatus(statusEl, 'Backend is unreachable. Start the auth server first.', 'error');
			} finally {
				setButtonBusy(submitBtn, false);
			}
		});
	}
})();
