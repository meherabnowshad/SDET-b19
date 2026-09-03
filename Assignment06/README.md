# Assignment 06 — BlogSpace (Blog Management Application)

**Batch:** 19 · **Topic:** Frontend Development

A complete, real-world-style blogging platform: a **Next.js + Tailwind CSS** frontend
(`frontend/`) consuming the **Express + MySQL Blog REST API** (`backend/`).
No fake data, no hardcoded users or blogs, no mock APIs — every screen reads from the API.

---

## Monorepo layout

```
Assignment06/
├── backend/                 # Blog REST API (Express 5 + Sequelize + MySQL + JWT)
│   ├── server.js            # entry point (default port 5001)
│   ├── app.js               # middleware + static /uploads + route mounting
│   ├── routes/ controllers/ validators/ middlewares/ models/ utils/ config/
│   ├── scripts/             # db:setup (migrates + adds profileImage), seed:admin
│   ├── uploads/             # profile images (git-ignored, served at /uploads)
│   ├── postman/             # API collection
│   ├── .env.example         # copy to .env
│   └── README-backend.md    # full API reference
└── frontend/                # BlogSpace web app (Next.js 16 App Router + Tailwind v4)
    ├── app/                 # routes (folder = URL)
    ├── components/          # Navbar, Sidebar, BlogCard, BlogForm, ...
    ├── contexts/            # AuthContext (session state)
    ├── services/            # auth/user/blog API layer
    ├── utils/               # validation, errors, image rules, formatting
    ├── .env.example         # NEXT_PUBLIC_API_URL template
    └── README.md            # frontend docs
```

> Note: `learn-nextjs-b19/` inside this folder is a leftover reference copy used for
> inspiration (auth patterns, upload handling). It is not part of the submission.

---

## Main features

**Guest** — browse/search/filter blogs, read blog details, register, login,
forgot-password → reset-password via emailed link.

**User** — dashboard with stats + recent blogs, create/edit/delete own blogs,
profile view + edit, avatar upload (navbar updates instantly), change password, logout.

**Admin** — everything a user can do, plus: user table, user detail page,
activate/deactivate accounts, edit/delete any blog. Admin routes are guarded in the
UI **and** enforced by the backend (401/403 respected, not just hidden menus).

Cross-cutting: reusable API layer, auth context persisted across refresh,
protected + role-based routes, frontend validation mirroring backend rules,
loading skeletons/spinners with pending buttons, friendly backend error messages,
empty states, delete confirmations, responsive layout (sidebar → drawer on mobile).

## Technologies

| Layer    | Stack |
| -------- | ----- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, axios |
| Backend  | Node.js, Express 5, Sequelize 6, MySQL 8, JWT, bcrypt, multer |
| Docs/QA  | Postman collection (`backend/postman/`), Newman-runnable |

## Installation

```bash
# 1. Backend
cd Assignment06/backend
npm install
cp .env.example .env        # then set DB_PASSWORD + secrets (see below)

# 2. Frontend (second terminal)
cd Assignment06/frontend
npm install
cp .env.example .env.local  # default already points at http://localhost:5001/api
```

## Environment variables

Backend (`backend/.env`):

```ini
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blogdb
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=1d
JWT_RESET_EXPIRES_IN=1h
FRONTEND_URL=http://localhost:3000

# Registration OTP emails (Gmail app password). Empty = dev mode
# (OTP logged to console + returned in the send-otp response).
GMAIL=you@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=One
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123
```

Frontend (`frontend/.env.local`):

```ini
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

> Port 5001 is deliberate: macOS AirPlay Receiver occupies port 5000.
> Never commit real `.env` / `.env.local` files (both are git-ignored).

## How to run

```bash
# Backend (needs MySQL 8 running)
cd Assignment06/backend
npm run db:setup     # create DB + tables + profileImage column (safe to re-run)
npm run seed:admin    # create/reset admin (default admin@example.com / password123)
npm run dev           # → http://localhost:5001  (health: GET /api)

# Frontend
cd Assignment06/frontend
npm run dev           # → http://localhost:3000
```

## Backend dependency

The frontend **requires** the backend: all data comes from `NEXT_PUBLIC_API_URL`.
Without it you get a friendly “Cannot reach the server” message instead of raw errors.
New endpoints added for this assignment (see `backend/README-backend.md` § Additions):

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `POST` | `/api/auth/register/send-otp` | Email a 6-digit registration code (`{ firstname, lastname, email, password }`) |
| `POST` | `/api/auth/register` | Verify code + create account (`{ ..., otp }`) |
| `POST` | `/api/auth/forgot-password` | Request reset link (`{ email }`) |
| `PATCH` | `/api/auth/reset-password/:token` | Set new password (`{ password }`) |
| `PATCH` | `/api/users/profile/image` | Avatar upload (`multipart/form-data`, field `image`, ≤ 2 MB) |

Plus: `users.profileImage` column, static `/uploads` serving, and
`author.profileImage` included in blog responses.

## Application routes

| Page | Access |
| ---- | ------ |
| `/` | Public — browse/search/filter |
| `/blogs/[id]` | Public — details / Blog Not Found |
| `/login`, `/register` | Public |
| `/forgot-password`, `/reset-password/[token]` | Public |
| `/dashboard` | User/Admin |
| `/dashboard/blogs` | User/Admin (mine / all) |
| `/dashboard/blogs/create` | User/Admin |
| `/dashboard/blogs/[id]/edit` | User/Admin (own / any) |
| `/dashboard/profile` | User/Admin |
| `/dashboard/change-password` | User/Admin |
| `/admin/users`, `/admin/users/[id]` | Admin only (else Access Denied) |

## User / Admin functionality

| Flow | Steps |
| ---- | ----- |
| Reader journey | Browse → search `playwright` → filter `Testing` → open blog |
| Member journey | Register (form → email OTP → verify) → login → dashboard → upload avatar → create → edit → delete → update profile → change password → logout |
| Recovery journey | Login → Forgot Password → email → reset link → new password → login |
| Admin journey | Login → dashboard → Users → view user → deactivate → manage all blogs |

## Screenshots

> TODO: add screenshots of these pages under `docs/` (or attach to the release):
> homepage, blog details, login, register, dashboard, manage blogs, create/edit blog,
> profile with avatar, change password, admin users, user detail, mobile drawer.

## Submission checklist

- [x] No hardcoded blogs/users; no mock APIs; no direct DB access from frontend
- [x] `userId` never sent on blog create (backend takes it from the token)
- [x] No frontend role controls; 401/403 from backend respected
- [x] `.env.example` files present; real secrets git-ignored
