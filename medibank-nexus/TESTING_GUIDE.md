# MediBank Nexus — Testing Guide

**Version:** 1.0.0 | **Built by:** Joshua Redeem Ohiani Bankole
**Stack:** React 18 · Vite 5 · Pure CSS · Recharts · Claude API (claude-sonnet-4-20250514)

---

## 1. Setup & Launch

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Chrome / Edge / Firefox (latest)
- Claude API Key from console.anthropic.com (for AI features only)

### Installation

```bash
# 1. Unzip and enter the project
unzip medibank-nexus-step15.zip
cd medibank-nexus

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set:  VITE_ANTHROPIC_API_KEY=sk-ant-...

# 4. Start the dev server
npm run dev
# Opens at http://localhost:5173
```

### .env Variables

```env
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here   # AI features
VITE_API_BASE_URL=http://localhost:3001         # Optional backend
VITE_APP_ENV=development
```

All data is mocked in-memory. Only the AI chat + AI Summary require a live API key.

---

## 2. Demo Credentials

| Role        | Email                   | Password  |
|-------------|-------------------------|-----------|
| Nurse       | nurse@medibank.ng       | nurse123  |
| Doctor      | doctor@medibank.ng      | doctor123 |
| Pharmacist  | pharma@medibank.ng      | pharma123 |
| Admin       | admin@medibank.ng       | admin123  |
| Patient     | patient@medibank.ng     | patient123|

Quick-login buttons on the auth screen sign you in as any role in one click.

---

## 3. Module Test Checklists

### 3.1  Landing Page

Route: `/`  (unauthenticated)

- [ ] Hero renders with floating mockup card, gradient headline, proof avatars
- [ ] Navbar is sticky with blur backdrop on scroll
- [ ] Stats strip renders in solid blue band
- [ ] Features grid: 9 cards, each lifts on hover
- [ ] Pricing: Professional plan scaled up with gradient + "Most Popular" badge
- [ ] Testimonials: 3 cards with amber star ratings
- [ ] Any "Get Started" button navigates to Auth page

---

### 3.2  Authentication

Route: `/auth`

- [ ] Two-column layout with animated role pills on the left
- [ ] Five quick-login buttons visible (one per role)
- [ ] Quick Login: Doctor → spinner → dashboard
- [ ] Wrong password → form shakes, error message shown
- [ ] Correct manual login (doctor@medibank.ng / doctor123) works
- [ ] Role badge in sidebar matches logged-in role
- [ ] Sign Out → returns to landing page

---

### 3.3  Dashboard

Route: `/dashboard`

- [ ] Welcome card with user name and role
- [ ] 4 role-specific KPI stat cards — accent bar animates on load
- [ ] Quick action buttons navigate to correct modules
- [ ] AI Chat panel present — type a question and receive a response
- [ ] Typing indicator (3 bouncing dots) while waiting for AI
- [ ] Notification bell shows unread dot
- [ ] Sidebar items are role-appropriate (nurse has no Analytics link)

---

### 3.4  Patient Registration

Navigate to: Register Patient  (Nurse or Admin)

**Step 1 — Personal:**
- [ ] Continue with blank First Name → validation error fires
- [ ] Phone under 10 digits → error fires
- [ ] Non-numeric phone input is stripped automatically
- [ ] State dropdown shows all 37 states + FCT Abuja
- [ ] All required fields filled → advances to Step 2

**Step 2 — Medical:**
- [ ] Blood Group and Genotype required
- [ ] Check 2 allergy boxes → amber conflict banner fires instantly
- [ ] Check "None known" → banner disappears

**Step 3 — Emergency Contact:**
- [ ] All three required fields validated on Continue

**Step 4 — Insurance:**
- [ ] "No Insurance" → amber out-of-pocket warning
- [ ] Real provider → policy + plan fields appear

**Step 5 — Review:**
- [ ] All data visible, allergies render in red
- [ ] Patient ID in blue gradient banner
- [ ] "Register Patient" → 900ms spinner → success screen
- [ ] "Register Another" resets form with new Patient ID

---

### 3.5  Doctor Consultation

Navigate to: Consultation  (Doctor)

- [ ] Switching patient updates sidebar (name, blood group, allergies, history)
- [ ] Vitals — enter 165 for Systolic BP → "HIGH" flag in red
- [ ] Vitals — enter 40 for Pulse → "LOW" flag in blue
- [ ] Prescriptions tab → Add Drug → select Amoxicillin for Penicillin-allergic patient → red allergy conflict alert
- [ ] Trash icon removes a drug row
- [ ] AI Summary tab → fill vitals + chief + diagnosis → click "AI Summary" → typing dots → SOAP note generated
- [ ] Sign & Submit without chief complaint → warning, redirected to Notes tab
- [ ] Complete fields → Sign & Submit → 900ms → success screen

