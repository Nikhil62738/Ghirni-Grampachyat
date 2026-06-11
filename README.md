# Smart Gram Panchayat Online Tax Management System

**Gram Panchayat Ghirni, Tq. Malkapur, Dist. Buldhana - 443102 (Maharashtra)**

A complete government-style MERN application to digitize property-tax collection,
taxpayer management, receipt generation, reminders, reporting, and analytics.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express.js, MongoDB Atlas, Mongoose |
| Auth | JWT + role-based permissions, bcryptjs |
| Payments | Razorpay |
| Email | Gmail API (Google OAuth2) via Nodemailer |
| File storage | Cloudinary |
| PDF | PDFKit + QR code |
| Excel | XLSX |
| Scheduling | Node Cron |
| Security | Helmet, express-rate-limit, MongoDB validation |

---

## Project structure

```
gram-panchayat-tax-system/
├── backend/
│   ├── server.js                 # entry point
│   ├── .env.example
│   └── src/
│       ├── app.js                # express app (helmet, cors, routes, errors)
│       ├── config/               # db.js, constants.js
│       ├── models/               # Mongoose schemas (Admin, Taxpayer, Payment, ...)
│       ├── middleware/           # auth, permissions, upload, errorHandler
│       ├── controllers/          # request handlers
│       ├── routes/               # REST routes mounted under /api
│       ├── services/             # email, razorpay, pdf, excel, tax, qr, ...
│       ├── jobs/                 # cronJobs.js (yearly tax generation)
│       └── utils/                # apiResponse, token, ids, seedAdmin
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── api/                  # axios client
│       ├── context/              # Auth, Theme (dark mode), I18n (EN/MR)
│       ├── components/           # AdminLayout, GovHeader, shared UI
│       ├── i18n/                 # English + Marathi dictionary
│       └── pages/                # login, activate, verify, taxpayer + admin pages
└── sample-data/
    └── taxpayers-template.csv    # bulk import template
```

---

## Quick start (local development)

### 1. Backend

```bash
cd backend
cp .env.example .env      # then fill in your credentials
npm install
npm run seed              # creates the super admin + default settings
npm run dev               # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # starts on http://localhost:5173 (proxies /api -> :5000)
```

Default super-admin credentials (change them after first login, configurable via
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):

```
email:    admin@ghirni.gov.in
password: Admin@12345
```

---

## Environment variables (backend/.env)

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Gmail API (Google OAuth2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_EMAIL=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Seed admin (optional)
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@ghirni.gov.in
SEED_ADMIN_PASSWORD=Admin@12345
```

> The app boots and runs even if the optional integrations (Gmail, Razorpay,
> Cloudinary) are not configured: emails are logged to the console in dev, and
> online payments return a clear "not configured" message until keys are added.

---

## Key REST endpoints (mounted under `/api`)

| Area | Endpoint |
| --- | --- |
| Auth | `POST /auth/admin/login`, `POST /auth/taxpayer/lookup`, `POST /auth/taxpayer/request-otp`, `POST /auth/taxpayer/activate`, `POST /auth/taxpayer/login`, `GET /auth/me` |
| Taxpayers | `GET/POST /taxpayers`, `GET/PATCH/DELETE /taxpayers/:id`, `POST /taxpayers/import`, `GET /taxpayers/me/dashboard` |
| Payments | `POST /payments/offline`, `POST /payments/online/order`, `POST /payments/online/verify`, `GET /payments` |
| Receipts | `GET /receipts`, `GET /receipts/:id/download`, `GET /receipts/verify/:token` |
| Reports | `GET /reports?type=&period=&format=json|csv|excel|pdf` |
| Analytics | `GET /analytics/overview`, `GET /analytics/charts` |
| Notifications | `GET /notifications`, `POST /notifications/remind-defaulters` |
| Admins | `GET/POST /admins`, `PATCH/DELETE /admins/:id` |
| Audit | `GET /audit-logs` |
| Settings | `GET/PATCH /settings`, `GET /settings/backup` |

---

## Features delivered

- Role-based admin + taxpayer authentication (JWT)
- Taxpayer activation flow (lookup -> OTP email -> create password -> login)
- Granular admin permission system
- Taxpayer CRUD + bulk Excel/CSV import with validation, duplicate detection, error report
- Offline payment collection (cash/UPI/cheque/bank transfer) with auto balance update
- Razorpay online payments with signature verification
- Government-style PDF receipts with QR verification + public verify page
- Yearly tax auto-generation cron (carry-forward + penalty)
- Email reminders to defaulters + notification history
- Reports (collection/pending/defaulter/ward/taxpayer) exportable as PDF/Excel/CSV
- Analytics dashboard with charts (monthly, ward-wise, category, payment mode)
- Audit logging (user, action, timestamp, IP)
- Marathi + English UI, dark mode, mobile responsive, government theme
- Backup export

See `DEPLOYMENT.md` for production deployment on a VPS / cloud server.
"# Ghirni-Grampachyat" 
