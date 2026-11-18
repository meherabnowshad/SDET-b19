# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

DMoney is a Mobile Financial Service (MFS) platform (bKash/Nagad-style) enabling digital money movement between four user roles — **Admin, Agent, Customer, Merchant** — plus an internal virtual **SYSTEM** account that collects fees. It ships as two separately deployed apps:

- **`dmoney-transaction-api`** — Node.js/Express + Sequelize/MySQL REST backend owning all business logic: user management, OTP-based login, and the transaction ledger (deposit, withdraw, send-money, payment, admin-to-SYSTEM top-up, Stripe bank cash-in).
- **`dmoney-web-react`** — Next.js 15 (TypeScript) + MUI frontend consuming that API, with role-based navigation and pages for each of the four roles.

Balances are never stored directly; they're derived from a double/triple-entry transaction ledger. Fee/commission rates and per-role transaction limits are DB-driven, not hardcoded. See the "Architecture" section below for how these pieces fit together, and `dMoney/dmoney-web-react/README.md` for the full business-rules reference (BRD).

## Repository layout

This is not a single project — it's a workspace containing two **independently git-versioned** repos under `dMoney/`, plus one legacy/unused app:

- `dMoney/dmoney-transaction-api/` — Node.js/Express + Sequelize/MySQL backend (own git repo, remote `salmansrabon/dmoney-transaction-api`).
- `dMoney/dmoney-web-react/` — Next.js 15 (TypeScript) + MUI frontend (own git repo, remote `salmansrabon/dmoney-web-react`).
- `dMoney/dmoney-web-react/dmoney-reactjs/` — an older Create-React-App frontend, superseded by the Next.js app above. Only touch this if explicitly asked to; it is not part of the active system.
- `dMoney/local-dmoneydb-202604201925.sql` — a local DB dump/snapshot.

The workspace root itself (`/Users/nowshad/SDET`) is **not** a git repo — always `cd` into the relevant sub-repo before running git commands.

Read `dMoney/dmoney-web-react/README.md` first when you need business/domain context — it's a detailed BRD (roles, transaction rules, fee/commission math, API reference, HTTP status conventions) covering both the API and the frontend. Treat `QUICK_START.md` in the same directory as **stale**: it describes an early, partially-migrated state of the frontend; the app is now fully migrated (see `src/app/*` for the full page list — admin, agent, customer, merchant sections all exist).

## Commands

### Backend — `dMoney/dmoney-transaction-api`
```bash
npm run dev      # nodemon server.js (auto-restart)
npm start        # node server.js
```
There is no configured test runner (no `test` script in package.json despite CI invoking `npm test` — that step is currently a no-op/failure risk, not a real gate). The two files in `tests/` are manual, ad-hoc scripts invoked directly with `node`, not part of an automated suite:
```bash
node tests/sendPersonalEmail.test.js [recipientEmail]
node tests/sendServiceAccountEmail.test.js [recipientEmail]
```
DB schema changes are applied via one-off migration scripts (no migration framework/CLI — just plain Node scripts using the Sequelize models):
```bash
node migrations/add_otp_to_users.js
node migrations/add_reset_token_to_users.js
node migrations/add_status_to_users.js
node migrations/add_transaction_type_to_transactions.js
node migrations/create_commission_table.js
node migrations/create_transaction_limits.js
```
Swagger docs are served at `/api-docs/user` and `/api-docs/transaction` when the server is running.

### Frontend — `dMoney/dmoney-web-react`
```bash
npm run dev      # next dev --turbopack (default Next.js port 3000, see .env for overrides)
npm run build    # next build --turbopack
npm start        # cross-env PORT=3006 next start
npm run prod     # build then start on port 3006
npm run lint     # type/lint check (per QUICK_START.md; verify against current package.json scripts before relying on it)
```
Both sub-repos use `.env` (see `.env.example` in each) for config — copy and fill in before running. The frontend's `NEXT_PUBLIC_API_URL` must point at the backend's port; the backend's `PORT` defaults to what's in its own `.env.example` (5000) but `server.js` falls back to 3000 if unset.

## Architecture

DMoney is a Mobile Financial Service (MFS) platform (bKash/Nagad-style) with four user roles (**Admin, Agent, Customer, Merchant**) plus an internal virtual **SYSTEM** account, built as a classic REST backend + separate SPA frontend:

