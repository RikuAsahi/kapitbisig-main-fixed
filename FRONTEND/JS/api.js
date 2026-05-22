/* ── KAPITBISIG API CLIENT ── */
const API_BASE = window.KB_API_BASE || 'http://localhost:5001';

/* ── HTTP METHODS ── */
const http = {
	async _request(endpoint, method, body) {
		const options = {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include'
		};
		if (body !== undefined) {
			options.body = JSON.stringify(body);
		}
		const res = await fetch(API_BASE + endpoint, options);
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			const error = new Error(data.message || `API error ${res.status}`);
			error.status = res.status;
			error.data = data;
			throw error;
		}
		return data;
	},

	get(endpoint)          { return this._request(endpoint, 'GET'); },
	post(endpoint, body)   { return this._request(endpoint, 'POST', body); },
	put(endpoint, body)    { return this._request(endpoint, 'PUT', body); },
	patch(endpoint, body)  { return this._request(endpoint, 'PATCH', body); },
	delete(endpoint)       { return this._request(endpoint, 'DELETE'); }
};

/* ── AUTH API ── */
const AuthAPI = {
	signup: (firstName, lastName, email, password) =>
		http.post('/auth/signup', { firstName, lastName, email, password }),

	signin: (email, password) =>
		http.post('/auth/signin', { email, password }),

	getMe: () =>
		http.get('/auth/me'),

	logout: () =>
		http.post('/auth/logout'),

	updateMe: (data) =>
		http.put('/auth/me', data)
};

/* ── CAMPAIGNS API ── */
const CampaignAPI = {
	list: (filters = {}) => {
		const params = new URLSearchParams();
		if (filters.status)   params.append('status',   filters.status);
		if (filters.category) params.append('category', filters.category);
		if (filters.search)   params.append('search',   filters.search);
		if (filters.ngoId)    params.append('ngoId',    filters.ngoId);
		if (filters.limit)    params.append('limit',    filters.limit);
		if (filters.offset)   params.append('offset',   filters.offset);
		return http.get(`/campaigns?${params}`);
	},

	getById: (id) =>
		http.get(`/campaigns/${id}`),

	create: (data) =>
		http.post('/campaigns', data),

	update: (id, data) =>
		http.put(`/campaigns/${id}`, data),

	submitForApproval: (id) =>
		http.post(`/campaigns/${id}/submit`),

	approve: (id) =>
		http.post(`/campaigns/${id}/approve`),

	reject: (id, reason) =>
		http.post(`/campaigns/${id}/reject`, { reason }),

	delete: (id) =>
		http.delete(`/campaigns/${id}`),

	getLikes: (id) =>
		http.get(`/campaigns/${id}/likes`),

	toggleLike: (id) =>
		http.post(`/campaigns/${id}/like`),

	getComments: (id, limit = 20, offset = 0) =>
		http.get(`/campaigns/${id}/comments?limit=${limit}&offset=${offset}`),

	addComment: (id, text) =>
		http.post(`/campaigns/${id}/comments`, { text })
};

/* ── DONATIONS API ── */
const DonationAPI = {
	create: (data) =>
		http.post('/donations', data),

	getById: (id) =>
		http.get(`/donations/${id}`),

	getMyDonations: (limit = 50, offset = 0) =>
		http.get(`/donations/my-donations?limit=${limit}&offset=${offset}`),

	getCampaignDonations: (campaignId, limit = 100, offset = 0) =>
		http.get(`/donations/campaign/${campaignId}/donations?limit=${limit}&offset=${offset}`),

	getCampaignStats: (campaignId) =>
		http.get(`/donations/campaign/${campaignId}/stats`)
};