---

### 3.6  Pharmacy Rx Queue

Navigate to: Pharmacy  (Pharmacist or Admin)

- [ ] 5 Rx cards; 2 URGENT (red left border); 1 already Dispensed (green)
- [ ] Pulsing amber dot on pending cards
- [ ] Expand a card → drug rows show stock progress bars with colour coding
- [ ] RX-2026-0045 Ciprofloxacin → insufficient stock warning fires
- [ ] "Confirm & Dispense" → spinner → card turns green + toast
- [ ] Filter chips update live counts as you dispense
- [ ] Inventory view → 12 drug cards; Metronidazole 400mg shows "Critical" in red

---

### 3.7  Appointment Booking

Navigate to: Appointments  (any role)

- [ ] APT-YYYY-XXXX ID shown in badge throughout
- [ ] Step 1: patient and appointment type both required
- [ ] Step 2: doctor required; availability badge colour (green/amber/red)
- [ ] Step 3: past dates disabled; taken slots show strikethrough + "Taken"
- [ ] Selecting date then time → slot turns blue
- [ ] Step 4: summary table + reminder channel selector
- [ ] Confirm Booking → 850ms → success screen with APT ID + toast
- [ ] Back button works at every step

---

### 3.8  Admin Analytics

Navigate to: Analytics  (Admin)

**Overview:**
- [ ] 6 KPI cards count up from 0 on load
- [ ] Area chart renders two coloured series; hover shows custom tooltip
- [ ] Bar chart shows revenue with M/K formatted Y-axis
- [ ] Top Diagnoses bars animate; Malaria highest at 78%
- [ ] Department Breakdown shows 7 distinct-colour bars

**Staff Performance:**
- [ ] Table with avatar initials, role badges, star ratings, status badges
- [ ] Dr. Segun Adeleke shows "On Leave"

**Audit Log:**
- [ ] Failed login entry renders with red dot
- [ ] Filter "danger" → shows only that entry
- [ ] Other filters (info / success / warning) work correctly

---

### 3.9  Patient Portal

Navigate to: Patient Portal  (Patient or Doctor)

- [ ] Gradient hero card: avatar initials, blood group, genotype, insurance chips
- [ ] Allergy tags (red) and Condition tag (amber) always visible
- [ ] Overview: active condition, medications, personal details grid
- [ ] Visits: 4 entries in timeline; click to expand/collapse
- [ ] Expanded malaria visit: Temp 38.9°C renders in red
- [ ] Multiple visits can be open simultaneously
- [ ] Prescriptions: 3 Rx cards; RX-2026-0041 shows "2 refills" badge
- [ ] Appointments: upcoming APT shows blue date badge + Confirm button

---

### 3.10  Notification Centre

Navigate to: Notifications  (any role)

- [ ] 4 stat cards animate on load (Unread: 4, High Priority: 2, Total: 10)
- [ ] Unread dot (pulsing blue) visible on 4 items
- [ ] Left border colour encodes priority (red/amber/grey)
- [ ] Search "allergy" → only Allergy Conflict item shown
- [ ] Filter "Alerts" → 2 items; filter "Unread" → 4 items
- [ ] Mark one item read → dot disappears, unread count decrements
- [ ] Delete an item → slides out, toast fires, list shrinks
- [ ] "Mark all read" → all dots gone, badge disappears, toast fires
- [ ] Preferences tab: toggles animate; Save fires success toast; Reset restores defaults

---

## 4. Role Access Matrix

| Module              | Nurse | Doctor | Pharmacist | Admin | Patient |
|---------------------|:-----:|:------:|:----------:|:-----:|:-------:|
| Dashboard           |  ✓    |  ✓     |     ✓      |   ✓   |    ✓    |
| Register Patient    |  ✓    |        |            |   ✓   |         |
| Consultation        |       |  ✓     |            |   ✓   |         |
| Pharmacy            |       |        |     ✓      |   ✓   |         |
| Appointments        |  ✓    |  ✓     |            |   ✓   |    ✓    |
| Analytics           |       |        |            |   ✓   |         |
| Patient Portal      |       |  ✓     |            |   ✓   |    ✓    |
| Notifications       |  ✓    |  ✓     |     ✓      |   ✓   |    ✓    |

