(function () {
	const SELECTED_CAMPAIGN_ID_KEY = 'kb.selected.campaign.id';

	const CATEGORY_API_MAP = {
		'education': 'education',
		'health': 'health',
		'natural disasters': 'disaster_relief',
		'natural disaster': 'disaster_relief',
		'community': 'community'
	};

	const rawCategory = String(document.body.getAttribute('data-category-name') || '').trim();
	const apiCategory = CATEGORY_API_MAP[rawCategory.toLowerCase()] || rawCategory.toLowerCase();

	const state = {
		category: rawCategory,
		search: '',
		status: '',
		sort: 'newest',
		allCampaigns: []
	};

	function qs(id) {
		return document.getElementById(id);
	}

	function fmtMoney(value) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value || 0);
	}

	function setHeroStats(campaigns) {
		const total = campaigns.reduce((sum, c) => sum + Number(c.targetAmount || 0), 0);
		if (qs('heroTotal')) qs('heroTotal').textContent = campaigns.length ? fmtMoney(total) : '--';
		if (qs('heroDonors')) qs('heroDonors').textContent = '--';
		if (qs('heroCampaigns')) qs('heroCampaigns').textContent = String(campaigns.length);
	}

	function getFilteredCampaigns() {
		const search = state.search.toLowerCase();
		let rows = state.allCampaigns.filter((c) => {
			const title = String(c.title || '').toLowerCase();
			const desc = String(c.description || '').toLowerCase();
			const status = String(c.status || '').toLowerCase();
			const statusMatch = !state.status || status === state.status;
			return statusMatch && (!search || title.includes(search) || desc.includes(search));
		});

		if (state.sort === 'oldest') {
			rows = rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		} else if (state.sort === 'most-funded') {
			rows = rows.sort((a, b) => Number(b.targetAmount || 0) - Number(a.targetAmount || 0));
		} else if (state.sort === 'least-funded') {
			rows = rows.sort((a, b) => Number(a.targetAmount || 0) - Number(b.targetAmount || 0));
		} else {
			rows = rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		}

		return rows;
	}

	function campaignCardTemplate(campaign) {
		const progress = campaign.targetAmount > 0
			? Math.min(100, Math.round((Number(campaign.currentAmount || 0) / Number(campaign.targetAmount)) * 100))
			: 0;

		return `
			<article class="camp-card reveal">
				<div class="camp-card-head">
					<span class="badge badge-${String(campaign.status || 'pending').toLowerCase()}">${campaign.status || 'pending'}</span>
					<span class="camp-date">${new Date(campaign.createdAt || Date.now()).toLocaleDateString()}</span>
				</div>
				<h3 class="camp-title">${campaign.title}</h3>
				<p class="camp-desc">${campaign.description ? campaign.description.substring(0, 120) + '...' : 'No campaign description available yet.'}</p>
				<div class="camp-meta">Target: <strong>${fmtMoney(campaign.targetAmount || 0)}</strong></div>
				<div style="background:#e0e0e0;height:6px;border-radius:4px;margin:8px 0 4px">
					<div style="background:#27AE60;height:100%;width:${progress}%;border-radius:4px"></div>
				</div>
				<div class="camp-meta" style="font-size:12px">${fmtMoney(campaign.currentAmount || 0)} raised (${progress}%)</div>
				<button class="btn btn-primary btn-sm" onclick="openCampaignDonation('${campaign.id}')" style="margin-top:10px">Donate to this Campaign</button>
			</article>
		`;
	}

	function renderCampaigns() {
		const campaigns = getFilteredCampaigns();
		const grid = qs('campaignsGrid');
		const featured = qs('featuredGrid');
		const results = qs('resultsLabel');

		if (results) {
			results.textContent = campaigns.length
				? `${campaigns.length} campaign(s) available in ${state.category}.`
				: `No ${state.category.toLowerCase()} campaigns yet. Create one from NGO Dashboard.`;
		}

		if (featured) {
			featured.innerHTML = campaigns.slice(0, 2).map(campaignCardTemplate).join('') ||
				'<div class="empty-state"><h3>No featured campaigns yet</h3><p>NGO-created campaigns will appear here once submitted.</p></div>';
		}

		if (grid) {
			grid.innerHTML = campaigns.map(campaignCardTemplate).join('') ||
				'<div class="empty-state"><h3>No campaigns yet</h3><p>There are no campaigns in this category yet.</p></div>';
		}
	}

	function filterCampaigns() {
		state.search = String(qs('searchInput')?.value || '').trim();
		state.status = String(qs('filterStatus')?.value || '').trim().toLowerCase();
		state.sort = String(qs('filterSort')?.value || 'newest').trim();
		renderCampaigns();
	}

	function openCampaignDonation(campaignId) {
		sessionStorage.setItem(SELECTED_CAMPAIGN_ID_KEY, campaignId);
		window.location.href = 'Campaign.html';
	}

	function closeDrawer() {
		const drawer = qs('navDrawer');
		const hamburger = qs('hamburger');
		if (!drawer || !hamburger) return;
		drawer.classList.remove('open');
		hamburger.classList.remove('open');
		hamburger.setAttribute('aria-expanded', 'false');
		drawer.setAttribute('aria-hidden', 'true');
	}

	function openNgoModal() {
		const listing = qs('campaignsGrid');
		if (listing) {
			listing.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function initDrawer() {
		const drawer = qs('navDrawer');
		const hamburger = qs('hamburger');
		if (!drawer || !hamburger) return;

		hamburger.addEventListener('click', function () {
			const open = !drawer.classList.contains('open');
			drawer.classList.toggle('open', open);
			hamburger.classList.toggle('open', open);
			hamburger.setAttribute('aria-expanded', String(open));
			drawer.setAttribute('aria-hidden', String(!open));
		});
	}

	async function init() {
		initDrawer();

		try {
			const params = { status: 'active', limit: 50, offset: 0 };
			if (apiCategory) params.category = apiCategory;
			const res = await CampaignAPI.list(params);
			state.allCampaigns = Array.isArray(res.campaigns) ? res.campaigns : [];
		} catch (_err) {
			state.allCampaigns = [];
		}

		setHeroStats(state.allCampaigns);
		renderCampaigns();
	}

	window.filterCampaigns = filterCampaigns;
	window.openCampaignDonation = openCampaignDonation;
	window.closeDrawer = closeDrawer;
	window.openNgoModal = openNgoModal;

	init();
})();
