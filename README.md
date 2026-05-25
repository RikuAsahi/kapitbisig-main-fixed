# KapitBisig — NGO Crowdfunding Platform

A full-stack crowdfunding platform for NGOs in Barangay 105, Tondo, Manila. Donors can discover campaigns, give securely, and track impact. NGOs manage campaigns and view analytics. Admins approve, reject, and monitor platform activity.

---

## Requirements

| Requirement | Minimum | Developed On |
|-------------|---------|--------------|
| Node.js     | v18.x   | v24.15.0     |
| MySQL       | 8.0     | 8.0          |
| npm         | 9.x     | bundled with Node |

> **MySQL port:** the default `.env` uses port `3306`. If your MySQL runs on the standard port, change `DB_PORT=3306` to `DB_PORT=3306`.

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (served via Node static server)
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8 via `mysql2`
- **Security:** Helmet.js, bcryptjs, express-rate-limit, express-session
- **Email:** Nodemailer (optional — used for campaign rejection notifications)
- **Testing:** Jest + Supertest

---

## How to Run

### 1. Clone the repo

```bash
git clone https://github.com/RikuAsahi/KB-CLEAN-VER.git
cd KB-CLEAN-VER
```

### 2. Set up the database

Make sure MySQL is running, then create the database and schema:

```bash
mysql -u root -p < BACKEND/server/database/000_create_database.sql
mysql -u root -p < BACKEND/server/database/001_init_schema.sql
```

> Tables are also auto-created on first server start if they don't exist — the SQL files are only needed for a clean initial setup.

### 3. Configure environment variables

Open `BACKEND/server/.env` and update the values to match your local setup:

```env
PORT=5001
SESSION_SECRET=change_this_to_a_long_random_secret

FRONTEND_ORIGINS=http://127.0.0.1:4012,http://localhost:4012

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kapitbisig_db

# Optional — leave blank to disable rejection emails
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@kapitbisig.ph
```

### 4. Install backend dependencies

```bash
cd BACKEND/server
npm install
```

### 5. Start the backend

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Backend runs on **http://localhost:5001**

### 6. Start the frontend

Open a second terminal from the project root:

```bash
node FRONTEND/server.js
```

Frontend runs on **http://localhost:4012**

> To use a different port: `FRONTEND_PORT=3000 node FRONTEND/server.js`

### Running both at once

```bash
# Terminal 1 — Backend
cd BACKEND/server && npm run dev

# Terminal 2 — Frontend (from project root)
node FRONTEND/server.js
```

Then open **http://localhost:4012** in your browser.

---

## Default Seed Accounts

On first run, the server automatically creates these accounts if the database is empty:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@kapitbisig.ph` | `Admin@KB2025!` |
| NGO (Organization) | `demo@kapitbisig.ph` | `kapitbisig2025!` |

The NGO account comes with a verified NGO profile ("KapitBisig Foundation") and 6 active campaigns seeded across all categories.

> These credentials are for local development only. Change them before deploying to production.

### Test Accounts

Run once to create dedicated test accounts (safe to re-run — skips if already exists):

```bash
cd BACKEND/server
npm run seed:test
```

| Role | Email | Password |
|------|-------|----------|
| Admin | `testadmin@kapitbisig.ph` | `TestAdmin123!` |
| NGO (Organization) | `testngo@kapitbisig.ph` | `TestNGO123!` |

---

## Features

- User authentication — sign up, sign in, sign out, forgot password
- Role-based access control — donor, NGO, admin, superadmin
- Campaign management — create, submit for approval, approve/reject
- Donation system — records donations and updates campaign totals
- NGO dashboard — campaign applications, live analytics with 10s refresh
- Admin dashboard — pending approvals, rejection with email notification, activity logs
- Engagement — likes and comments on campaigns
- Security — parameterized queries, rate limiting, httpOnly session cookies, Helmet.js headers

---

## Running Tests

```bash
cd BACKEND/server
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
```

---

## Project Status

**Overall completion: 83%**

| Module | Status |
|--------|--------|
| Sign Up / Registration | In progress (OAuth pending) |
| Log In | In progress (OAuth + forgot-password email pending) |
| Campaigns — Donor View | Complete |
| Payment Integration | In progress (blocked on merchant accounts) |
| NGO Dashboard — Campaign Application | In progress |
| NGO Dashboard — Analytics | Complete |
| Admin Dashboard | Complete |
| Landing Page | Complete |
| User Profile Page | Complete |
| Database & Infrastructure | In progress |

**Blockers:** GCash/PayMaya merchant accounts, Google/Facebook OAuth app registration, SMTP credentials for email features.

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-19
