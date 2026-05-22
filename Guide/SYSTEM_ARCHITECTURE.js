/**
 * ════════════════════════════════════════════════════════════════════════════════
 * KAPITBISIG - COMPLETE SYSTEM ARCHITECTURE
 * ════════════════════════════════════════════════════════════════════════════════
 *
 *                         FRONTEND (HTML/CSS/JavaScript)
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                                                                               │
 * │  HTML Pages                    JavaScript Modules          Helper Modules    │
 * │  ├─ SignIn.html  ──────────→  ├─ SignIn.js               ├─ api.js         │
 * │  ├─ Signup.html  ──────────→  ├─ Signup.js               ├─ helpers.js     │
 * │  ├─ Landingpage.html ────────→ ├─ Landingpage.js          └─ [Custom]       │
 * │  ├─ Campaign.html ──────────→  ├─ Campaigns.js                             │
 * │  ├─ UserProfile.html ───────→  ├─ UserProfile.js                           │
 * │  ├─ AdminDashboard.html ────→  ├─ AdminDashboard.js                        │
 * │  └─ [Other pages]          └─ [Other scripts]                              │
 * │                                                                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    │ HTTP Requests (JSON)
 *                                    │
 *                                    ▼
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                    BACKEND API (Node.js + Express)                           │
 * │                      http://localhost:4000                                    │
 * │                                                                               │
 * │  Routes (5 modules)        Controllers (5 modules)    Services (5 modules)  │
 * │  ├─ authRoutes.js  ────────→  ├─ authController.js    ├─ (inline)           │
 * │  ├─ campaignRoutes.js ────→   ├─ campaignController.js├─ campaignService.js │
 * │  ├─ donationRoutes.js ────→   ├─ donationController.js├─ donationService.js │
 * │  ├─ ngoRoutes.js  ─────────→  ├─ ngoController.js     ├─ ngoService.js      │
 * │  └─ adminRoutes.js ────────→  ├─ adminController.js   └─ adminService.js    │
 * │                               └─ [Middleware: auth, authorize, validate]    │
 * │                                                                               │
 * │  Models (5 modules)           Middleware (4 modules)   Utils (2 modules)    │
 * │  ├─ userModel.js       ◄──────├─ auth.js ─────────────  ├─ constants.js      │
 * │  ├─ campaignModel.js   ◄──────├─ authorize.js ────────  └─ validators.js     │
 * │  ├─ donationModel.js   ◄──────├─ errorHandler.js                            │
 * │  ├─ ngoModel.js        ◄──────└─ validate.js                                │
 * │  └─ activityLogModel.js                                                     │
 * │                                                                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    │ SQL Queries
 *                                    │
 *                                    ▼
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                       MySQL Database (XAMPP)                                 │
 * │                      kapitbisig_db                                           │
 * │                                                                               │
 * │  Tables (5 core)              Tables (supporting)                            │
 * │  ├─ users                     ├─ [Foreign key relationships]                 │
 * │  ├─ campaigns                 ├─ [Cascade delete on FK violations]           │
 * │  ├─ donations                 ├─ [Composite indexes for performance]         │
 * │  ├─ ngo_profiles                                                             │
 * │  └─ activity_logs                                                            │
 * │                                                                               │
 * │  Constraints:                                                                │
 * │  • PK: Auto-increment IDs                                                    │
 * │  • UK: Email (users), Registration Number (NGOs)                             │
 * │  • FK: Created_by → users, NGO_id → ngo_profiles, etc.                      │
 * │  • Indexes: Status, roles, dates for filtering                               │
 * │                                                                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * DATA FLOW EXAMPLE: Creating a Donation
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * 1. USER INITIATES:
 *    Campaign.html (displayed from Campaigns.js)
 *    User clicks "Donate" button
 *
 * 2. FRONTEND:
 *    Campaigns.js calls DonationAPI.create(campaignId, amount, paymentMethod)
 *    Which calls apiFetch('/donations', { method: 'POST', body: JSON.stringify(...) })
 *
 * 3. HTTP REQUEST:
 *    POST http://localhost:4000/donations
 *    Authorization: Session cookie (includes user ID)
 *    Body: { campaignId: '123', amount: 5000, paymentMethod: 'gcash' }
 *
 * 4. BACKEND ROUTING:
 *    express app routes to donationRoutes.js
 *    Matches: POST /donations
 *    Applies middleware: auth (verifies session), errorHandler
 *    Calls: donationController.createDonation()
 *
 * 5. CONTROLLER:
 *    Validates request body
 *    Calls donationService.createDonation()
 *
 * 6. SERVICE:
 *    Validates business logic (campaign exists, amount > 0)
 *    Calls Donation.create() model
 *    Returns donation object
 *
 * 7. MODEL:
 *    Executes SQL: INSERT INTO donations (campaign_id, donor_id, amount, ...)
 *    db.query() calls database.js
 *    Returns created donation with ID
 *
 * 8. RESPONSE:
 *    { message: "Donation created", donation: {...} }
 *    HTTP 201
 *
 * 9. FRONTEND RECEIVES:
 *    Campaigns.js receives response
 *    Updates UI with success message
 *    Calls loadDonationStats() to refresh progress bar
 *    Shows success modal
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * AUTHENTICATION FLOW
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * 1. SIGNUP:
 *    SignUp.html → Signup.js → AuthAPI.signup() → POST /auth/signup
 *    Backend: authController.signup() → userModel.createUser()
 *    Sets req.session.userId, returns user object
 *    Browser stores session cookie automatically
 *
 * 2. SIGNIN:
 *    SignIn.html → SignIn.js → AuthAPI.signin() → POST /auth/signin
 *    Backend: authController.signin() → userModel.findByEmail()
 *    Compares password with bcrypt.compare()
 *    Sets req.session.userId if match
 *
 * 3. PROTECTED REQUESTS:
 *    Any API call automatically includes session cookie (credentials: 'include')
 *    Backend auth middleware: verifies session exists
 *    If no session: returns 401 Unauthorized
 *    Frontend AuthState.init() checks /auth/me to get current user
 *
 * 4. LOGOUT:
 *    User clicks logout → AuthState.logout() → POST /auth/logout
 *    Backend: req.session.destroy()
 *    Cookie cleared, user can't access protected endpoints
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * ROLES:
 * • donor - Can view campaigns, donate, manage profile
 * • ngo_admin - Can create/edit campaigns, view own stats
 * • admin - Can approve/reject campaigns, verify NGOs, view logs
 * • superadmin - Full access, can manage users and roles
 *
 * MIDDLEWARE CHECKS:
 * • auth.js - Verifies user is logged in
 * • authorize.js - Two patterns:
 *   - authorizeRoles(['admin', 'superadmin'])
 *   - authorizePermission('campaign.approve')
 *
 * EXAMPLE:
 *   router.post('/:id/approve',
 *     auth,                                    // Must be logged in
 *     authorize.authorizeRoles(['admin', 'superadmin']),  // Must be admin+
 *     campaignController.approveCampaign
 *   );
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * ERROR HANDLING FLOW
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * FRONTEND (api.js):
 * try {
 *   const response = await apiFetch('/campaigns', options);
 * } catch (error) {
 *   // error.status - HTTP status code
 *   // error.message - Error message
 *   // error.data - Full error response
 * }
 *
 * BACKEND (errorHandler.js):
 * • Catches all errors from controllers/services
 * • Categorizes: ValidationError, DatabaseError, NotFoundError, etc.
 * • Returns consistent error format:
 *   { message: "Error description", status: 400 }
 * • Logs errors with full stack trace for debugging
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * DATABASE RELATIONSHIPS
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * users (1) ──────┬─→ (many) campaigns
 *                 └─→ (many) donations
 *                 └─→ (1) ngo_profiles
 *
 * campaigns (1) ──────┬─→ (many) donations
 *                     ├─→ (1) ngo_profiles (created by)
 *                     └─→ (1) users (created_by)
 *
 * donations (many) ────→ (1) campaigns
 *              └────→ (1) users (donor_id)
 *
 * ngo_profiles (1) ──────→ (many) campaigns
 *               └────→ (1) users
 *
 * activity_logs (many) ────→ (1) users (admin_id)
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * DEPLOYMENT CHECKLIST (FUTURE)
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * □ Set NODE_ENV=production in backend
 * □ Use real database (not XAMPP)
 * □ Update FRONTEND_ORIGINS in .env for production domain
 * □ Update API_BASE in api.js to production URL
 * □ Enable HTTPS everywhere
 * □ Set secure session cookies (secure: true, sameSite: 'strict')
 * □ Add rate limiting
 * □ Add helmet.js for security headers
 * □ Enable CORS only for your domain
 * □ Set strong SESSION_SECRET (use: crypto.randomBytes(32).toString('hex'))
 * □ Run automated tests before deployment
 * □ Set up monitoring and logging
 * □ Configure backups for database
 *
 * ════════════════════════════════════════════════════════════════════════════════
 */
