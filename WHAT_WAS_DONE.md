# MediBank Nexus — Implementation Changelog

## Critical ✅

### 1. JWT Auth wired to frontend
- `src/context/AuthContext.jsx` rewritten
- `login()` now calls real `POST /api/v1/auth/login`
- On success: stores `nexus_token` + `nexus_refresh` in `localStorage`
- Auto-refresh on 401 via `apiFetch()` helper (exported for all API calls)
- Falls back to mock login if API is unreachable (dev convenience)
- `logout()` calls `POST /api/v1/auth/logout` to blacklist the token server-side
- 2FA challenge flow: 206 response → `verify2FA()` → full token

### 2. Paystack Webhook Handler
- `POST /api/v1/billing/paystack-webhook` added to `billing.js`
- Raw body parsing via `express.raw()` in `index.js` (before JSON middleware)
- HMAC-SHA512 verification using `PAYSTACK_SECRET_KEY`
- On `charge.success`: activates hospital to Pro tier in DB
- On `subscription.disable`: marks hospital as `past_due`
- Inserts record into new `subscription_payments` table

### 3. DB Migrations
- `008_subscription_totp_invites.sql` — subscription_payments, TOTP secrets, staff invitations
- `009_inpatient_referrals.sql` — wards, beds, admissions, nursing_notes, mar_records, referrals, data_subject_requests
- Run: `npm run db:migrate` from medibank-nexus-api/

### 4. Two-Factor Authentication (TOTP)
- Backend: `POST /api/v1/auth/2fa/enroll` → generate secret + QR URI
- Backend: `POST /api/v1/auth/2fa/confirm` → verify first code, generate 8 backup codes
- Backend: `POST /api/v1/auth/2fa/disable` → requires password
- Backend: `POST /api/v1/auth/verify-2fa` → login challenge verification (backup codes supported)
- Login flow: 2FA users get 206 + tempToken, must call verify-2fa before full JWT issued
- Frontend: `TabSecurity2FA.jsx` embedded in Settings > Security
- Install: `npm install otplib` in API (graceful degradation if missing)

---

## High Priority ✅

### 5. Email Delivery
- `src/services/email.js` created — nodemailer wrapper
- Supports Gmail, SendGrid, Mailgun via SMTP config
- `sendSMS()` via Termii API
- Password reset email now sent via `sendEmail()` in auth.js
- Staff invitation email sent on invite creation
- Config: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` in .env
- Install: `npm install nodemailer` in API

### 6. Staff Invitation System
- `POST /api/v1/staff/invite` — admin sends email invite with 7-day token
- `POST /api/v1/staff/accept-invite` — public endpoint to create account from invite
- `GET /api/v1/staff/invitations` — admin view of all sent invitations
- Invitation email includes accept link with token
- Dev mode returns `devToken` + `inviteUrl` in response for testing

### 7. Inpatient Ward & Bed Management
- Backend: full CRUD for wards, beds, admissions, nursing notes, MAR
- `GET/POST /api/v1/inpatient/wards` — list/create wards
- `GET/POST /api/v1/inpatient/wards/:id/beds` — list/add beds
- `GET/POST /api/v1/inpatient/admissions` — active admissions with filters
- `POST /api/v1/inpatient/admissions/:id/discharge` — discharge + free bed
- `GET/POST /api/v1/inpatient/nursing-notes` — nursing notes + vitals
- `GET/POST /api/v1/inpatient/mar` + `PUT /api/v1/inpatient/mar/:id/administer` — MAR
- Frontend: `InpatientPage.jsx` — ward cards with occupancy bars, admissions table
- Added to nav: nurse, doctor, admin

### 8. Referral System
- Backend: `GET/POST /api/v1/referrals`, `GET/PUT /api/v1/referrals/:id`
- Supports internal (dept-to-dept) and external (other hospital) referrals
- Urgency: routine / urgent / emergency
- Status workflow: pending → accepted → completed / cancelled
- Frontend: `ReferralsPage.jsx` — create form + filterable list
- Added to nav: doctor, admin

### 9. Staff Limit Enforcement
- Updated in `staff.js`: `free_trial: 5, pro: 30, custom: null`
- Returns 403 with descriptive message when limit reached

---

## Compliance ✅

### 10. Trial-to-Pro Upgrade (in-app)
- Settings > Subscription tab (`TabSubscription.jsx`)
- Shows current plan, trial countdown, staff usage bar
- "Pay ₦80,000" button opens Paystack inline popup
- Calls `POST /api/v1/billing/subscription/upgrade` to get reference
- On payment success: webhook activates account; UI polls for confirmation
- `GET /api/v1/billing/subscription` — plan info endpoint

### 11. Audit Log Viewer (in-app)
- Settings > Audit Log tab (`TabAuditLog.jsx`) — admin only
- Calls `GET /api/v1/compliance/audit-log` with filters
- Filter by action, entity, date range
- Color-coded action labels
- Paginated (50 per page)

### 12. NDPR Data Subject Requests
- Backend: `POST /api/v1/compliance/dsr` (public — no auth)
- Backend: `GET/PUT /api/v1/compliance/dsr` (admin)
- Types: access, erasure, portability, rectification, objection
- 30-day due date auto-set (NDPR requirement)
- `compliance.js` route registered in `index.js`

### 13. Password Reset Email
- Already configured ��� now actually sends via nodemailer
- Link format: `CLIENT_ORIGIN/reset-password?token=xxx&email=yyy`
- Dev mode still returns token in API response

---

## Setup Commands

```bash
# Backend
cd medibank-nexus-api
npm install otplib nodemailer   # optional but recommended
npm run db:migrate              # runs all 9 migrations
npm run db:seed                 # seed test data
npm run dev                     # start API on :3001

# Frontend
cd medibank-nexus
npm run dev                     # start on :5173
```

## Environment Variables to Set

### medibank-nexus-api/.env
```
PAYSTACK_SECRET_KEY=sk_live_xxx    # from Paystack dashboard
PAYSTACK_PUBLIC_KEY=pk_live_xxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@medibanknexus.com
EMAIL_PASS=your_app_password

TERMII_API_KEY=xxx
TERMII_SENDER_ID=MediNexus
```

### medibank-nexus/.env
```
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx   # must match above
```