```
dmoney-web-react (Next.js/TS/MUI)  --HTTP-->  dmoney-transaction-api (Express/Sequelize)  -->  MySQL
```

### Backend (`dmoney-transaction-api`)
- Entry point: `server.js` → `app.js` (Express app wiring: CORS, morgan, Swagger, routes, error handlers). Routes live in `routes/`, business logic in `controllers/users/` and `controllers/transactions/`, Sequelize models in `sequelizeModel/`, cross-cutting helpers in `services/` (email, balance calc, trnxId generation, limit checking).
- **Auth**: two JWT middlewares in `jwtMiddleware.js` — `authenticateJWT` (requires `Authorization: Bearer <jwt>` **and** `X-AUTH-SECRET-KEY` header matching `PARTNER_KEY`) used on all write/CRUD/transaction routes, and `publicAuthenticateJWT` (JWT only) used on read-only user-search routes.
- **Login is a two-step OTP flow** for everyone except Admin/SYSTEM: `POST /user/login` issues a 4-digit OTP (console-logged always, emailed only if the address is `@gmail.com`) with a 2-minute expiry, then `POST /user/verify-otp` exchanges it for the JWT. Admin/SYSTEM get a JWT immediately from `/user/login`.
- **Passwords** are hashed with SHA-256 (`utils/hash.js`) — note the BRD in `dmoney-web-react/README.md` says "plain text," which is now out of date; treat the code as authoritative on this point.
- **Balances are never stored** — every user's balance is computed on the fly as `SUM(credit) - SUM(debit)` over the `Transactions` table filtered by `account`. This double/triple-entry ledger design (`services/getBalance.js`) is the key thing to preserve when touching any transaction controller: every financial operation must write matched, balanced ledger rows sharing one `trnxId` (generated via `services/generateTrnxId.js`), not mutate a balance field.
- **Fee/commission rates and per-role transaction limits are DB-driven**, not hardcoded: the `Commissions` table backs deposit/withdraw/payment/sendmoney fee math, and the `TransactionLimits` table (checked by `services/limitChecker.js` before balance checks) enforces daily/monthly outgoing caps per role. Changing rates/limits is a data change, not a code change.
- **HTTP status conventions are nonstandard by design** — this codebase deliberately uses `208` for "soft" business-rule failures (insufficient balance, wallet cap exceeded, duplicate user/Stripe payment) rather than `400`/`409`. Match this convention when adding new failure paths; `400` is reserved for hard validation errors (bad input, limit-exceeded, OTP failures).
- Protected/system accounts (SYSTEM, and specific admin emails) are hardcoded as immutable — update/delete handlers must keep rejecting mutations to them.
- Stripe Cash-In is a two-step flow (`create-intent` then `confirm`) with anti-spoofing (`paymentIntent.metadata.customer_phone` must match the authenticated user) and idempotency (rejects if a transaction already exists with `trnxId = paymentIntentId`).
- Full endpoint-by-endpoint contract (request/response shapes, validation rules, fee formulas, ledger entries per transaction type) is documented in `dMoney/dmoney-web-react/README.md` §§6–15 — consult it before changing controller behavior rather than reverse-engineering from code alone.

### Frontend (`dmoney-web-react`)
- Next.js App Router; pages under `src/app/<role>/...` mirror the role-based menu structure (`admin/*`, `agent/*`, `customer/*`, `merchant/*`, plus shared `profile`, `change-password`, `login`, `register`, `forgot-password`/`reset-password`).
- `src/lib/api.ts` is the single Axios instance for all API calls: it proactively decodes the JWT to check `exp` before each request, attaches `Authorization` + `X-AUTH-SECRET-KEY` headers, and on any `401` response clears `localStorage` + the `token` cookie and hard-redirects to `/login` (`403` is left alone — that means "forbidden," not "expired," and should surface as an in-page error instead).
- `src/middleware.ts` does edge-level route protection based on the `token` cookie (separate from the `localStorage` token used for API calls — both must be kept in sync on login/logout).
- Role is read from `localStorage` to drive which sidebar menu (`src/components/LeftMenu.tsx`) and pages are shown — there's no server-side role check on the frontend beyond the login/token gate, so treat the backend as the actual authorization boundary.
- Self-statement pages (`agent/self-statement`, `customer/self-statement`, `merchant/self-statement`) all share `src/components/SelfStatement.tsx`, which fetches up to 10,000 records and computes date-range filtering and running balance client-side.
