(function () {
	const SELECTED_CAMPAIGN_ID_KEY = 'kb.selected.campaign.id';

	const CATEGORY_API_MAP = {
		'education': 'Education',
		'health': 'Health',
		'natural disasters': 'Natural Disaster',
		'community': 'Community'
	};

	const rawCategory = String(document.body.getAttribute('data-category-name') || '').trim();
	const apiCategory = CATEGORY_API_MAP[rawCategory.toLowerCase()] || rawCategory;

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
				if (status === 'draft' || status === 'pending' || status === 'cancelled' || status === 'rejected') return false;
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
		const raised   = Number(campaign.currentAmount || 0);
		const goal     = Number(campaign.targetAmount  || 1);
		const pct      = Math.min(100, Math.round((raised / goal) * 100));
		const img      = campaign.imageUrl || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80';
		const daysLeft = campaign.endDate
			? Math.max(0, Math.ceil((new Date(campaign.endDate) - Date.now()) / 86400000))
			: null;
		const desc = campaign.description
			? campaign.description.substring(0, 100) + '…'
			: 'No description available for this campaign.';

		return `
		<div class="reveal" onclick="openCampaignDonation('${campaign.id}')"
			 style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;"
			 onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 28px rgba(0,0,0,0.13)'"
			 onmouseout="this.style.transform='';this.style.boxShadow='0 2px 16px rgba(0,0,0,0.08)'">

			<!-- Image -->
			<div style="position:relative;height:180px;overflow:hidden;">
				<img src="${img}" alt="${campaign.title}" loading="lazy"
					 style="width:100%;height:100%;object-fit:cover;display:block;"/>
				${campaign.category ? `<span style="position:absolute;top:12px;left:12px;background:rgba(27,42,74,0.85);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;">${campaign.category}</span>` : ''}
				${daysLeft !== null ? `<span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.55);color:#fff;font-size:11px;padding:4px 10px;border-radius:20px;">${daysLeft} days left</span>` : ''}
			</div>

			<!-- Body -->
			<div style="padding:18px 20px 20px;">
				${campaign.ngoName ? `<p style="font-size:11px;color:#5BA4CF;font-weight:600;margin:0 0 5px;text-transform:uppercase;letter-spacing:0.6px;">${campaign.ngoName}</p>` : ''}
				<h3 style="font-size:16px;font-weight:700;color:#1B2A4A;margin:0 0 8px;line-height:1.3;">${campaign.title}</h3>
				<p style="font-size:12.5px;color:#6b7a99;line-height:1.6;margin:0 0 14px;">${desc}</p>

				<!-- Progress -->
				<div style="background:#E8EFF5;border-radius:4px;height:6px;margin-bottom:8px;overflow:hidden;">
					<div style="background:#5BA4CF;height:100%;width:${pct}%;border-radius:4px;"></div>
				</div>
				<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:14px;">
					<span><strong style="color:#1B2A4A;">${fmtMoney(raised)}</strong> raised</span>
					<span>${pct}% of ${fmtMoney(goal)}</span>
				</div>

				<button onclick="event.stopPropagation();openCampaignDonation('${campaign.id}')"
					 style="width:100%;padding:10px;background:#1B2A4A;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Support Now</button>
			</div>
		</div>`;
	}

	function renderCampaigns() {
		const campaigns = getFilteredCampaigns();
		const grid = qs('campaignsGrid');
		const featured = qs('featuredGrid');
		const results = qs('resultsLabel');
		
		if (results) {
			results.textContent = campaigns.length
				? `${campaigns.length} campaign(s) available in ${state.category}.`
				: `No ${state.category.toLowerCase()} campaigns yet. Create one from NGO Dashboard.1`;
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
			const raw = sessionStorage.getItem('kb_donation_context');
			if (raw) {
				const context = JSON.parse(raw);
				ngoId = context.ngoId.split('-')[1];;
			}

			const params = { status: '', category: apiCategory, ngoId: ngoId, limit: 50, offset: 0 };
			const res = await CampaignAPI.list(params);
			state.allCampaigns = Array.isArray(res.campaigns) ? res.campaigns : [];
		} catch (_err) {
			state.allCampaigns = [];
			console.log('Error fetching campaigns:', _err);
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
