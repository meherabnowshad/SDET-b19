# BlogSpace — Go Live Checklist (Vercel + Render + Hosted MySQL)

## 0. What goes where
- MySQL → Aiven / Railway / Clever Cloud (Render has no MySQL)
- Backend (`Assignment06/backend`, `npm start` → `server.js`) → Render Web Service via `Assignment06/render.yaml`
- Frontend (`Assignment06/frontend`, Next.js 16, `npm run build`) → Vercel

## 1. Backend (Render)
1. Create hosted MySQL `blogdb`, note host/port/user/password.
2. Render → New → Blueprint → repo `meherabnowshad/SDET-b19`, path `Assignment06/render.yaml`.
3. Fill `sync: false` vars in dashboard:
   `DB_HOST, DB_USER, DB_PASSWORD, FRONTEND_URL (temp), GMAIL, GMAIL_APP_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD`.
4. Deploy → test `GET https://<api>/api` → expect `{"success":true,...}`.
5. Render → Shell → `npm run seed:admin` (once). Login with `ADMIN_EMAIL / ADMIN_PASSWORD`.

## 2. Frontend (Vercel)
1. Vercel → Add New Project → same repo, Root Directory = `Assignment06/frontend`.
2. Framework = Next.js, Build = `npm install && npm run build`.
3. Environment Variables (Production + Preview) — set BEFORE build:
   ```
   NEXT_PUBLIC_API_URL=https://<your-render-api>.onrender.com/api
   ```
   Only this one is needed (see `services/api.js:5-6`). No secret here — it ships to browser.
4. Deploy → test: browse/search, register OTP, login, create blog, avatar upload.

## 3. Wire-up
1. Copy Vercel URL → Render backend `FRONTEND_URL=https://<vercel-app>.vercel.app` → redeploy backend.
2. Retest password-reset link (uses `FRONTEND_URL`) and CORS.

## 4. Post-live QA (for CV)
- Reader: search `playwright`, filter `Testing`, open `/blogs/[id]`.
- Member: register → OTP → login → avatar → create/edit/delete → profile → change-password → logout.
- Recovery: forgot-password → reset link → new login.
- Admin: Users table → view → deactivate → manage all blogs; confirm 401/403 on direct URL access.

## 5. Gotchas
- `/uploads` avatars are ephemeral on Render free (multer disk). Demo OK, resets on redeploy.
- Rotate the Gmail App Password exposed in `backend/.env.example` — create a new one, never commit `.env`.
- `NEXT_PUBLIC_*` is baked at build time — changing backend URL requires Vercel redeploy.
