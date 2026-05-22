/* ── PHASE 6 INTEGRATION GUIDE ── */

/**
 * FRONTEND API INTEGRATION CHECKLIST
 *
 * This guide explains how to integrate the backend API with your frontend.
 * The backend is available at: http://localhost:4000
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1. REQUIRED SCRIPT INCLUSIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Add these to your HTML head or before your page-specific scripts:
 *
 *   <script src="api.js"></script>
 *   <script src="helpers.js"></script>
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 2. AUTHENTICATION FLOW
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * AUTH API USAGE:
 *
 *   // Sign up (already integrated in Signup.js)
 *   const response = await AuthAPI.signup(firstName, lastName, email, password);
 *
 *   // Sign in (already integrated in SignIn.js)
 *   const response = await AuthAPI.signin(email, password);
 *
 *   // Check if user is authenticated
 *   AuthState.init(); // Call once on page load
 *   const user = AuthState.getUser();
 *   const isAdmin = AuthState.isAdmin();
 *   const isNgoAdmin = AuthState.isNgoAdmin();
 *
 *   // Sign out
 *   await AuthState.logout();
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 3. CAMPAIGNS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * LIST CAMPAIGNS:
 *   const response = await CampaignAPI.list({
 *     status: 'active',      // optional: draft, pending, active, completed, cancelled, rejected
 *     category: 'education',  // optional
 *     search: 'keyword',      // optional
 *     limit: 50,
 *     offset: 0
 *   });
 *   const campaigns = response.campaigns;
 *   CampaignRenderer.renderCampaigns(campaigns, 'campaigns-container');
 *
 * GET SINGLE CAMPAIGN:
 *   const response = await CampaignAPI.getById(campaignId);
 *   const campaign = response.campaign;
 *
 * CREATE CAMPAIGN (requires auth):
 *   const response = await CampaignAPI.create({
 *     title: 'Campaign Title',
 *     description: 'Long description',
 *     category: 'education',
 *     targetAmount: 100000,
 *     ngoId: 'ngo-id'  // if user is NGO admin
 *   });
 *
 * UPDATE CAMPAIGN (requires auth, creator only):
 *   const response = await CampaignAPI.update(campaignId, {
 *     title: 'New Title',
 *     status: 'pending'  // submit for approval
 *   });
 *
 * ADMIN APPROVE CAMPAIGN:
 *   const response = await CampaignAPI.approve(campaignId);
 *
 * ADMIN REJECT CAMPAIGN:
 *   const response = await CampaignAPI.reject(campaignId, 'Rejection reason');
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 4. DONATIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CREATE DONATION (requires auth):
 *   const response = await DonationAPI.create({
 *     campaignId: 'campaign-id',
 *     amount: 5000,
 *     paymentMethod: 'gcash',  // card, gcash, paymaya, bank_transfer
 *     message: 'Optional message'
 *   });
 *
 * GET MY DONATIONS:
 *   const response = await DonationAPI.getMyDonations(limit, offset);
 *   const donations = response.donations;
 *
 * GET CAMPAIGN DONATIONS:
 *   const response = await DonationAPI.getCampaignDonations(campaignId);
 *   const donations = response.donations;
 *
 * GET CAMPAIGN STATS:
 *   const response = await DonationAPI.getCampaignStats(campaignId);
 *   console.log(response.stats); // { totalDonations: X, totalAmount: Y }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 5. NGO MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CREATE NGO PROFILE (requires auth):
 *   const response = await NGOAPI.create({
 *     name: 'NGO Name',
 *     registrationNumber: 'REG-12345',
 *     description: 'NGO Description',
 *     websiteUrl: 'https://example.com',
 *     phoneNumber: '+63912345678',
 *     address: 'Address'
 *   });
 *
 * GET NGO PROFILE:
 *   const response = await NGOAPI.getById(ngoId);
 *   const ngo = response.profile;
 *
 * GET MY NGO PROFILE (requires auth):
 *   const response = await NGOAPI.getMyProfile();
 *   const ngo = response.profile;
 *
 * LIST ALL NGOS:
 *   const response = await NGOAPI.list(limit, offset);
 *   const ngos = response.profiles;
 *
 * LIST VERIFIED NGOS:
 *   const response = await NGOAPI.getVerified(limit, offset);
 *   const ngos = response.profiles;
 *
 * ADMIN: GET PENDING VERIFICATIONS:
 *   const response = await NGOAPI.getPendingVerifications(limit, offset);
 *   const pendingNgos = response.profiles;
 *
 * ADMIN: VERIFY NGO:
 *   const response = await NGOAPI.verify(ngoId);
 *
 * ADMIN: REJECT NGO:
 *   const response = await NGOAPI.reject(ngoId);
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 6. ADMIN DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * LIST ALL USERS:
 *   const response = await AdminAPI.getAllUsers(limit, offset);
 *   const users = response.users;
 *
 * UPDATE USER ROLE (requires superadmin):
 *   const response = await AdminAPI.updateUserRole(userId, 'admin');
 *
 * DELETE USER (requires superadmin):
 *   const response = await AdminAPI.deleteUser(userId);
 *
 * GET ACTIVITY LOGS:
 *   const response = await AdminAPI.getActivityLogs({
 *     adminId: 'filter by admin',
 *     entityType: 'CAMPAIGN',
 *     action: 'APPROVE',
 *     startDate: '2026-05-01',
 *     endDate: '2026-05-31'
 *   });
 *   const logs = response.logs;
 *
 * GET MY ACTIVITY LOGS:
 *   const response = await AdminAPI.getMyActivityLogs(limit, offset);
 *   const logs = response.logs;
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 7. ERROR HANDLING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * try {
 *   const response = await CampaignAPI.list();
 *   // Handle success
 * } catch (error) {
 *   const statusCode = error.status; // HTTP status code
 *   const message = error.message;   // Error message from API
 *   const data = error.data;         // Full error response object
 *
 *   ToastHelper.error(message);
 * }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 8. TOAST NOTIFICATIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ToastHelper.success('Campaign created!');
 * ToastHelper.error('Failed to create campaign');
 * ToastHelper.warning('Campaign is pending approval');
 * ToastHelper.info('Campaign approved');
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 9. UPDATED FILES IN THIS PHASE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ✓ api.js - Complete API wrapper with all endpoints
 * ✓ helpers.js - Campaign renderer, user profile, toast notifications
 * ✓ SignIn.js - Already integrated (no changes needed)
 * ✓ Signup.js - Already integrated (no changes needed)
 *
 * TODO - FILES TO UPDATE IN NEXT STEPS:
 * □ Campaigns.js - Load campaigns from API instead of sessionStorage
 * □ Landingpage.js - Load campaigns and NGOs from API
 * □ UserProfile.js - Display user profile and donation history
 * □ AdminDashboard.js - Load real data from admin endpoints
 * □ Campaign.html - Add script references to api.js and helpers.js
 * □ Landingpage.html - Add script references to api.js and helpers.js
 * □ UserProfile.html - Add script references to api.js and helpers.js
 * □ AdminDashboard.html - Add script references to api.js and helpers.js
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 10. EXAMPLE: LOADING CAMPAIGNS ON LANDING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * async function loadCampaigns() {
 *   try {
 *     const response = await CampaignAPI.list({ status: 'active', limit: 12 });
 *     CampaignRenderer.renderCampaigns(response.campaigns, 'campaigns-grid');
 *   } catch (error) {
 *     ToastHelper.error('Failed to load campaigns: ' + error.message);
 *   }
 * }
 *
 * // Call on page load
 * document.addEventListener('DOMContentLoaded', loadCampaigns);
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 11. EXAMPLE: LOADING CAMPAIGN DETAILS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * async function loadCampaignDetails() {
 *   const campaignId = sessionStorage.getItem('kb.selected.campaign.id');
 *   if (!campaignId) {
 *     window.location.href = 'Landingpage.html';
 *     return;
 *   }
 *
 *   try {
 *     const response = await CampaignAPI.getById(campaignId);
 *     const campaign = response.campaign;
 *
 *     // Update page with campaign data
 *     document.getElementById('campaignTitle').textContent = campaign.title;
 *     document.getElementById('campaignDesc').textContent = campaign.description;
 *     // ... etc
 *
 *   } catch (error) {
 *     ToastHelper.error('Failed to load campaign');
 *   }
 * }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
