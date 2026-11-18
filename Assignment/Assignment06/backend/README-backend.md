# Assignment 05 — Blog Management REST API

> **Assignment 06 additions** (for the Next.js frontend in `../frontend/`):
>
> - Default port is now **5001** (macOS occupies 5000 with AirPlay).
> - New: `POST /api/auth/forgot-password` (`{ email }`) → returns a generic
>   success message plus, for development (no mailer), `data: { resetUrl, token }`.
>   The link is also logged to the server console.
> - New: `PATCH /api/auth/reset-password/:token` (`{ password, min 6 }`) →
>   `Password successfully changed.` (expired/invalid links → `400`).
> - New: `PATCH /api/users/profile/image` (auth, `multipart/form-data`,
>   field **`image`**, JPG/PNG/GIF/WEBP ≤ 2 MB) → updated user with `profileImage`
>   (`/uploads/…`, served statically). Old file is deleted on replace.
> - New `users.profileImage` column (nullable `VARCHAR(500)`); `npm run db:setup`
>   and server start both add it if missing (safe to re-run).
> - Blog `author` objects now include `profileImage`.
> - New env: `JWT_RESET_EXPIRES_IN` (default `1h`), `FRONTEND_URL` (default
>   `http://localhost:3000`, used to build the reset link). New dep: `multer`.
> - Registration is OTP-gated: `POST /api/auth/register/send-otp`
>   (`{ firstname, lastname, email, password }`, 409 if taken) emails a 6-digit
>   code (Gmail SMTP via `GMAIL` + `GMAIL_APP_PASSWORD`, 2-min expiry);
>   `POST /api/auth/register` now requires `{ ..., otp }` (bcrypt-hashed in the
>   `otps` table, 5 wrong attempts burns the code). Without Gmail configured the
>   API runs in dev mode: the OTP is logged and returned as `data.devOtp`.
> - Full endpoint list: `GET /api`.

A REST API for a blog application with three access levels — **Admin**, **User** and **Guest** — covering authentication, user management, blog CRUD, role-based authorization, validation and public blog search.

