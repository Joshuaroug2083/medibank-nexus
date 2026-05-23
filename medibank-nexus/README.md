# MediBank Nexus

**The Digital Backbone of Healthcare in Africa**

A secure, AI-powered hospital documentation system built for Nigerian clinics and hospitals — replacing paper records with intelligent, connected workflows.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite 5                 |
| Styling    | Pure CSS (no Tailwind, no styled) |
| Charts     | Recharts                          |
| AI         | Anthropic Claude API              |
| PWA        | vite-plugin-pwa + Workbox         |
| Fonts      | Plus Jakarta Sans + DM Mono       |
| Icons      | Inline Bootstrap SVGs             |

---

## Project Structure

```
medibank-nexus/
├── public/
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── assets/           # Static images, illustrations
│   ├── components/       # Shared UI components (Button, Modal, Toast…)
│   ├── context/          # React contexts (AuthContext, AppContext)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page-level components (Auth, Dashboard, Landing…)
│   ├── services/         # API calls, AI service
│   ├── utils/            # Helper functions, formatters
│   ├── App.jsx           # Root app + routing
│   ├── global.css        # Design system styles
│   └── main.jsx          # React entry point
├── .env.example          # Environment variable template
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Open .env and add your VITE_ANTHROPIC_API_KEY
```

### 3. Start the development server
```bash
npm run dev
# Opens at http://localhost:5173
```

### 4. Build for production
```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## Demo Credentials

| Role        | Email                    | Password    |
|-------------|--------------------------|-------------|
| Nurse       | nurse@medibank.ng        | nurse123    |
| Doctor      | doctor@medibank.ng       | doctor123   |
| Pharmacist  | pharma@medibank.ng       | pharma123   |
| Admin       | admin@medibank.ng        | admin123    |
| Patient     | patient@medibank.ng      | patient123  |

---

## PWA — Installing on Mobile

1. Open the app in Chrome on Android (or Safari on iOS)
2. Tap the browser menu → **"Add to Home Screen"**
3. The app installs and works offline for previously visited pages

---

## NDPR Compliance

All patient data is encrypted at rest (AES-256) and in transit (TLS 1.3).
Audit logs are immutable. Role-based access control enforced throughout.

---

Built by **Joshua Redeem Ohiani Bankole**
