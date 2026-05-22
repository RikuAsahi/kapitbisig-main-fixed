# KapitBisig — Product Requirements Document (PRD)

**Project:** KapitBisig NGO Crowdfunding Platform
**Repository:** https://github.com/RikuAsahi/KB-CLEAN-VER
**Version:** 1.0
**Last Updated:** May 16, 2026
**Status:** In Active Development

---

## 1. Product Overview

KapitBisig is a web-based crowdfunding platform built to empower NGOs in Barangay 105, Tondo, Manila to create and manage fundraising campaigns. Donors can discover causes, make secure contributions, and track campaign progress in real time. The platform prioritizes transparency, security, and community trust.

**Tech Stack**

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express.js
- Database: MySQL
- Security: Helmet.js, bcryptjs, express-rate-limit

---

## 2. Problem Statement

The frontend pages for the platform have been built and are largely complete. The core outstanding challenge is connecting these pages to a functioning backend: storing and retrieving real data, enabling real-time updates, integrating third-party authentication providers, and wiring up Philippine payment gateways (GCash, PayMaya, bank transfers).

---

## 3. Goals

- Complete backend integration for all frontend pages
- Implement OAuth-based authentication (Google, Facebook) with Gmail requirement on sign-up
- Store all user and campaign data persistently in MySQL
- Enable real-time campaign updates via WebSockets or polling
- Integrate GCash, PayMaya, and bank payment APIs
- Implement an Admin approval workflow for NGO campaigns
- Deliver live analytics to the NGO Dashboard

---

## 4. User Roles

| Role | Description |
|------|-------------|
| Donor | Registered user who browses and donates to campaigns |
| NGO | Organization that creates and manages fundraising campaigns |
| Admin | Platform administrator who approves campaigns and oversees activity |
| Guest | Unauthenticated visitor with read-only access to public campaigns |

---

## 5. Feature Requirements

### 5.1 Authentication — Sign Up

**Priority:** P0 (Blocker)

- Users must register with a Gmail address (email domain enforced: `@gmail.com`)
- Supported sign-up methods:
  - Google OAuth 2.0 (auto-satisfies Gmail requirement)
  - Facebook OAuth (must validate that the connected email is a Gmail address)
  - Email/password form (Gmail enforcement on input)
- On successful sign-up:
  - User account is created and stored in the database (`users` table)
  - User is automatically redirected to their Profile page
- Landing page must hide Sign In / Sign Up buttons and display the user's Profile icon or section after login

**Acceptance Criteria**
- Non-Gmail addresses are rejected with a clear error message
- Social auth tokens are validated server-side
- Session/cookie is set with `httpOnly` and `sameSite` flags
- New user record appears in the database immediately after registration

---

### 5.2 Authentication — Log In

**Priority:** P0 (Blocker)

- Supported login methods:
  - Email/password (credentials validated against the database)
  - Google OAuth
  - Facebook OAuth
- Forgot Password flow:
  - User enters their email
  - System sends a password reset link to that address
  - Link is time-limited (expires in 1 hour)
- On successful login:
  - User is redirected to the Landing Page
  - Sign In / Sign Up buttons are hidden
  - Profile section or icon is displayed

**Acceptance Criteria**
- Invalid credentials return a generic error (no email enumeration)
- Rate limiting applied to login endpoint
- Password reset emails are sent within 30 seconds
- Expired or already-used reset links return an appropriate error

---

### 5.3 Campaigns — Donor View

**Priority:** P0 (Blocker for core functionality)

Donors must be able to:

- **View** campaign details including title, description, goal amount, amount raised, and NGO information (transparency details)
- **See real-time updates** — the campaign page refreshes donation totals and fund progress when new donations arrive
- **Like** campaigns (requires login; like count displayed publicly)
- **Comment** on campaigns (requires login; comments displayed with timestamp and username)
- **Share** campaigns via a shareable link or social share buttons

Campaign pages must automatically reflect:
- New donations (updated progress bar and total)
- New incoming funds