**Batch:** 19 &nbsp;·&nbsp; **Topic:** API Development &nbsp;·&nbsp; **Repository:** [https://github.com/meherabnowshad/SDET-b19](https://github.com/meherabnowshad/SDET-b19)

📖 **Postman documentation:** 

---

## Tech stack

| Concern          | Choice                                |
| ---------------- | ------------------------------------- |
| Runtime          | Node.js (ES modules)                  |
| Framework        | Express 5                             |
| Database         | MySQL 8                               |
| ORM              | Sequelize 6                           |
| Auth             | JSON Web Token (`jsonwebtoken`)     |
| Password hashing | bcrypt (`bcryptjs`, 10 salt rounds) |
| Validation       | `express-validator`                 |
| Misc             | `cors`, `morgan`, `dotenv`      |

---

## Project structure

```
Assignment05/
├── server.js                       # entry point: connect to the DB, then listen
├── app.js                          # express app: middleware + route mounting
├── routes/                         # endpoint -> middleware -> controller
│   ├── index.js                    # mounts /auth, /users, /blogs under /api
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── blog.routes.js
├── controllers/                    # request handling / business logic
│   ├── auth.controller.js          # register, login
│   ├── user.controller.js          # users list, profile, password, status
│   └── blog.controller.js          # blog CRUD + public search & filter
├── models/                         # sequelize models
│   ├── user.model.js               # users table + password hashing hooks
│   ├── blog.model.js               # blogs table
│   └── index.js                    # associations + initDB
├── middlewares/
│   ├── auth.middleware.js          # authenticate / authorize / field guards
│   ├── validate.middleware.js      # turns validator results into 400s
│   └── error.middleware.js         # 404 handler + single error responder
├── validators/                     # express-validator rules per resource
│   ├── auth.validator.js
│   ├── user.validator.js
│   └── blog.validator.js
├── config/
│   ├── env.js                      # typed access to environment variables
│   └── database.js                 # sequelize instance
├── utils/
│   ├── apiError.js                 # error class carrying an HTTP status
│   ├── asyncHandler.js             # forwards async errors to the handler
│   └── token.js                    # JWT sign / verify
├── scripts/
│   ├── setupDb.js                  # create the database + align the schema
│   └── seedAdmin.js                # create / reset the admin account
├── postman/
│   └── Blog-API.postman_collection.json
├── .env                            # local secrets (git-ignored)
└── .env.example                    # template to copy
```

### How a request flows

```
server.js  ->  app.js  ->  routes/  ->  middlewares/  ->  validators/  ->  controllers/  ->  models/
   |             |            |              |                 |               |              |
 starts      global       matches the    authenticate       checks the      does the      talks to
 the DB +    middleware   URL and        + authorize        request body    actual work   MySQL via
 listens     & mounting   method         (401 / 403)        (400)                         Sequelize
```

---

## Getting started

### 1. Prerequisites

- Node.js 18 or newer
- A running MySQL 8 server

### 2. Install

```bash
cd Assignment05
npm install
```

### 3. Configure

```bash
cp .env.example .env
```

Then edit `.env`:

```ini
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=blogdb
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=1d

ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=One
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123
```

`.env` and `node_modules` are both in `.gitignore`.

### 4. Create the database and tables

```bash
npm run db:setup
```

This creates the `blogdb` database if it is missing, creates the `users` and `blogs`
tables, and renames any legacy `createdAt` / `updatedAt` columns to the
`createAt` / `updateAt` names this assignment specifies. It never drops data, so
it is safe to re-run.

### 5. Create the admin account

```bash
npm run seed:admin
```

Creates (or resets) an admin from the `ADMIN_*` values in `.env` — by default
`admin@example.com` / `password123` with `role = admin`.

An admin is just a user whose `role` is `admin`, so you can also promote an
existing account by hand:

```sql
UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
```

### 6. Run

```bash
npm start     # or: npm run dev  (restarts on file changes)
```

```
Database connected and models synced
Server is running on http://localhost:3000
```

Confirm it is alive with `GET http://localhost:3000/api`.

---

## Database schema

Database name: **`blogdb`**

### `users`

| Column        | Type                     | Notes                                   |
| ------------- | ------------------------ | --------------------------------------- |
| `id`        | INT                      | Primary key, auto increment             |
| `firstname` | VARCHAR(255)             | Required                                |
| `lastname`  | VARCHAR(255)             | Required                                |
| `email`     | VARCHAR(255)             | Required,**unique**               |
| `password`  | VARCHAR(255)             | bcrypt hash — never a plain-text value |
| `isActive`  | BOOLEAN                  | Default`true`                         |
| `role`      | ENUM(`admin`,`user`) | Default`user`                         |
| `createAt`  | DATETIME                 | Set automatically                       |
| `updateAt`  | DATETIME                 | Set automatically                       |

### `blogs`

| Column        | Type         | Notes                                 |
| ------------- | ------------ | ------------------------------------- |
| `id`        | INT          | Primary key, auto increment           |
| `userId`    | INT          | **Foreign key →** `users.id` |
| `blogTitle` | VARCHAR(255) | Required                              |
| `blog`      | TEXT         | Required                              |
| `category`  | VARCHAR(255) | Required                              |
| `createAt`  | DATETIME     | Set automatically                     |
| `updateAt`  | DATETIME     | Set automatically                     |

Relationship: a user **has many** blogs; a blog **belongs to** one user (exposed as `author`).

---

## Authentication

`POST /api/auth/login` returns a JWT. Send it on every protected endpoint:

```
Authorization: Bearer <token>
```

The middleware re-reads the user from the database on every request, so
deactivating an account immediately invalidates the tokens it already holds.

---

## Response format

Every response is a JSON envelope.

**Success**

```json
{
  "success": true,
  "message": "Blog created successfully.",
  "data": { }
}
```

`POST /api/auth/login` also returns a top-level `token`. List endpoints add
`count`, and `GET /api/blogs` echoes the `filters` it applied.

**Error**

```json
{
  "success": false,
  "message": "You are not authorized to update this blog."
}
```

Validation failures add an `errors` array naming each offending field:

```json
{
  "success": false,
  "message": "A valid email address is required.",
  "errors": [
    { "field": "email", "message": "A valid email address is required." },
    { "field": "password", "message": "password must be at least 6 characters long." }
  ]
}
```

---

## Endpoints

| #  | Method     | Endpoint                      | Access       | Purpose                      |
| -- | ---------- | ----------------------------- | ------------ | ---------------------------- |
| 1  | `POST`   | `/api/auth/register`        | Public       | Register a new user          |
| 2  | `POST`   | `/api/auth/login`           | Public       | Log in and receive a token   |
| 3  | `GET`    | `/api/users`                | Admin        | Get all users                |
| 4  | `GET`    | `/api/users/:id`            | Admin        | Get a specific user          |
| 5  | `PATCH`  | `/api/users/:id/status`     | Admin        | Activate / deactivate a user |
| 6  | `GET`    | `/api/users/profile`        | User / Admin | Get own profile              |
| 7  | `PUT`    | `/api/users/profile/update` | User / Admin | Update own profile           |
| 8  | `PATCH`  | `/api/users/password`       | User / Admin | Update own password          |
| 9  | `POST`   | `/api/blogs/create`         | User / Admin | Create a blog                |
| 10 | `GET`    | `/api/blogs`                | Public       | List / search / filter blogs |
| 11 | `GET`    | `/api/blogs/:id`            | Public       | Get a specific blog          |
| 12 | `PUT`    | `/api/blogs/update/:id`     | User / Admin | Update a blog                |
| 13 | `DELETE` | `/api/blogs/delete/:id`     | User / Admin | Delete a blog                |

`DELETE /api/blogs/:id` is also accepted and behaves identically to #13.

### Where each endpoint lives

| Endpoint                          | Route file                | Controller function                                        |
| --------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `POST /api/auth/register`       | `routes/auth.routes.js` | `controllers/auth.controller.js` → `register`         |
| `POST /api/auth/login`          | `routes/auth.routes.js` | `controllers/auth.controller.js` → `login`            |
| `GET /api/users`                | `routes/user.routes.js` | `controllers/user.controller.js` → `getAllUsers`      |
| `GET /api/users/:id`            | `routes/user.routes.js` | `controllers/user.controller.js` → `getUserById`      |
| `PATCH /api/users/:id/status`   | `routes/user.routes.js` | `controllers/user.controller.js` → `updateUserStatus` |
| `GET /api/users/profile`        | `routes/user.routes.js` | `controllers/user.controller.js` → `getProfile`       |
| `PUT /api/users/profile/update` | `routes/user.routes.js` | `controllers/user.controller.js` → `updateProfile`    |
| `PATCH /api/users/password`     | `routes/user.routes.js` | `controllers/user.controller.js` → `updatePassword`   |
| `POST /api/blogs/create`        | `routes/blog.routes.js` | `controllers/blog.controller.js` → `createBlog`       |
| `GET /api/blogs`                | `routes/blog.routes.js` | `controllers/blog.controller.js` → `getAllBlogs`      |
| `GET /api/blogs/:id`            | `routes/blog.routes.js` | `controllers/blog.controller.js` → `getBlogById`      |
| `PUT /api/blogs/update/:id`     | `routes/blog.routes.js` | `controllers/blog.controller.js` → `updateBlog`       |
| `DELETE /api/blogs/delete/:id`  | `routes/blog.routes.js` | `controllers/blog.controller.js` → `deleteBlog`       |

All three route files are mounted onto `/api` by `routes/index.js`, which `app.js`
attaches with `app.use('/api', routes)`.

### Examples

**Register** — `POST /api/auth/register`

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

`role` and `isActive` sent in this body are ignored: a new account is always
`role = user`, `isActive = true`. A client can never register itself as an admin.

**Login** — `POST /api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "id": 5, "firstname": "John", "lastname": "Doe", "email": "john@example.com", "role": "user", "isActive": true }
}
```

**Create blog** — `POST /api/blogs/create`

```json
{
  "blogTitle": "Introduction to API Testing",
  "blog": "This article explains the fundamentals of API testing...",
  "category": "Testing"
}
```

`userId` is taken from the token. Sending `userId` in the body is rejected with `400`.

**Public blog list** — `GET /api/blogs`

```json
{
  "success": true,
  "message": "Blogs fetched successfully.",
  "count": 1,
  "filters": { "title": null, "category": null },
  "data": [
    {
      "id": 1,
      "userId": 5,
      "blogTitle": "Introduction to API Testing",
      "blog": "This article explains...",
      "category": "Testing",
      "createAt": "2026-08-29T11:55:20.000Z",
      "updateAt": "2026-08-29T11:55:20.000Z",
      "author": { "id": 5, "firstname": "John", "lastname": "Doe" }
    }
  ]
}
```

The `author` object carries only `id`, `firstname` and `lastname` — never the
email, password or role.

**Search and filter** — no authentication needed:

```
GET /api/blogs?title=playwright                  # partial, case-insensitive title match
GET /api/blogs?category=Testing                  # category filter
GET /api/blogs?title=playwright&category=Testing # both, ANDed together
```

A search with no matches returns `200 OK` with `count: 0` and an empty `data` array.

**Update own profile** — `PUT /api/users/profile/update`

```json
{
  "firstname": "John",
  "lastname": "Smith"
}
```

Accepts any subset of `firstname`, `lastname`, `email`. Sending `role` or
`isActive` returns `403 Forbidden` — `isActive` is changed only by an admin via
`PATCH /api/users/:id/status`.

**Update own password** — `PATCH /api/users/password`

```json
{
  "password": "newPassword123"
}
```

**Change a user's status** — `PATCH /api/users/:id/status` (admin)

```json
{
  "isActive": false
}
```

---

## Authorization matrix

| Action                      | Guest | User | Admin |
| --------------------------- | :---: | :--: | :---: |
| Register                    |  ✅  |  ✅  |  ✅  |
| Login                       |  ✅  |  ✅  |  ✅  |
| View all blogs              |  ✅  |  ✅  |  ✅  |
| View blog by ID             |  ✅  |  ✅  |  ✅  |
| Search blog by title        |  ✅  |  ✅  |  ✅  |
| Filter blog by category     |  ✅  |  ✅  |  ✅  |
| Create blog                 |  ❌  |  ✅  |  ✅  |
| Update own blog             |  ❌  |  ✅  |  ✅  |
| Update another user's blog  |  ❌  |  ❌  |  ✅  |
| Delete own blog             |  ❌  |  ✅  |  ✅  |
| Delete another user's blog  |  ❌  |  ❌  |  ✅  |
| View own profile            |  ❌  |  ✅  |  ✅  |
| Update own profile          |  ❌  |  ✅  |  ✅  |
| Update own password         |  ❌  |  ✅  |  ✅  |
| View all users              |  ❌  |  ❌  |  ✅  |
| View user by ID             |  ❌  |  ❌  |  ✅  |
| Activate / deactivate users |  ❌  |  ❌  |  ✅  |

---

## Validation rules

- Required fields cannot be empty or whitespace-only.
- `email` must be a valid address and unique across users.
- `password` must be at least **6** characters.
- `blogTitle`, `blog` and `category` cannot be empty.
- Route ids must be positive integers — anything else is `400`, not `404`.
- A missing user or blog is `404`.
- A missing or invalid token is `401`.
- An authenticated but disallowed action is `403`.
- A duplicate email is `409`.
- `isActive` must be a real boolean.
- Update endpoints require at least one updatable field in the body.

---

## Security

- Passwords are hashed with bcrypt in a Sequelize `beforeCreate` / `beforeUpdate`
  hook, so a plain-text password can never reach the database — not even through
  the seed script.
- The `password` column is stripped by the model's `defaultScope` and again in
  `toJSON()`, so no endpoint can leak a hash. Login is the only place that opts
  in, via an explicit `withPassword` scope.
- Token-based authentication (JWT) with the secret and lifetime in `.env`.
- Every protected endpoint validates the token, then the role, then ownership.
- Blog ownership comes from the token, never from the request body.
- `role` and `isActive` are not writable through registration or the profile endpoint.
- Login returns one message for both an unknown email and a wrong password, so
  the endpoint does not reveal which accounts exist.

---

## HTTP status codes

| Code                          | Used when                                                             |
| ----------------------------- | --------------------------------------------------------------------- |
| `200 OK`                    | Successful read, update or delete                                     |
| `201 Created`               | Registration, blog creation                                           |
| `400 Bad Request`           | Validation failed, invalid id,`userId` sent by the client           |
| `401 Unauthorized`          | No / invalid / expired token, wrong credentials                       |
| `403 Forbidden`             | Wrong role, someone else's blog, deactivated account, protected field |
| `404 Not Found`             | User, blog or route does not exist                                    |
| `409 Conflict`              | Email already registered                                              |
| `500 Internal Server Error` | Unexpected server fault                                               |

---

## Postman

The collection lives at
[`postman/Blog-API.postman_collection.json`](postman/Blog-API.postman_collection.json)
— **47 requests** across 6 folders, covering all 13 required endpoints plus the
negative cases for every authorization and validation rule.

### Import and run

1. Postman → **Import** → select `postman/Blog-API.postman_collection.json`.
2. Check the `baseUrl` collection variable (default `http://localhost:3000`).
3. Start the server, then use **Run collection** to execute everything in order.

Login requests store their tokens in the `adminToken` / `userToken` collection
variables automatically, and *Register User* / *Create Blog* store `userId` /
`blogId`, so nothing has to be copied by hand.

A pre-request script on *Register User* stamps each run's test emails with a
timestamp, so the collection can be run over and over against the same database
without tripping the unique-email rule.

Every request carries a test script. Two consecutive full runs against the same
database both give **47 requests, 81 assertions, 0 failures**.

You can also run it headlessly:

```bash
npx newman run postman/Blog-API.postman_collection.json
```

---

## npm scripts

| Script                 | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm start`          | Start the API                                      |
| `npm run dev`        | Start with auto-restart on file changes            |
| `npm run db:setup`   | Create the database, tables and align column names |
| `npm run seed:admin` | Create or reset the admin account                  |

---

## Notes

- Accounts created by the earlier CLI version of this project (Assignment 04)
  stored plain-text passwords and cannot log in through this API. `npm run seed:admin` lists any such accounts. Re-register them, or have an admin reset
  them, to make them usable.
