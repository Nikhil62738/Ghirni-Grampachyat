# Deployment Guide - Gram Panchayat Ghirni Tax System

This project has two parts:

- **Backend** (Node/Express API) -> deploy on **Render**
- **Frontend** (Vite + React) -> deploy on **Netlify**
- **Database** -> **MongoDB Atlas** (free tier)

Deploy in this order: Database -> Backend -> Frontend.

---

## 0. Push the code to GitHub

Netlify and Render both deploy from a Git repo.

```bash
cd gram-panchayat-tax-system
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/gram-panchayat-tax-system.git
git push -u origin main
```

> `node_modules`, `dist`, and `.env` are already excluded via `.gitignore`. Never commit real secrets.

---

## 1. MongoDB Atlas (database)

1. Create a free cluster at https://www.mongodb.com/atlas .
2. **Database Access** -> add a user + password.
3. **Network Access** -> Add IP `0.0.0.0/0` (allow from anywhere) so Render can connect.
4. **Connect** -> "Drivers" -> copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/gp_ghirni_tax?retryWrites=true&w=majority`
5. Keep this string for the `MONGODB_URI` variable below.

---

## 2. Backend on Render

There is a `render.yaml` Blueprint at the repo root. Two ways to deploy:

### Option A - Blueprint (recommended)

1. On Render click **New +** -> **Blueprint** and pick your GitHub repo.
2. Render reads `render.yaml` and creates the **gp-ghirni-tax-api** web service
   (root directory `backend`, build `npm install`, start `npm start`).
3. When prompted, fill in the secret env vars (those marked `sync: false`).

### Option B - Manual

1. **New +** -> **Web Service** -> select the repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add the environment variables below.

### Backend environment variables (Render -> Environment)

| Variable | Required | Value / Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `MONGODB_URI` | yes | Atlas connection string from step 1 |
| `CLIENT_URL` | yes | Your Netlify URL, e.g. `https://your-site.netlify.app` (no trailing slash). Add the temporary Netlify URL now; update after step 3. Comma-separate multiple origins. |
| `JWT_SECRET` | yes | Long random string (Blueprint auto-generates one) |
| `JWT_EXPIRES_IN` | no | `7d` |
| `GMAIL_EMAIL` | for email | The sending Gmail address |
| `GMAIL_APP_PASSWORD` | option A | 16-char Gmail App Password (simplest) |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | option B | Gmail OAuth2 trio (use if not using App Password) |
| `GMAIL_REDIRECT_URI` | option B | `https://developers.google.com/oauthplayground` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for payments | From the Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | From Cloudinary |
| `SEED_ADMIN_EMAIL` | no | Default `admin@ghirni.gov.in` |
| `SEED_ADMIN_PASSWORD` | no | Default `Admin@12345` - CHANGE THIS |

Notes:
- Do **not** set `PORT` - Render provides it and the app reads `process.env.PORT`.
- On first boot the app auto-seeds the super admin + settings (no manual `npm run seed` needed).
- After deploy, your API base is `https://<service-name>.onrender.com`. Test `https://<service-name>.onrender.com/api/health` -> should return `{"success":true,...}`.
- Free Render services sleep after inactivity; the first request after idle can take ~30-60s to wake.

---

## 3. Frontend on Netlify

There is a `frontend/netlify.toml` (build config + SPA redirect).

1. On Netlify click **Add new site** -> **Import an existing project** -> pick the repo.
2. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (relative to base; `netlify.toml` already sets this)
3. **Environment variables** -> add:
   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`
     (must include the trailing `/api`)
4. Deploy. Netlify gives you a URL like `https://your-site.netlify.app`.

> Vite env vars are baked in at **build time**. If you change `VITE_API_BASE_URL`, trigger a redeploy ("Clear cache and deploy site").

---

## 4. Connect the two (CORS)

1. Copy your final Netlify URL.
2. In Render, set `CLIENT_URL` to that exact URL (no trailing slash) and save.
   The service redeploys automatically.
3. (Optional custom domain) Add it in Netlify, then append it to `CLIENT_URL`
   as a comma-separated value.

---

## 5. Post-deploy checklist

- [ ] `https://<render>.onrender.com/api/health` returns success JSON.
- [ ] Netlify site loads; the login page appears.
- [ ] Admin login works at the Admin tab (use your seeded admin, then change the password).
- [ ] Creating a taxpayer / requesting an OTP sends an email (Gmail configured).
- [ ] A test Razorpay payment succeeds (use Razorpay test keys first).
- [ ] Change `SEED_ADMIN_PASSWORD` / rotate any secrets that were shared.

---

## Local development (reference)

```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

For local dev the frontend defaults to `/api`; set `VITE_API_BASE_URL=http://localhost:5000/api`
in a `frontend/.env` file (or use a Vite proxy) if you run them on different ports.
