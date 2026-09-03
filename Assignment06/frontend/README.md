# BlogSpace frontend

Next.js 16 (App Router) + Tailwind CSS v4 + axios. Consumes the Assignment06 Blog REST API.
No mock data — every page calls the backend at `NEXT_PUBLIC_API_URL`.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5001/api
npm run dev                  # → http://localhost:3000
npm run build && npm start   # production
```

The backend must be running (`Assignment06/backend`, default `http://localhost:5001`).

## Structure

```
app/
├── page.jsx                        # / — hero, SearchBar, CategoryFilter, BlogCards
├── blogs/[id]/page.jsx             # /blogs/:id — details / Blog Not Found
├── login/ register/                # auth forms with validation
├── forgot-password/                # POST /auth/forgot-password
├── reset-password/[token]/         # PATCH /auth/reset-password/:token
├── dashboard/
│   ├── layout.jsx                  # auth guard + Sidebar shell
│   ├── page.jsx                    # welcome, stats, recent, quick create
│   ├── blogs/page.jsx              # manage table + delete confirm
│   ├── blogs/create/page.jsx       # POST /blogs/create
│   ├── blogs/[id]/edit/page.jsx    # GET then PUT /blogs/update/:id
│   ├── profile/page.jsx            # GET/PUT profile + PATCH profile/image
│   └── change-password/page.jsx    # PATCH /users/password
└── admin/
    ├── layout.jsx                  # admin-only guard + Sidebar shell
    └── users/ + users/[id]/        # GET /users, GET /:id, PATCH /:id/status
components/  Navbar, Footer, Sidebar, ProfileMenu, Avatar, BlogCard, BlogForm,
             SearchBar, CategoryFilter, Loader, ConfirmDialog, ProtectedRoute, EmptyState
contexts/AuthContext.jsx            # user, role, avatar; survives refresh via /users/profile
services/    api.js (axios + JWT) · auth.service.js · user.service.js · blog.service.js
utils/       auth (session) · errors (friendly messages) · validation · image · format
```

## Auth & roles

- Login stores the JWT (`blogspace_token`) and user; `api.js` attaches
  `Authorization: Bearer <token>` to every request.
- Refresh re-validates via `GET /users/profile`; invalid tokens log out silently.
- `/dashboard/**` needs login (→ `/login`); `/admin/**` needs `role === "admin"`.
- Backend 401/403 messages are shown as-is (e.g. deactivated accounts,
  “not authorized to update this blog”); raw JS errors are never displayed.

## Notes

- Search (`?title=`) is debounced and combined with category (`?category=`),
  mirroring `GET /api/blogs?title=&category=`. The navbar search syncs to `/?title=`.
- Avatar upload: JPG/PNG/GIF/WEBP ≤ 2 MB, live preview, navbar refreshes without re-login.
- Sidebar is a drawer below `lg`; tables scroll horizontally on small screens.
```

