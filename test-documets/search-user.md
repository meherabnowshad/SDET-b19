# Admin User Search — QA Findings

Scope: `GET /user/list`, `GET /user/search/id/:id`, `GET /user/search/phonenumber/:phone_number`, `GET /user/search/email/:email`, `GET /user/search/:role` in `dmoney-transaction-api`, as consumed by the Admin "Users" page and by the login/profile/self-statement self-lookup flows in `dmoney-web-react`.

Methodology: `find-bug` skill — every finding below is evidence-backed against actual source (file:line), cross-checked for business intent via git history, sibling code patterns, and every real caller in the frontend (found via repo-wide grep), before being classified.

## BUG Findings

### Finding 1: IDOR — any authenticated user can fetch any OTHER user's full record, not just their own
- **Classification:** 🔴 Confirmed Bug
- **Probability:** High
- **Type:** Security
- **Intended behavior:** Every non-admin caller of these endpoints only ever requests the caller's **own** identity: `login/page.tsx:77-85` looks up the email/phone the user just logged in with, `profile/page.tsx:78` looks up `localStorage.email`, `SelfStatement.tsx:80` does the same. Every lookup of an *arbitrary other* user happens exclusively from `/admin/*` pages (`admin/users/page.tsx`, `admin/users/[userId]/page.tsx`, `admin/transactions/page.tsx`). No agent/customer/merchant page calls these endpoints for anyone but themselves (verified via repo-wide grep — zero hits). CLAUDE.md also states the backend, not the frontend routing, is meant to be "the actual authorization boundary."
- **Actual behavior:** `routes/user.route.js:8-11` gates `/user/search/id/:id`, `/user/search/phonenumber/:phone_number`, `/user/search/email/:email` behind `publicAuthenticateJWT` (`jwtMiddleware.js:34-55`), which only verifies the JWT signature/expiry — it never checks `req.user.role` or compares the requested id/phone/email against the caller's own identity. The controller handlers (`controllers/users/user.controller.js:71-116`) do the same lookup for whatever id/phone/email is in the URL with no ownership check.
- **Why this is a defect:** The self-lookup pattern used by every real non-admin caller requires *some* authenticated access to these routes, so a blanket admin-only restriction would break login/profile/self-statement — but nothing stops that same Customer from substituting a different id/phone/email and pulling another user's full record. This contradicts the self-service-only intent evidenced by every actual non-admin call site in the codebase.
- **Steps to trigger:**
  1. Log in as any Customer/Agent/Merchant and capture the JWT.
  2. Call `GET /user/search/id/<some other user's id>` (e.g. an Admin's id) with that JWT + the app's `X-AUTH-SECRET-KEY`.
  3. `200 OK` with the other user's full record is returned — despite no legitimate flow in the app ever requesting anyone but the caller themselves through this path.
- **Regression impact:** A fix (`role === 'admin' || target === caller's own identity`) is safe for every named non-admin consumer, since all of them already only request their own identity. Admin flows (`admin/users/*`, `admin/transactions/page.tsx`) are unaffected since they'd pass the `role === 'admin'` branch.
- **Business impact:** Any registered user can enumerate and read full profile data — including NID, phone, email — for every other user on the platform, including Admins, simply by iterating IDs. Direct privacy exposure on an MFS platform handling NID/financial identity data.
- **Area:** `dmoney-transaction-api` — `routes/user.route.js`, `controllers/users/user.controller.js`

### Finding 2: Admin-only directory endpoints (`/user/list`, `/user/search/:role`) reachable by any authenticated role
- **Classification:** 🔴 Confirmed Bug
- **Probability:** High
- **Type:** Security
- **Intended behavior:** Unlike the id/phone/email endpoints, there is no self-lookup use case for these two routes at all — `/user/list` returns the entire user directory and `/user/search/:role` returns every user of a given role. Grep confirms the *only* call sites in the whole frontend are `admin/users/page.tsx:91` (`/user/list`) and `admin/users/page.tsx:167` (`/user/search/:role`) — both inside the Admin section.
- **Actual behavior:** `/user/list` uses `publicAuthenticateJWT` (no role check) and `/user/search/:role` uses `authenticateJWT`, which additionally requires `X-AUTH-SECRET-KEY` — but that header is populated from `NEXT_PUBLIC_SECRET_KEY` (`dmoney-web-react/src/lib/api.ts:48-51`), a public env var baked into the client bundle and sent by every logged-in user regardless of role. Neither `listUsers` (`user.controller.js:27-67`) nor `searchUsersByRole` (`user.controller.js:121-147`) checks `req.user.role`.
- **Why this is a defect:** With no self-use rationale and a single, Admin-only real caller, the absence of a server-side role check is a pure oversight, not a documented convention — any Customer/Agent/Merchant can call `GET /user/search/Admin` or `GET /user/list?count=1000` directly and get the full directory.
- **Steps to trigger:** As a logged-in Customer, call `GET /user/search/Admin` (or any role) — returns `200` with every Admin's name/email/phone/NID, a page no Customer session ever legitimately reaches.
- **Regression impact:** Adding an explicit admin-role check only affects the sole real consumer, `admin/users/page.tsx`, which already runs as an Admin session and would pass the check.
- **Business impact:** Full user-directory enumeration (PII: name, email, phone, NID) by any authenticated account, not just Admins.
- **Area:** `dmoney-transaction-api` — `routes/user.route.js:8,12`, `controllers/users/user.controller.js:27-67,121-147`

### Finding 3: Password hash, OTP, and password-reset token leaked in search/list responses
- **Classification:** 🔴 Confirmed Bug
- **Probability:** High
- **Type:** Security / Data
- **Intended behavior:** No frontend code anywhere reads `.otp`, `.reset_token`, or `.password` off a user-search response (verified via repo-wide grep — the only matches are unrelated form fields on create/register pages). The same controller file demonstrates the intended pattern elsewhere: `createUser` (`user.controller.js:189`) explicitly destructures out `password` before responding, and `searchUsersByRole` (`user.controller.js:134`) uses an explicit `attributes` allow-list that excludes these fields entirely.
- **Actual behavior:** `listUsers`/`searchUserById`/`searchUserByPhoneNumber`/`searchUserByEmail` (`user.controller.js:54, 76, 92, 108`) all return `{ ...user.dataValues, balance }` — a raw spread of the Sequelize row — which includes `password`, `otp`, `otp_expire`, `reset_token`, `reset_token_expires` (confirmed present via `DESCRIBE Users`).
- **Why this is a defect:** Sibling code in the very same file proves the team's own convention is to strip these fields before responding; this is an inconsistency/oversight, not a deliberate choice.
- **Steps to trigger:** Call `GET /user/search/id/<any id>` (as any authenticated user, per Finding 1) — response JSON includes `password`, `otp`, `otp_expire`, `reset_token`, `reset_token_expires` in cleartext-in-transit.
- **Regression impact:** Stripping these fields is safe for every consumer — none reads those keys.
- **Business impact:** Combined with Finding 1, this enables account takeover: an attacker can read a victim's live `reset_token` (if a password reset was recently requested) or active login `otp` and hijack the account without needing the victim's password.
- **Area:** `dmoney-transaction-api` — `controllers/users/user.controller.js:54,76,92,108`

### Finding 4: Unbounded page size + N+1 balance query in `listUsers`
- **Classification:** 🟡 Suspected — needs confirmation
- **Probability:** Medium
- **Type:** Performance
- **Intended behavior:** No ticket/comment states an intended page-size cap. Weak circumstantial evidence only: `searchUsersByRole`'s inline comments ("Optimized: Search users by role (no balance calculation)") show the team is aware of and has previously addressed this exact cost pattern for a sibling endpoint, suggesting `listUsers` may be an unaddressed instance of the same concern rather than an accepted trade-off — but this is inference, not proof of intent either way.
- **Actual behavior:** `count` (page size) is only floor-checked (`count > 0 ? count : 10`, `user.controller.js:32`) with no upper cap, so `?count=100000` forces `Users.findAll` to return the whole table. For each returned user, a separate `Transactions.findAll` query runs in a `Promise.all` loop (`user.controller.js:49-55`) to compute balance.
- **Open question for team:** Should `/user/list` cap `count` (e.g. to 100) and switch balance calculation to a single grouped aggregate (`SUM(credit) - SUM(debit) GROUP BY account`), matching the optimization already applied to `/user/search/:role`? Current DB size is small (observed ~14-20 users), so this may not be an active production issue yet.
- **Area:** `dmoney-transaction-api` — `controllers/users/user.controller.js:31-55`

### Finding 5: Search/filter state is lost on back-navigation from user details
- **Classification:** 🔴 Confirmed Bug
- **Probability:** High
- **Type:** Functional (state transition)
- **Intended behavior:** A user who searches/filters the user list, opens a result's details page, then navigates back, expects to land back on their filtered results (standard list→detail→back UX expectation; the page even tracks `isSearchMode`/`allSearchResults` specifically to support paginating within search results, showing this was a deliberate feature).
- **Actual behavior:** `admin/users/page.tsx:199-201` (`handleViewProfile`) does `router.push('/admin/users/${userId}')`, a full route navigation to `admin/users/[userId]/page.tsx`, which unmounts `UserList`. All search state — `searchTerm`, `searchType`, `roleFilter`, `isSearchMode`, `allSearchResults`, `currentPage` (lines 52-68) — lives only in local `useState`, with no persistence to the URL (no query params), `sessionStorage`, or any shared store. On back-navigation, `UserList` remounts with all state reset to its initial values; the mount `useEffect` (line 111-118) then calls `fetchUsers()` with `isSearchMode = false`, which hits the plain `/user/list` endpoint (lines 89-98) instead of restoring the previous search.
- **Why this is a defect:** The component clearly implements search-mode as a first-class concept (separate `allSearchResults` cache, dedicated pagination logic for search mode) — this proves filtered browsing was intentionally supported, but the transition through the details page and back was not accounted for, since nothing survives the unmount.
- **Steps to trigger:**
  1. On Admin → Users, search by role (or id/phone/email) so the table shows filtered results.
  2. Click a row to view that user's details (`View Profile` → navigates to `/admin/users/<id>`).
  3. Click browser Back (or any "back" affordance on the details page).
  4. Expected: filtered results restored. Actual: table shows the full unfiltered `/user/list` page 1, and the search inputs are cleared.
- **Regression impact:** Named flow: Admin → Users search/filter → view details → back, used by admin operators auditing specific user segments (e.g., all Merchants, or a specific ID) — they lose their place and must re-enter the search after every detail view.
- **Business impact:** Repetitive re-searching for admins doing any multi-user review (e.g., checking several users in a role one by one), since every detail-view round-trip discards the filter.
- **Suggested fix direction:** Persist search state across navigation — e.g., encode `searchType`/`searchTerm`/`roleFilter`/`currentPage` as URL query params on `/admin/users` (so back-navigation restores them from the URL) rather than relying on component state that dies with the page.
- **Area:** `dmoney-web-react` — `src/app/admin/users/page.tsx:52-68,111-118,199-201`

---

## Verdict Summary
🔴 Confirmed: 4 (Findings 1-3, 5) · 🟡 Suspected: 1 (Finding 4) · ⚪ Not a Bug: 0

## Suggested Sanity Test Cases

1. **List pagination happy path** — `GET /user/list?page=1&count=10&order=desc` as Admin → `200`, `users.length <= 10`, each `balance` matches ledger sum.
2. **Search by id/phone/email consistency** — same user via all three lookups → identical record + balance.
3. **Not-found handling** — `GET /user/search/id/999999` → `404`, not `500`.
4. **[Security] Self-lookup allowed, cross-user lookup blocked** — Customer JWT calling `GET /user/search/id/<own id>` → `200` (self); calling `GET /user/search/id/<another user's id>` → should be `403` (currently `200`, Finding 1).
5. **[Security] Admin-only directory endpoints reject non-admin roles** — Customer JWT calling `GET /user/list` or `GET /user/search/Admin` → should be `403` (currently `200`, Finding 2).
6. **[Security] No sensitive fields in response** — inspect JSON keys from any search endpoint (including self-lookup) → should exclude `password`, `otp`, `otp_expire`, `reset_token`, `reset_token_expires` (Finding 3).
7. **Search by role pagination/case-insensitivity** — `GET /user/search/customer?page=1&limit=2` as Admin → correct `count`/`totalPages`, case-insensitive role match.
8. **[Regression] Login/profile/self-statement flows still work after ownership-check fix** — log in, view profile, view self-statement as each role → all must still resolve via self-lookup once Finding 1/2 fixes are applied.
9. **[Regression] Admin Users page UI** — search by ID/phone/email/role in the Admin UI still renders correct rows after any backend response-shape fix (frontend reads `response.data.user` / `response.data.users` directly).
10. **[State transition] Filter survives detail-view round-trip** — search/filter the Admin Users list, open a result's details page, navigate back → filtered results and search inputs should still be present (currently fail, Finding 5).
