/* Landing page interactions */
(function () {
	const body = document.body;

	function fmtMoney(v) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number(v || 0));
	}

	function escHtml(t) {
		const d = document.createElement('div');
		d.appendChild(document.createTextNode(String(t || '')));
		return d.innerHTML;
	}

	function selectCampaign(id) {
		sessionStorage.setItem('kb.selected.campaign.id', String(id));
		window.location.href = 'Campaign.html?id=' + id;
	}

	async function loadLiveCampaigns() {
		const grid = document.getElementById('liveCampaignsGrid');
		if (!grid) return;

		try {
			const response = await CampaignAPI.list({ status: 'active', limit: 6 });
			const campaigns = response.campaigns || [];

			if (!campaigns.length) {
				const section = document.getElementById('live-campaigns');
				if (section) section.style.display = 'none';
				return;
			}

			grid.innerHTML = campaigns.map(function (c) {
				const raised = Number(c.currentAmount || 0);
				const goal = Number(c.targetAmount || 1);
				const pct = Math.min(100, Math.round((raised / goal) * 100));
				const img = c.imageUrl || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80';
				const daysLeft = c.endDate ? Math.max(0, Math.ceil((new Date(c.endDate) - Date.now()) / 86400000)) : null;
				const id = escHtml(String(c.id));

				return '<div onclick="selectCampaign(\'' + id + '\')" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 28px rgba(0,0,0,0.13)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 16px rgba(0,0,0,0.08)\'">'
					+ '<div style="position:relative;height:180px;overflow:hidden;">'
					+ '<img src="' + escHtml(img) + '" alt="' + escHtml(c.title) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/>'
					+ (c.category ? '<span style="position:absolute;top:12px;left:12px;background:rgba(27,42,74,0.85);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;">' + escHtml(c.category) + '</span>' : '')
					+ (daysLeft !== null ? '<span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.55);color:#fff;font-size:11px;padding:4px 10px;border-radius:20px;">' + daysLeft + ' days left</span>' : '')
					+ '</div>'
					+ '<div style="padding:18px 20px 20px;">'
					+ (c.ngoName ? '<p style="font-size:11px;color:#5BA4CF;font-weight:600;margin:0 0 5px;text-transform:uppercase;letter-spacing:0.6px;">' + escHtml(c.ngoName) + '</p>' : '')
					+ '<h3 style="font-size:16px;font-weight:700;color:#1B2A4A;margin:0 0 12px;line-height:1.3;">' + escHtml(c.title) + '</h3>'
					+ '<div style="background:#E8EFF5;border-radius:4px;height:6px;margin-bottom:8px;overflow:hidden;">'
					+ '<div style="background:#5BA4CF;height:100%;width:' + pct + '%;border-radius:4px;"></div>'
					+ '</div>'
					+ '<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:14px;">'
					+ '<span><strong style="color:#1B2A4A;">' + fmtMoney(raised) + '</strong> raised</span>'
					+ '<span>' + pct + '% of ' + fmtMoney(goal) + '</span>'
					+ '</div>'
					+ '<button style="width:100%;padding:10px;background:#1B2A4A;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Support Now</button>'
					+ '</div>'
					+ '</div>';
			}).join('');
		} catch (_) {
			const section = document.getElementById('live-campaigns');
			if (section) section.style.display = 'none';
		}
	}
	const hamburger = document.getElementById('hamburger');
	const navDrawer = document.getElementById('navDrawer');
	const modalOverlay = document.getElementById('modalOverlay');
	const modalCategory = document.getElementById('modalCategory');
	const donateBtn = document.getElementById('donateBtn');

	let drawerOpen = false;
	let selectedNGOId = null;
	let selectedCategory = '';

	const categoryRoutes = {
		Education: 'EducCategory.html',
		Health: 'HealthCategory.html',
		'Natural Disaster': 'NaturalCategory.html',
		Community: 'CommunityCategory.html'
	};

	function setBodyLocked(locked) {
		body.style.overflow = locked ? 'hidden' : '';
	}

	function setDrawer(open) {
		if (!hamburger || !navDrawer) return;
		drawerOpen = open;
		hamburger.classList.toggle('open', open);
		navDrawer.classList.toggle('open', open);
		hamburger.setAttribute('aria-expanded', String(open));
		navDrawer.setAttribute('aria-hidden', String(!open));
	}

	function openDrawer() {
		setDrawer(true);
		setBodyLocked(true);
	}

	function closeDrawer() {
		setDrawer(false);
		if (!modalOverlay || !modalOverlay.classList.contains('open')) {
			setBodyLocked(false);
		}
	}

	function showReveals() {
		const revealEls = document.querySelectorAll('.reveal');
		if (!revealEls.length) return;

		if (!('IntersectionObserver' in window)) {
			revealEls.forEach((el) => el.classList.add('visible'));
			return;
		}

		const observer = new IntersectionObserver(
			(entries, io) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					entry.target.classList.add('visible');
					io.unobserve(entry.target);
				});
			},
			{ threshold: 0.12 }
		);

		revealEls.forEach((el) => observer.observe(el));
	}

	async function renderStats() {
		const nums = document.querySelectorAll('.stats-strip .stat-num');
		const labels = document.querySelectorAll('.stats-strip .stat-label');
		if (nums.length < 2 || labels.length < 2) return;

		try {
			const [campaignsRes, ngosRes] = await Promise.all([
				CampaignAPI.list({ status: 'active', limit: 200 }),
				NGOAPI.getVerified({ limit: 100 })
			]);

			const campaigns = campaignsRes.campaigns || [];
			const ngos = ngosRes.profiles || ngosRes.ngos || [];

			const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.currentAmount || 0), 0);
			const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

			nums[0].textContent = fmt.format(totalRaised);
			labels[0].textContent = 'Total Raised';
			nums[1].textContent = ngos.length || '2';
			labels[1].textContent = 'Partner NGOs';
		} catch (_err) {
			nums[0].textContent = '--';
			labels[0].textContent = 'Total Raised';
			nums[1].textContent = '--';
			labels[1].textContent = 'Partner NGOs';
		}
	}

	function openModal(categoryName) {
		if (!modalOverlay) return;
		selectedCategory = categoryName;
		selectedNGOId = null;

		if (modalCategory) {
			modalCategory.textContent = categoryName;
		}

		const ngoCards = modalOverlay.querySelectorAll('.ngo-card');
		ngoCards.forEach((card) => card.classList.remove('selected'));
		if (donateBtn) donateBtn.disabled = true;

		modalOverlay.classList.add('open');
		setBodyLocked(true);
	}

	function closeModal() {
		if (!modalOverlay) return;
		modalOverlay.classList.remove('open');
		if (!drawerOpen) {
			setBodyLocked(false);
		}
	}

	function selectNGO(ngoId) {
		if (!modalOverlay) return;
		selectedNGOId = ngoId;

		modalOverlay.querySelectorAll('.ngo-card').forEach((card) => {
			card.classList.toggle('selected', card.id === ngoId);
		});

		if (donateBtn) donateBtn.disabled = false;
	}

	function proceedDonate() {
		if (!selectedCategory || !selectedNGOId) return;

		const route = categoryRoutes[selectedCategory] || 'Campaign.html';
		const payload = {
			category: selectedCategory,
			ngoId: selectedNGOId,
			ts: Date.now()
		};

		sessionStorage.setItem('kb_donation_context', JSON.stringify(payload));
		window.location.href = route;
	}

	function goToCategory(categoryName) {
		openModal(categoryName);
	}

	function getCampaignCategoriesUrl() {
		const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
		return page === 'landingpage.html' ? 'Landingpage.html#campaigns' : 'index.html#campaigns';
	}

	function handleOverlayClick(event) {
		if (event.target === modalOverlay) closeModal();
	}

	function toggleFAQ(button) {
		const item = button.closest('.faq-item');
		if (!item) return;

		const isOpen = item.classList.contains('open');
		item.classList.toggle('open', !isOpen);
		button.setAttribute('aria-expanded', String(!isOpen));

		const bodyEl = item.querySelector('.faq-body');
		if (bodyEl) {
			bodyEl.setAttribute('aria-hidden', String(isOpen));
		}
	}

	async function handleDonateClick() {
		try {
			await AuthAPI.getMe();
			window.location.href = getCampaignCategoriesUrl();
		} catch (error) {
			window.location.href = 'SignIn.html';
		}
	}

	if (hamburger) {
		hamburger.addEventListener('click', function () {
			if (drawerOpen) {
				closeDrawer();
			} else {
				openDrawer();
			}
		});
	}

	window.addEventListener('resize', function () {
		if (window.innerWidth > 768 && drawerOpen) {
			closeDrawer();
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Escape') return;
		if (drawerOpen) closeDrawer();
		if (modalOverlay && modalOverlay.classList.contains('open')) closeModal();
	});

	window.closeDrawer = closeDrawer;
	window.goToCategory = goToCategory;
	window.closeModal = closeModal;
	window.selectNGO = selectNGO;
	window.proceedDonate = proceedDonate;
	window.handleOverlayClick = handleOverlayClick;
	window.toggleFAQ = toggleFAQ;
	window.selectCampaign = selectCampaign;
	window.handleDonateClick = handleDonateClick;

	renderStats();
	showReveals();
	loadLiveCampaigns();
})();
