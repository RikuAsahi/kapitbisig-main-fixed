/* Sign-up page interactions */
(function () {
	const API_BASE = window.KB_API_BASE || 'http://localhost:5001';
	const hamburger = document.getElementById('hamburger');
	const navDrawer = document.getElementById('navDrawer');
	const signupForm = document.getElementById('signupForm');
	const pwdInput = document.getElementById('password');
	const confirmInput = document.getElementById('confirmPwd');
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

	function togglePassword(inputId) {
		const input = document.getElementById(inputId);
		if (!input) return;
		input.type = input.type === 'password' ? 'text' : 'password';
	}

	function updateStrength(value) {
		const bars = [1, 2, 3, 4].map(function (n) { return document.getElementById('sb' + n); });
		const label = document.getElementById('strengthLabel');
		if (!bars.every(Boolean) || !label) return;

		let score = 0;
		if (value.length >= 8) score++;
		if (/[A-Z]/.test(value)) score++;
		if (/[0-9]/.test(value)) score++;
		if (/[^A-Za-z0-9]/.test(value)) score++;

		const colorMap = ['#e05252', '#e05252', '#d38b2a', '#5BA4CF', '#2f9b57'];
		const textMap = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

		bars.forEach(function (bar, idx) {
			bar.style.background = idx < score ? colorMap[score] : 'rgba(91,164,207,.15)';
		});
		label.textContent = textMap[score];
		label.style.color = colorMap[score];
	}

	if (hamburger && navDrawer) {
		hamburger.addEventListener('click', function () {
			const open = !navDrawer.classList.contains('open');
			setDrawer(open);
		});
	}

	const toggle1 = document.getElementById('pwdToggle1');
	if (toggle1) {
		toggle1.addEventListener('click', function () { togglePassword('password'); });
	}

	const toggle2 = document.getElementById('pwdToggle2');
	if (toggle2) {
		toggle2.addEventListener('click', function () { togglePassword('confirmPwd'); });
	}

	if (pwdInput) {
		pwdInput.addEventListener('input', function () {
			updateStrength(pwdInput.value || '');
		});
	}

	if (signupForm) {
		signupForm.addEventListener('submit', async function (event) {
			event.preventDefault();
			hideErrors();

			const first = document.getElementById('firstName');
			const last = document.getElementById('lastName');
			const email = document.getElementById('email');
			const terms = document.getElementById('terms');
			let valid = true;

			if (!first || !first.value.trim()) {
				const el = document.getElementById('firstNameErr');
				if (el) el.classList.add('show');
				valid = false;
			}
			if (!last || !last.value.trim()) {
				const el = document.getElementById('lastNameErr');
				if (el) el.classList.add('show');
				valid = false;
			}
			if (!email || !/^[^\s@]+@gmail\.com$/i.test(email.value.trim())) {
				const el = document.getElementById('emailErr');
				if (el) el.classList.add('show');
				valid = false;
			}
			if (!pwdInput || (pwdInput.value || '').length < 8) {
				const el = document.getElementById('pwdErr');
				if (el) el.classList.add('show');
				valid = false;
			}
			if (!confirmInput || confirmInput.value !== pwdInput.value) {
				const el = document.getElementById('confirmPwdErr');
				if (el) el.classList.add('show');
				valid = false;
			}
			if (!terms || !terms.checked) {
				const el = document.getElementById('termsErr');
				if (el) el.classList.add('show');
				valid = false;
			}

			if (!valid) return;

			try {
				const response = await fetch(`${API_BASE}/auth/signup`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						firstName: first.value.trim(),
						lastName: last.value.trim(),
						email: email.value.trim(),
						password: pwdInput.value
					})
				});

				const data = await response.json().catch(function () { return {}; });
				if (!response.ok) {
					showToast(data.message || 'Unable to create account right now.', 'error');
					return;
				}

				showToast('Account created successfully.', 'info');
				setTimeout(function () {
					window.location.href = 'UserProfile.html';
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
			showToast(`${label} sign-up is coming soon.`, 'info');
		});
	});

	const query = new URLSearchParams(window.location.search);
	if (query.get('oauth') === 'failed') {
		showToast('OAuth sign-up failed. Please try again.', 'error');
	}
})();