/* ── NGO API ── */
const NGOAPI = {
	create: (data) =>
		http.post('/ngos', data),

	list: (filters = {}) => {
		const params = new URLSearchParams();
		params.append('limit',  filters.limit  || 50);
		params.append('offset', filters.offset || 0);
		return http.get(`/ngos?${params}`);
	},

	getVerified: (filters = {}) => {
		const params = new URLSearchParams();
		params.append('limit',  filters.limit  || 50);
		params.append('offset', filters.offset || 0);
		return http.get(`/ngos/verified?${params}`);
	},

	getById: (id) =>
		http.get(`/ngos/${id}`),

	getMyProfile: () =>
		http.get('/ngos/my-profile'),

	update: (id, data) =>
		http.put(`/ngos/${id}`, data),

	delete: (id) =>
		http.delete(`/ngos/${id}`),

	getPendingVerifications: (limit = 50, offset = 0) =>
		http.get(`/ngos/verification/pending?limit=${limit}&offset=${offset}`),

	getAnalytics: (id) =>
		http.get(`/ngos/${id}/analytics`),

	verify: (id) =>
		http.post(`/ngos/${id}/verify`),

	reject: (id) =>
		http.post(`/ngos/${id}/reject`)
};

/* ── ADMIN API ── */
const AdminAPI = {
	getAllUsers: (filters = {}) => {
		const params = new URLSearchParams();
		params.append('limit',  filters.limit  || 50);
		params.append('offset', filters.offset || 0);
		return http.get(`/admin/users?${params}`);
	},

	updateUserRole: (userId, role) =>
		http.put(`/admin/users/${userId}/role`, { role }),

	deleteUser: (userId) =>
		http.delete(`/admin/users/${userId}`),

	getActivityLogs: (filters = {}) => {
		const params = new URLSearchParams();
		if (filters.adminId)    params.append('adminId',    filters.adminId);
		if (filters.entityType) params.append('entityType', filters.entityType);
		if (filters.action)     params.append('action',     filters.action);
		if (filters.startDate)  params.append('startDate',  filters.startDate);
		if (filters.endDate)    params.append('endDate',    filters.endDate);
		if (filters.limit)      params.append('limit',      filters.limit);
		if (filters.offset)     params.append('offset',     filters.offset);
		return http.get(`/admin/activity-logs?${params}`);
	},

	getMyActivityLogs: (limit = 50, offset = 0) =>
		http.get(`/admin/my-activity-logs?limit=${limit}&offset=${offset}`),

	getActivityLog: (id) =>
		http.get(`/admin/activity-logs/${id}`)
};

/* ── AUTH STATE MANAGEMENT ── */
const AuthState = {
	currentUser: null,
	isAuthenticated: false,

	async init() {
		try {
			const response = await AuthAPI.getMe();
			this.currentUser = response.user;
			this.isAuthenticated = true;
		} catch {
			this.currentUser = null;
			this.isAuthenticated = false;
		}
		this._updateNav();
	},

	_updateNav() {
		const isAuth = this.isAuthenticated;
		const user = this.currentUser;

		// Hide/show Sign In & Sign Up links
		document.querySelectorAll('.nav-signin, .nav-signup').forEach(el => {
			const li = el.closest('li') || el;
			li.style.display = isAuth ? 'none' : '';
		});
		document.querySelectorAll('.drawer-signin, .drawer-signup').forEach(el => {
			el.style.display = isAuth ? 'none' : '';
		});

		// Show/hide profile nav items
		document.querySelectorAll('.nav-profile-item').forEach(el => {
			el.style.display = isAuth ? '' : 'none';
		});
		document.querySelectorAll('.drawer-profile-item').forEach(el => {
			el.style.display = isAuth ? '' : 'none';
		});

		// Populate profile name
		if (isAuth && user) {
			document.querySelectorAll('.nav-profile-name').forEach(el => {
				el.textContent = user.firstName || 'Profile';
			});
		}
	},

	async login(email, password) {
		const response = await AuthAPI.signin(email, password);
		this.currentUser = response.user;
		this.isAuthenticated = true;
		return response;
	},

	async register(firstName, lastName, email, password) {
		const response = await AuthAPI.signup(firstName, lastName, email, password);
		this.currentUser = response.user;
		this.isAuthenticated = true;
		return response;
	},

	async logout() {
		await AuthAPI.logout();
		this.currentUser = null;
		this.isAuthenticated = false;
	},

	getUser() {
		return this.currentUser;
	},

	isAdmin() {
		return this.currentUser && ['admin', 'superadmin'].includes(this.currentUser.role);
	},

	isNgoAdmin() {
		return this.currentUser && this.currentUser.role === 'ngo_admin';
	},

	isDonor() {
		return this.currentUser && this.currentUser.role === 'donor';
	}
};

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => AuthState.init());