---

## 5. Production Build

```bash
npm run build     # Outputs to dist/
npm run preview   # Preview locally at http://localhost:4173
```

Deploy `dist/` to Vercel, Netlify, or any static host.
Set `VITE_ANTHROPIC_API_KEY` as a server-side environment variable — never commit the real key.

> Security: In production, proxy Anthropic API calls through your own backend so the key is never exposed in the browser bundle.

---

## 6. PWA Installation

1. Open in Chrome → install icon in address bar → "Install MediBank Nexus"
2. App installs to desktop/home screen
3. Offline: service worker caches critical pages for VSAT/poor network conditions
4. Enable push notifications from Notifications → Preferences

---

## 7. Project File Map

```
medibank-nexus/
├── index.html                    # PWA entry, meta tags, font preconnect
├── vite.config.js                # Vite + PWA plugin + Workbox config
├── package.json
├── .env.example
├── TESTING_GUIDE.md              # This file
└── src/
    ├── App.jsx                   # Landing → Auth → AppShell routing
    ├── main.jsx                  # ReactDOM.createRoot
    ├── global.css                # 3,700+ line design system (25+ sections)
    ├── components/
    │   ├── Alert.jsx             # 4 type alert banners
    │   ├── Avatar.jsx            # Initials avatar
    │   ├── Badge.jsx             # Colour-coded status labels
    │   ├── Button.jsx            # All variants + sizes
    │   ├── Card.jsx              # Content card
    │   ├── EmptyState.jsx        # Zero-state placeholder
    │   ├── Icons.jsx             # 72 Bootstrap SVG icons
    │   ├── Modal.jsx             # Accessible modal
    │   ├── ProgressBar.jsx       # Animated progress bar
    │   ├── Spinner.jsx           # Loading spinner
    │   ├── StatCard.jsx          # KPI card with accent animation
    │   ├── StepsBar.jsx          # Multi-step wizard indicator
    │   ├── Toast.jsx             # Context toast system
    │   ├── Toggle.jsx            # Accessible toggle switch
    │   └── index.js              # Barrel export
    ├── context/
    │   ├── AuthContext.jsx       # Login/logout/session
    │   └── AppContext.jsx        # Page navigation/sidebar
    ├── data/
    │   ├── mockUsers.js          # 5 demo users + role config
    │   └── navConfig.js          # Role-based sidebar nav
    └── pages/
        ├── LandingPage.jsx       # 9-section marketing page
        ├── AuthPage.jsx          # Login with quick-login
        ├── AppShell.jsx          # Topbar + sidebar + router
        ├── RegisterPage.jsx      # 5-step patient registration
        ├── ConsultationPage.jsx  # Vitals + notes + Rx + AI
        ├── PharmacyPage.jsx      # Rx queue + inventory
        ├── AppointmentsPage.jsx  # 4-step booking + calendar
        ├── AnalyticsPage.jsx     # KPIs + charts + audit log
        ├── PatientPortalPage.jsx # Visit history + Rx + appointments
        └── NotificationsPage.jsx # Inbox + filters + preferences
```

---

## 8. Known Limitations (Demo Build)

| Limitation | Notes |
|---|---|
| No real backend | All data is in-memory; refresh resets state |
| API key in browser | Demo only — proxy through backend in production |
| sessionStorage session | Cleared when tab closes |
| Mock data only | Registered patients don't persist after refresh |
| No real SMS/WhatsApp | Reminder preferences are UI-only |

---

## 9. Quick Smoke Test (5 minutes)

```
1. http://localhost:5173 → landing page loads ✓
2. Get Started → Auth → Quick Login: Admin ✓
3. Dashboard → KPI cards animate, AI chat visible ✓
4. Register Patient → complete 5 steps → success ✓
5. Consultation → Chidi Obi → BP 160/95 → HIGH fires →
   add Amoxicillin (Penicillin allergy) → conflict fires →
   Sign & Submit ✓
6. Pharmacy → expand RX-2026-0041 → Dispense → green ✓
7. Appointments → book 4-step follow-up ✓
8. Analytics → charts render → Staff → Audit Log ✓
9. Notifications → delete 2 → filter Alerts → Preferences toggle ✓
10. Sign Out → back to landing page ✓
```

---

*MediBank Nexus · "The Digital Backbone of Healthcare in Africa"*
*Built with React 18, Vite 5, Recharts, and Claude AI*
*© 2026 Joshua Redeem Ohiani Bankole*
