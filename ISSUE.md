# KapitBisig — Project Documentation

> **Last Updated:** 2026-05-26
> **Version:** 1.0.0
> **Repository:** https://github.com/RikuAsahi/KB-CLEAN-VER
> **Overall Completion:** ~97%

---

## Table of Contents

1. [Product Requirements Document (PRD)](#product-requirements-document-prd)
2. [Product Completion Document (PCD)](#product-completion-document-pcd)
3. [Open Issues](#open-issues)
4. [Blockers](#blockers)
5. [Changelog](#changelog)

---

## Product Requirements Document (PRD)

### 1. Overview

KapitBisig is a Philippine NGO crowdfunding platform that connects verified non-government organizations with donors. The platform allows NGOs to create and manage fundraising campaigns, donors to discover and contribute to causes, and administrators to govern the entire ecosystem with full visibility.

### 2. Users & Roles

| Role | Description |
|---|---|
| **Donor** | Registered user who browses campaigns and makes donations |
| **NGO** | Verified organization that creates and manages campaigns |
| **Admin** | Platform moderator who approves campaigns and manages users/NGOs |
| **Superadmin** | Full platform control including role changes and deletions |
| **Public** | Unauthenticated visitor who can browse active campaigns |

### 3. Core Requirements

#### 3.1 Authentication & Registration

- **REQ-AUTH-01:** Donors register with first name, last name, email, and password
- **REQ-AUTH-02:** Email must be a valid Gmail address (frontend validation)
- **REQ-AUTH-03:** Passwords must meet strength requirements; stored as bcrypt hash (10 rounds)
- **REQ-AUTH-04:** Sessions are httpOnly cookies with 7-day TTL and sameSite=lax
- **REQ-AUTH-05:** Separate login portals for donors (SignIn.html) and admin/NGO (AdminLogIn.html)
- **REQ-AUTH-06:** Role-based redirect after login (donor → landing page, admin/NGO → dashboard)
- **REQ-AUTH-07:** Forgot Password flow — token (1hr expiry) + reset endpoint
- **REQ-AUTH-08:** Google OAuth 2.0 login *(future — blocked on app registration)*
- **REQ-AUTH-09:** Facebook OAuth login *(future — blocked on app registration)*
- **REQ-AUTH-10:** Rate limiting on login endpoint (5 attempts per 15 minutes)

#### 3.2 Campaigns — Donor View

- **REQ-CAMP-01:** Public campaign listing page with search, category filter, and live data
- **REQ-CAMP-02:** Campaign detail page showing NGO info, goal, raised amount, progress bar
- **REQ-CAMP-03:** Progress bar updates in real-time (30-second polling)
- **REQ-CAMP-04:** Like, comment, and share campaigns
- **REQ-CAMP-05:** Category-filtered pages: Education, Health, Community, Natural Disaster
- **REQ-CAMP-06:** Share campaign via Facebook, Twitter, Viber, or copy link

#### 3.3 Payment & Donations

- **REQ-PAY-01:** Admin can enable/disable individual payment methods from the dashboard
- **REQ-PAY-02:** Donor-facing payment modal only shows currently enabled methods
- **REQ-PAY-03:** Bank Transfer (offline) — donor views bank account details set by admin, uploads screenshot proof of payment
- **REQ-PAY-04:** GCash integration via Paymongo *(future — blocked on merchant account)*
- **REQ-PAY-05:** PayMaya integration via Paymongo *(future — blocked on merchant account)*
- **REQ-PAY-06:** Credit/debit card integration *(future — blocked on payment processor)*
- **REQ-PAY-07:** Donation record created in DB upon submission; status starts as `pending`
- **REQ-PAY-08:** Campaign total amount updated when donation is confirmed `completed`
- **REQ-PAY-09:** Donor sees confirmation screen with donation breakdown after submission
- **REQ-PAY-10:** Donation receipt sent to donor email *(future — blocked on SMTP config)*
- **REQ-PAY-11:** Admin can view proof screenshots, approve, or reject any bank transfer donation
- **REQ-PAY-12:** NGO can view proof screenshots and approve/reject donations to their own campaigns only (server-enforced ownership)

#### 3.4 NGO Dashboard

- **REQ-NGO-01:** NGOs create campaigns with title, description, category, target amount, dates, and image
- **REQ-NGO-02:** Campaigns start as `draft`; NGO submits for review (→ `pending`)
- **REQ-NGO-03:** NGO receives email notification when campaign is approved or rejected
- **REQ-NGO-04:** NGO can see rejection reason in their dashboard
- **REQ-NGO-05:** NGO has analytics: total raised, donor count, daily donations chart, campaign breakdown
- **REQ-NGO-06:** NGO can view and act on donations to their own campaigns — view proof, approve (→ `completed`), reject (→ `failed`)

#### 3.5 Admin Dashboard

- **REQ-ADM-01:** View and manage all pending campaign submissions
- **REQ-ADM-02:** Approve campaigns (→ `active`) or reject with reason (→ `rejected`)
- **REQ-ADM-03:** Full NGO management: create, verify, reject, edit, delete
- **REQ-ADM-04:** Full user management: create, change role, delete (superadmin only for role/delete)
- **REQ-ADM-05:** Activity logs for all admin actions, filterable by type, actor, and date
- **REQ-ADM-06:** Platform-wide settings: general config, security policy
- **REQ-ADM-07:** Payment gateway settings: enable/disable each method, configure bank details

#### 3.6 User Profile

- **REQ-PRO-01:** Donor can edit their name, avatar, and cover photo
- **REQ-PRO-02:** Avatar and cover photos stored as base64 (MEDIUMTEXT)
- **REQ-PRO-03:** Notification preferences stored as JSON and toggleable per-category
- **REQ-PRO-04:** Donation history shown on profile

#### 3.7 Infrastructure & Security

- **REQ-INF-01:** MySQL 8.0 with utf8mb4, parameterized queries on all endpoints
- **REQ-INF-02:** Helmet.js security headers
- **REQ-INF-03:** Global rate limiter (100 req/15 min), auth limiter (5/15 min), donation limiter (20/15 min)
- **REQ-INF-04:** RBAC middleware on all protected routes
- **REQ-INF-05:** First-run seeder: default admin, NGO, and 6 active campaigns
- **REQ-INF-06:** express.json body limit 10MB (to support base64 proof images)

---

## Product Completion Document (PCD)

> Status as of **2026-05-26** · Completion: **~97%**

### Summary

| Module | Completion | Status |
|---|---|---|
| Authentication | 85% | In Progress (OAuth blocked) |
| Campaigns — Donor View | 100% | Complete |
| Payment & Donations | 82% | In Progress (online gateways blocked) |
| NGO Dashboard | 100% | Complete |
| NGO Analytics | 100% | Complete |
| Admin Dashboard | 100% | Complete |
| Payment Gateway Settings | 100% | Complete |
| Landing Page | 100% | Complete |
| User Profile | 100% | Complete |
| Database & Infrastructure | 100% | Complete |

---

### Completed Features

#### Authentication

- [x] Donor signup form with Gmail validation
- [x] `POST /auth/signup` → hashes password, creates session
- [x] `POST /auth/signin` → validates credentials, role-based redirect
- [x] Separate donor portal (SignIn.html) and admin/NGO portal (AdminLogIn.html)
- [x] Cross-portal links with role enforcement on both pages
- [x] Forgot password token generation (1hr expiry)
- [x] `POST /auth/reset-password` validates token and updates hash
- [x] `POST /auth/logout` destroys session
- [x] `GET /auth/me` returns authenticated user profile
- [x] Auth-aware navigation (show/hide Sign In, Sign Up, Profile based on session)
- [x] Rate limiting on POST /auth/signin

#### Campaigns — Donor View

- [x] Campaign listing with search, category filter, NGO filter
- [x] Campaign detail page with NGO info, progress bar, raised/goal amounts
- [x] Real-time progress updates (30-second polling)
- [x] Like campaign — frontend + `POST /campaigns/:id/like`
- [x] Comment on campaign — frontend + `POST /campaigns/:id/comments`
- [x] Share campaign via Facebook, Twitter, Viber, copy link
- [x] Campaign report modal (frontend UI)
- [x] Auth-aware nav on Campaign.html

#### Payment & Donations

- [x] Donation modal with amount presets (₱500/₱1000/₱2000/₱5000) and custom input
- [x] Tip percentage options (None, 5%, 10%, 15%) with breakdown summary
- [x] Tax line item (1% BIR RA 8424 display)
- [x] Payment methods dynamically shown/hidden based on admin-enabled settings
- [x] Bank Transfer (offline): displays admin-configured bank details; donor uploads screenshot proof
- [x] Proof image preview before submission
- [x] Reference/notes field for bank transfer
- [x] `POST /donations` validates enabled method, stores proof image (base64) and notes
- [x] `GET /donations/my-donations` — donor history
- [x] `GET /donations/campaign/:id/stats` — campaign donation stats
- [x] Success confirmation screen with donation breakdown
- [x] Payment method enable/disable validated server-side (disabled method returns 400)
- [x] `GET /admin/donations` — all donations with donor name/email + campaign title via JOIN; filterable by status and method
- [x] `PUT /admin/donations/:id/status` — admin marks pending donation completed/failed; updates campaign total on approve; logs activity
- [x] `GET /ngos/my-donations` — NGO-scoped donations (own campaigns only); filterable by status and method
- [x] `PUT /ngos/donations/:id/status` — NGO approve/reject with server-enforced campaign ownership check
- [x] Donation Approvals tab in Admin Dashboard — table with donor, campaign, amount, method, date, status, actions
- [x] Donation Approvals tab in NGO Dashboard — same table scoped to NGO's own campaigns
- [x] Proof image modal — donor info, screenshot, reference notes, Approve/Reject buttons (both admin and NGO)
- [x] `AdminAPI.getDonations()` and `AdminAPI.updateDonationStatus()` added to api.js
- [x] `NGOAPI.getMyDonations()` and `NGOAPI.reviewDonation()` added to api.js
- [x] `donationModel.findByCampaignIds()` — parametrized IN clause JOIN with users + campaigns
- [x] `donationModel.findAllWithDetails()` — all donations JOIN with users + campaigns

#### Payment Gateway Settings (Admin)

- [x] `system_settings` table — key/value store with defaults seeded on startup
- [x] `GET /settings/payment` — public endpoint; returns enabled methods + bank details
- [x] `PUT /settings/payment` — admin/superadmin only; updates toggles and bank info
- [x] Admin Dashboard "Payment Gateway Settings" card (superadmin only)
- [x] Toggle switches for: Bank Transfer, GCash, PayMaya, Card
- [x] Bank details form: bank name, account number, account name, donor instructions
- [x] Save button wired to `SettingsAPI.updatePayment()`
- [x] Default state: Bank Transfer ON, all others OFF

#### NGO Dashboard

- [x] Campaign creation form (draft)
- [x] Submit campaign for review (draft → pending)
- [x] Admin notified of new submission via email (code-complete; requires SMTP)
- [x] NGO can view own campaigns filtered by ngoId
- [x] Rejection reason visible in dashboard modal
- [x] Campaign list with status badges

#### NGO Analytics

- [x] Total raised and donor count stats cards
- [x] Daily donations bar chart
- [x] Campaign breakdown pie chart
- [x] Monthly donor growth line chart
- [x] Recent activity feed
- [x] 10-second auto-refresh polling

#### Admin Dashboard

- [x] 10-tab dashboard: Dashboard, Campaigns, Analytics, NGO Management, User Management, Approvals, Moderation, Support, Notifications, Activity Logs, Settings
- [x] Campaign approval (pending → active) and rejection (pending → rejected + reason)
- [x] NGO Management: create, verify, reject, edit (name/phone/address/description), delete
- [x] User Management: create with role, change role (superadmin), delete (superadmin)
- [x] Activity logs: dynamic table, color-coded action badges, actor name/email via JOIN, filter by type/actor/date
- [x] Settings page: general config and security config rendered by role (NGO vs superadmin)
- [x] Payment Gateway Settings panel (superadmin only) — live, wired to API

#### Landing Page

- [x] Live campaign grid (fetches active campaigns from API)
- [x] Campaign cards with NGO name (LEFT JOIN ngo_profiles)
- [x] Stats strip (active campaigns, NGOs, donors)
- [x] Category navigation links
- [x] Auth-aware nav

#### User Profile

- [x] Edit first name, last name
- [x] Avatar upload (base64 stored in MEDIUMTEXT)
- [x] Cover photo upload (base64 stored in MEDIUMTEXT)
- [x] Notification preferences (JSON, per-category toggles)
- [x] Donation history table

#### Database & Infrastructure

- [x] 9 MySQL tables: users, ngo_profiles, campaigns, donations, campaign_likes, campaign_comments, password_reset_tokens, activity_logs, system_settings
- [x] `donations` table: proof_image (MEDIUMTEXT), proof_notes (TEXT) — ALTER TABLE migration runs on startup for existing DBs
- [x] Parameterized queries on all endpoints
- [x] Helmet.js, CORS, express-session, bcrypt, rate limiting
- [x] `express.json({ limit: '10mb' })` for base64 proof image uploads
- [x] First-run seeder (default admin, NGO, 6 campaigns)
- [x] Test-account seeder (`npm run seed:test`)
- [x] `SettingsAPI` added to api.js frontend client

---

### Not Yet Implemented

#### Payment Gateways (Blocked on Merchant Accounts)

- [ ] **pay-02** GCash via Paymongo API — *blocked: need merchant account*
- [ ] **pay-03** PayMaya via Paymongo API — *blocked: need merchant account*
- [ ] **pay-06** Credit/Debit Card processor — *blocked: need payment processor account*
- [ ] **pay-07** Payment webhook / callback handler for gateway confirmations
- [ ] **pay-08** Sandbox/test mode for payment methods

#### Authentication (Blocked on App Registration)

- [ ] **auth-08** Google OAuth 2.0 — *blocked: need Google Cloud OAuth app*
- [ ] **auth-09** Facebook OAuth — *blocked: need Meta Developer app*

#### Email Notifications (Blocked on SMTP Config)

- [ ] **email-01** Forgot password reset email — *code-complete; add SMTP creds to .env*
- [ ] **email-02** Donor confirmation / receipt email after donation
- [ ] **email-03** Campaign submission notification email — *code-complete; add SMTP creds*

#### Admin Features

- [ ] Admin view of bank transfer proof screenshots (table row expansion or modal)
- [ ] Admin approval workflow for bank transfer donations (mark as completed/failed)
- [ ] Campaign reporting/moderation panel (report modal UI exists; no backend yet)
- [ ] Support ticket system

---

## Open Issues

### Easy

| ID | Area | Issue | Status |
|---|---|---|---|
| ISS-01 | Landing Page | "Donate Now" button does not redirect to campaign listing | **Fixed** — wired to campaigns page |
| ISS-02 | Admin Dashboard | Settings page was non-functional | **Fixed** — general, security, and payment settings now live |
| ISS-03 | Campaign/Category Page | Approved campaigns not appearing in correct category page | **Fixed** — category filter uses `?category=` API param |
| ISS-04 | Campaign/Category Page | Selecting NGO did not show its campaigns | **Fixed** — ngoId filter param added to GET /campaigns |

### Medium

| ID | Area | Issue | Status |
|---|---|---|---|
| ISS-05 | Admin Dashboard | Admin could not create NGO accounts | **Fixed** — POST /admin/users + POST /admin/ngos |
| ISS-06 | Admin Dashboard | Admin could not delete user/NGO accounts | **Fixed** — AdminAPI.deleteUser, NGOAPI.delete (superadmin only) |
| ISS-07 | Payments | No way to control which payment methods are active | **Fixed** — Payment Gateway Settings admin panel added |
| ISS-08 | Payments | Bank transfer had no proof/verification mechanism | **Fixed** — screenshot upload (base64 stored as proof_image) |

### Hard / Remaining

| ID | Area | Issue | Status |
|---|---|---|---|
| ISS-09 | Auth | Forgot Password email not sent | **Pending** — code-complete; needs SMTP config in .env |
| ISS-10 | Payments | GCash/PayMaya not integrated | **Blocked** — pending merchant account registration |
| ISS-11 | Payments | Admin cannot review/approve bank transfer proof screenshots | **Fixed** — Donation Approvals tab with proof modal, approve/reject actions, and campaign total update |
| ISS-12 | Payments | No donor receipt email | **Pending** — needs SMTP config |
| ISS-13 | Auth | Google/Facebook OAuth not available | **Blocked** — pending OAuth app registration |
| ISS-14 | Admin | Campaign report moderation panel not functional | **Pending** — frontend modal exists; backend not yet built |

---

## Blockers

| ID | Description | Affects | Severity |
|---|---|---|---|
| BLK-01 | GCash/PayMaya merchant accounts not registered — required before Paymongo integration | Payments (GCash, PayMaya) | High |
| BLK-02 | Google OAuth app not registered in Google Cloud Console | Signup, Login | High |
| BLK-03 | Facebook OAuth app not registered in Meta Developer Portal | Signup, Login | High |
| BLK-04 | SMTP credentials not configured in `.env` — emailService.js is fully implemented and ready | Forgot Password email, Donor receipt email, Campaign submission email | Medium |

**To unblock BLK-04**, add to `BACKEND/server/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=support@kapitbisig.ph
ADMIN_EMAIL=admin@kapitbisig.ph
```

---

## Changelog

### 2026-05-25 — Payment Gateway Admin Controls + Offline Bank Transfer

- **NEW:** `system_settings` MySQL table with key/value store; seeded with defaults on startup
- **NEW:** `GET /settings/payment` public API — returns enabled methods + bank details
- **NEW:** `PUT /settings/payment` admin-only API — updates payment toggles and bank info
- **NEW:** Admin Dashboard "Payment Gateway Settings" card (superadmin only) with toggles for Bank Transfer, GCash, PayMaya, Card, plus bank details form
- **NEW:** `donations.proof_image` (MEDIUMTEXT) and `donations.proof_notes` (TEXT) columns — ALTER TABLE migration for existing DBs
- **NEW:** Bank transfer donation flow — donor sees admin-configured bank details, uploads screenshot proof (base64), adds optional reference note
- **NEW:** `SettingsAPI.getPayment()` and `SettingsAPI.updatePayment()` added to api.js
- **CHANGED:** Payment method buttons on Campaign.html now hidden by default; shown dynamically based on enabled settings fetched from API
- **CHANGED:** `express.json` body limit raised to 10MB to support base64 proof image payloads
- **CHANGED:** `processPayment()` validates proof image before submit for bank transfer; pay button disabled during request
- **CHANGED:** Pay button label changes to "Submit Donation" when bank transfer is selected; SSL badge hidden (offline method)
- **FIXED:** Server-side validation rejects disabled payment methods with 400 error

### 2026-05-22 — Admin Dashboard CRUD, Activity Logs, Email Notifications

- Fixed authorize.js `.flat()` bug causing 403 on all admin routes
- Admin Dashboard NGO/User Management tables fully dynamic (live API)
- NGO CRUD: create, edit, verify, reject, delete wired to API
- User CRUD: create, change role (superadmin), delete (superadmin) wired to API
- Activity logs enriched with actor name/email via LEFT JOIN users
- POST /admin/users and POST /admin/ngos added (no session conflicts)
- `sendNewSubmissionNotificationEmail` added to emailService; called non-blocking on campaign submit
- Fixed AdminLogIn.js role check bug (`res.user.role` vs `user.role`)

### 2026-05-20 — NGO Analytics, Campaign Submission Flow, Seeder

- NGO analytics backend: GET /ngos/:id/analytics (revenue, donors, charts)
- Frontend analytics: 3 Chart.js charts + stats cards + 10s polling
- First-run seeder: auto-creates admin, NGO, 6 active campaigns on empty DB
- Test-account seeder: `npm run seed:test`
- Campaign submission flow: draft → pending → approved/rejected with reason
- Campaign LEFT JOIN ngo_profiles for ngoName in all list/detail responses
- Forgot password token generation and reset endpoint
- Avatar/cover upload (base64 MEDIUMTEXT), notification prefs (JSON)