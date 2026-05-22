/* ── CAMPAIGN RENDERER ── */
const CampaignRenderer = {
	/**
	 * Render a list of campaigns into a container
	 * @param {Array} campaigns - Array of campaign objects
	 * @param {string} containerId - ID of the container to render into
	 * @param {Object} options - Rendering options
	 */
	renderCampaigns(campaigns, containerId, options = {}) {
		const container = document.getElementById(containerId);
		if (!container) return;

		const { onSelectCampaign = null, showStatus = false } = options;

		container.innerHTML = '';

		if (!campaigns || campaigns.length === 0) {
			container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">No campaigns found.</p>';
			return;
		}

		campaigns.forEach((campaign) => {
			const card = this.createCampaignCard(campaign, { onSelectCampaign, showStatus });
			container.appendChild(card);
		});
	},

	/**
	 * Create a single campaign card element
	 */
	createCampaignCard(campaign, options = {}) {
		const { onSelectCampaign = null, showStatus = false } = options;

		const card = document.createElement('div');
		card.className = 'campaign-card';
		card.id = `campaign-${campaign.id}`;

		const progress = ((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100;
		const formattedRaised = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
			campaign.currentAmount || 0
		);
		const formattedGoal = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
			campaign.targetAmount || 0
		);

		let statusBadge = '';
		if (showStatus) {
			const statusColor = {
				draft: '#999',
				pending: '#FFA500',
				active: '#27AE60',
				completed: '#2980B9',
				cancelled: '#E74C3C',
				rejected: '#C0392B'
			}[campaign.status] || '#999';

			statusBadge = `<span class="status-badge" style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">${campaign.status}</span>`;
		}

		card.innerHTML = `
			<div style="position: relative;">
				<img src="${campaign.imageUrl || 'https://via.placeholder.com/300x200?text=Campaign'}" alt="${campaign.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
				${statusBadge}
			</div>
			<div style="padding: 1rem;">
				<h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; line-height: 1.3;">${campaign.title}</h3>
				<p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: #666; line-height: 1.4;">${campaign.description ? campaign.description.substring(0, 100) + '...' : 'No description'}</p>

				<div style="background: #f0f0f0; height: 8px; border-radius: 4px; margin-bottom: 0.5rem; overflow: hidden;">
					<div style="background: #27AE60; height: 100%; width: ${progress}%;"></div>
				</div>

				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.875rem;">
					<span style="color: #333; font-weight: 600;">${formattedRaised}</span>
					<span style="color: #999;">of ${formattedGoal}</span>
				</div>

				<button onclick="CampaignRenderer.selectCampaign('${campaign.id}')" style="width: 100%; padding: 0.75rem; background: #1B2A4A; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
					View Campaign
				</button>
			</div>
		`;

		if (options.onSelectCampaign) {
			card.addEventListener('click', () => options.onSelectCampaign(campaign));
		}

		return card;
	},

	/**
	 * Store campaign in session and navigate to campaign page
	 */
	selectCampaign(campaignId) {
		// In a real app, you would fetch the full campaign details
		sessionStorage.setItem('kb.selected.campaign.id', campaignId);
		window.location.href = 'Campaign.html';
	}
};

/* ── USER PROFILE HELPER ── */
const UserProfileHelper = {
	async loadUserProfile() {
		try {
			const user = AuthState.getUser();
			if (!user) {
				window.location.href = 'SignIn.html';
				return null;
			}
			return user;
		} catch (error) {
			console.error('Failed to load user profile:', error);
			return null;
		}
	},

	displayUserProfile(user) {
		if (!user) return;

		const elements = {
			name: document.getElementById('userName'),
			email: document.getElementById('userEmail'),
			role: document.getElementById('userRole'),
			joinDate: document.getElementById('userJoinDate')
		};

		if (elements.name) elements.name.textContent = user.fullName || user.firstName + ' ' + user.lastName;
		if (elements.email) elements.email.textContent = user.email;
		if (elements.role) elements.role.textContent = user.role.replace('_', ' ').toUpperCase();
		if (elements.joinDate) {
			const date = new Date(user.createdAt);
			elements.joinDate.textContent = date.toLocaleDateString('en-PH');
		}
	},

	async logout() {
		try {
			await AuthState.logout();
			window.location.href = 'Landingpage.html';
		} catch (error) {
			console.error('Logout failed:', error);
			alert('Logout failed. Please try again.');
		}
	}
};

/* ── TOAST NOTIFICATION HELPER ── */
const ToastHelper = {
	show(message, type = 'info', duration = 3000) {
		const toast = document.createElement('div');
		toast.className = `toast toast-${type}`;
		toast.textContent = message;

		Object.assign(toast.style, {
			position: 'fixed',
			top: '20px',
			right: '20px',
			padding: '12px 20px',
			borderRadius: '8px',
			color: '#fff',
			fontSize: '14px',
			fontWeight: '600',
			zIndex: '10000',
			boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
			animation: 'slideIn 0.3s ease'
		});

		const bgColor = {
			success: '#27AE60',
			error: '#E74C3C',
			warning: '#F39C12',
			info: '#1B2A4A'
		}[type] || '#1B2A4A';

		toast.style.background = bgColor;
		document.body.appendChild(toast);

		setTimeout(() => {
			toast.style.animation = 'slideOut 0.3s ease';
			setTimeout(() => toast.remove(), 300);
		}, duration);
	},

	success(message) {
		this.show(message, 'success');
	},

	error(message) {
		this.show(message, 'error');
	},

	warning(message) {
		this.show(message, 'warning');
	},

	info(message) {
		this.show(message, 'info');
	}
};