**Acceptance Criteria**
- Real-time updates visible within 5 seconds of a donation being made
- Likes and comments persist in the database
- Share links are functional and resolve to the correct campaign

---

### 5.4 Campaigns — Payment Integration

**Priority:** P0 (Blocker)

Supported payment methods:
- **GCash** — via Paymongo or GCash API
- **PayMaya** — via PayMaya API
- **Bank Transfer** — via bank payment gateway or manual confirmation flow

Requirements:
- Payment flow is initiated from the campaign donation form
- Successful payment triggers a donation record in the database
- Campaign totals update immediately after payment confirmation
- Donors receive a confirmation (on-screen and/or email)
- Failed payments return a clear error and do not create donation records

**Acceptance Criteria**
- All three payment methods complete end-to-end in staging
- Webhook or callback from payment provider updates the database
- No double-charging on retry

---

### 5.5 NGO Dashboard — Campaign Application

**Priority:** P1**

NGOs can submit new campaigns via a form including:
- Campaign title
- Bank account details (for fund disbursement)
- Campaign description and purpose
- Supporting documents (optional upload)

Submitted campaigns go to **Admin Review** — they are not publicly visible until approved.

**Acceptance Criteria**
- Submitted campaign is stored in the database with status `pending`
- Admin receives a notification of the new submission
- NGO can see the status of their submission (pending / approved / rejected) in the dashboard

---

### 5.6 NGO Dashboard — Analytics

**Priority:** P1**

The NGO dashboard should display live data for:
- Total donations received
- Number of donors
- Campaign progress toward goal (% funded)
- Recent donation activity feed
- Campaign performance over time (chart/graph)

Note: Frontend HTML placeholders already exist. This feature requires backend API endpoints and live data wiring.

**Acceptance Criteria**
- Data on the dashboard reflects the current database state
- Updates appear within 10 seconds of a new donation
- Charts render correctly with real data

---

### 5.7 Admin Dashboard

**Priority:** P1**

- Admin can view all pending campaign applications
- Admin can approve or reject campaigns (with optional rejection reason)
- Admin can view a platform-wide activity log
- Role-Based Access Control (RBAC) prevents non-admins from accessing admin routes

**Acceptance Criteria**
- Approved campaigns become publicly visible immediately
- Rejected campaigns notify the NGO with the reason
- Admin actions are logged

---

### 5.8 Landing Page

**Priority:** P0**

- Public campaigns are listed and browsable without login
- Sign In / Sign Up buttons visible only to unauthenticated users
- Authenticated users see their Profile icon / section in the nav

---

## 6. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Authentication security | Sessions use httpOnly + sameSite cookies; passwords hashed with bcrypt |
| SQL injection prevention | All queries parameterized |
| Rate limiting | Login: max 10 attempts/15 min; Donations: max 5/min; Global: configured |
| Uptime | 99% during active campaign periods |
| Real-time latency | Campaign updates visible within 5–10 seconds |
| Payment security | PCI-compliant gateway handling; no raw card data stored |

---

## 7. Out of Scope (v1.0)

- Mobile app (iOS / Android)
- Multi-language support
- Recurring donations / subscriptions
- International payment methods (Stripe, PayPal)
- SMS notifications

---

## 8. Dependencies & Risks

| Item | Risk | Mitigation |
|------|------|------------|
| GCash / PayMaya API access | Requires merchant account approval | Apply early; build with mock/sandbox first |
| Google & Facebook OAuth | Requires app registration and review | Register OAuth apps immediately |
| Real-time updates | WebSocket infrastructure complexity | Start with polling fallback, upgrade to WebSockets |
| MySQL schema changes | Breaking existing frontend assumptions | Version the schema; use migrations |

---

## 9. Success Metrics

- Users can register, log in, and view their profile end-to-end
- At least one payment method processes a live donation successfully
- Campaign pages update in real time after a donation
- NGOs can submit campaigns and see Admin approval status
- Zero unauthenticated access to protected routes in security audit

---

*Document maintained by the KapitBisig development team.*
