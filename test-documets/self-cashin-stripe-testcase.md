# Self Cash-in via Stripe — Test Cases

**Feature under test:** `POST /transaction/stripe/create-intent`, `POST /transaction/stripe/confirm`
**Source:** `dMoney/dmoney-transaction-api/controllers/transactions/stripeCashIn.controller.js`
**Consumer:** Customer 3-step wizard — `dMoney/dmoney-web-react/src/app/customer/cash-in-bank/page.tsx`

## Scope Summary

The core promise: a Customer tops up their dMoney wallet from a bank card via Stripe, receiving exactly the charged amount, exactly once, without breaching the 10–10,000 tk per-transaction range or the 10,000 tk wallet cap. Key decision points: role/status gate (Customer + active — enforced only on create-intent, controller.js:44-49), amount range check (controller.js:62-67), two distinct wallet-cap branches (already-at-cap vs. exceeds-remaining-headroom, controller.js:73-84), Stripe status gate on confirm (`succeeded` only, line 146), anti-spoofing metadata match (line 153), and idempotency on `trnxId` (line 160). Named regression-affected flows: the Customer self-statement page (`SelfStatement.tsx`), which must render these ledger rows correctly despite `transaction_type` being left `NULL` for this transaction type (unlike Deposit/Withdraw/SendMoney, which set it); and the frontend's own explicitly-flagged footgun (page.tsx:213-217, code-commented) that HTTP 208 is a 2xx and won't make axios throw, so the wallet-cap soft-failure must still render as an error, not a false success.

Card-decline reasons (expired / bad CVC / insufficient funds / lost / stolen / generic decline) are **one equivalence class** — our code handles every Stripe `stripeError` identically (page.tsx:82-86), so only one representative case is included rather than enumerating each reason.

---

### Test Case 1
**Title:** Verify a Customer completes a full cash-in with a valid card and the wallet/ledger update correctly
**Type:** Functional
**Priority:** High
**Covers:** Core happy path — both endpoints, ledger correctness (controller.js:171-192)
**Preconditions:**
- Logged in as Test Customer 1 (`customer1@dmoney.com` / `01686606902`, role Customer, status active)
- Current wallet balance ≤ 9,500 tk (so the 500 tk cash-in doesn't hit the wallet cap)
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 500 }`
2. Complete `stripe.confirmCardPayment` client-side with card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC
3. `POST /transaction/stripe/confirm` with the resulting `paymentIntentId`
**Expected Result:**
- create-intent: `200` `{ clientSecret, amount: 500, minAmount: 10, maxAmount: 10000 }`
- confirm: `201` `{ message: "Cash in successful", trnxId: "<paymentIntentId>", amount: 500, currentBalance: <preTestBalance + 500> }`
- Exactly two `Transactions` rows share `trnxId = <paymentIntentId>`: `{account: 'SYSTEM', from_account: 'STRIPE', to_account: '01686606902', debit: 500, credit: 0}` and `{account: '01686606902', from_account: 'STRIPE', to_account: '01686606902', debit: 0, credit: 500}`
- Step 3 receipt shows the same trnxId, amount, and balance

---

### Test Case 2
**Title:** Verify cash-in succeeds at the exact minimum boundary amount (10 tk)
**Type:** Functional
**Priority:** Medium
**Covers:** Boundary of `amt < minAmount` — 10 is inclusive, not rejected (controller.js:62)
**Preconditions:**
- Test Customer 1, balance ≤ 9,990 tk
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 10 }`
2. Complete payment with a valid card and confirm
**Expected Result:**
- create-intent returns `200` (not the 400 "Minimum cash-in amount is 10 tk" error); confirm returns `201`, wallet credited by exactly 10

---

### Test Case 3
**Title:** Verify cash-in succeeds when the resulting balance lands exactly at the 10,000 tk wallet cap
**Type:** Functional
**Priority:** High
**Covers:** Boundary of the `amt > remaining` wallet-cap branch — remaining is inclusive (controller.js:80)
**Preconditions:**
- Test Customer 1, balance set to exactly 9,950 tk
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 50 }`
2. Complete payment with a valid card and confirm
**Expected Result:**
- create-intent returns `200` (50 ≤ remaining 50, not rejected); confirm returns `201` with `currentBalance: 10000`

---

### Test Case 4
**Title:** Verify a card requiring 3D Secure (SCA) authentication completes successfully once authenticated
**Type:** Functional
**Priority:** High
**Covers:** SCA/3DS compliance path — distinct from the plain-card happy path (Stripe.js-driven challenge inside `confirmCardPayment`, page.tsx:77-80)
**Preconditions:**
- Test Customer 1, balance ≤ 9,700 tk
**Steps:**
1. Create-intent for `{ "amount": 300 }`
2. Submit card `4000 0025 0000 3155` and approve the 3DS challenge modal when it appears
3. Confirm with the resulting `paymentIntentId`
**Expected Result:**
- `confirmCardPayment` resolves with `paymentIntent.status === 'succeeded'` after authentication; `/confirm` returns `201`; wallet credited by 300

---

### Test Case 5
**Title:** Verify an amount below the minimum is rejected with the exact business message
**Type:** Negative
**Priority:** Medium
**Covers:** `amt < minAmount` branch (controller.js:62-64)
**Preconditions:** Test Customer 1
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 9.99 }`
**Expected Result:** `400` `{ "message": "Minimum cash-in amount is 10 tk" }`; no PaymentIntent is created

---

### Test Case 6
**Title:** Verify an amount above the per-transaction maximum is rejected, independent of wallet headroom
**Type:** Negative
**Priority:** Medium
**Covers:** `amt > maxAmount` branch (controller.js:65-67) — distinct decision point from the wallet-cap branches
**Preconditions:** Test Customer 1, balance = 0 (proves this is the per-txn cap, not the wallet cap, that fires)
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 10000.01 }`
**Expected Result:** `400` `{ "message": "Maximum cash-in amount is 10000 tk" }`

---

### Test Case 7
**Title:** Verify cash-in is blocked with the "already at maximum capacity" message when the wallet is already at cap
**Type:** Negative
**Priority:** High
**Covers:** `currentBalance >= maxAmount` branch (controller.js:73-77) — distinct message/branch from Test Case 8
**Preconditions:** Test Customer 1, balance = 10,000 tk
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 50 }`
**Expected Result:** `208` `{ "message": "Limit exceeded. Your wallet is already at maximum capacity." }`; no PaymentIntent created

---

### Test Case 8
**Title:** Verify cash-in is blocked with the exact remaining-headroom message when the amount would push the wallet past the cap
**Type:** Negative
**Priority:** High
**Covers:** `amt > remaining` branch (controller.js:78-84) — remaining computed as `maxAmount - currentBalance`
**Preconditions:** Test Customer 1, balance = 9,950 tk
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 50.01 }`
**Expected Result:** `208` `{ "message": "Limit exceeded. You can cash in a maximum of 50.00 tk." }`

---

### Test Case 9
**Title:** Verify a non-numeric/zero/negative amount is rejected (equivalence class)
**Type:** Negative
**Priority:** Low
**Covers:** `!amt || isNaN(amt) || amt <= 0` branch (controller.js:52-54) — one representative for the whole falsy/NaN/≤0 class
**Preconditions:** Test Customer 1
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": "abc" }`
**Expected Result:** `400` `{ "message": "Amount must be a positive number" }`

---

### Test Case 10
**Title:** Verify a card declined by Stripe shows an inline error and does not credit the wallet (equivalence class)
**Type:** Negative
**Priority:** High
**Covers:** `stripeError` branch (page.tsx:82-86) — one representative for all Stripe-side decline reasons (expired, bad CVC, insufficient funds, lost, stolen, generic)
**Preconditions:** Test Customer 1, valid create-intent already obtained for `{ "amount": 200 }`
**Steps:**
1. Submit card `4000 0000 0000 0002` (generic decline) on Step 2
**Expected Result:** Inline error shown on Step 2 (Stripe's decline message); user remains on Step 2; `/transaction/stripe/confirm` is never called; wallet balance unchanged

---

### Test Case 11
**Title:** Verify an abandoned/failed 3D Secure challenge does not credit the wallet
**Type:** Negative
**Priority:** Medium
**Covers:** The `else` branch when `paymentIntent.status !== 'succeeded'` after authentication (page.tsx:88-93) — distinct outcome from Test Case 4 and Test Case 10
**Preconditions:** Test Customer 1, valid create-intent obtained for `{ "amount": 300 }`
**Steps:**
1. Submit card `4000 0025 0000 3155` and dismiss/fail the 3DS challenge instead of authenticating
**Expected Result:** "Payment was not completed. Please try again." shown on Step 2; wallet not credited; `/confirm` not called

---

### Test Case 12
**Title:** Verify a customer cannot confirm a PaymentIntent belonging to a different customer (anti-spoofing)
**Type:** Security
**Priority:** High
**Covers:** `metadata.customer_phone !== customerPhone` check (controller.js:153-157)
**Preconditions:**
- Test Customer 1 (`01686606902`) creates a PaymentIntent for `{ "amount": 200 }` and completes the card charge (does not yet call `/confirm`)
- Test Customer 2 (`customer2@dmoney.com` / `01686606903`) is logged in with their own valid JWT
**Steps:**
1. As Customer 2, `POST /transaction/stripe/confirm` with Customer 1's `paymentIntentId`
**Expected Result:** `403` `{ "message": "Payment intent does not belong to this account" }`; Customer 2's wallet is not credited; Customer 1's PaymentIntent remains unconfirmed via this call

---

### Test Case 13
**Title:** Verify a duplicate confirm call for an already-processed PaymentIntent is rejected (idempotency)
**Type:** Security
**Priority:** High
**Covers:** `Transactions.findOne({ trnxId })` guard (controller.js:160-165)
**Preconditions:** Test Customer 1 has already successfully completed one cash-in (Test Case 1's flow)
**Steps:**
1. `POST /transaction/stripe/confirm` again with the same, already-confirmed `paymentIntentId`
**Expected Result:** `208` `{ "message": "This payment has already been processed" }`; exactly one debit/credit ledger pair exists for that `trnxId` (no second pair written); wallet not double-credited

---

### Test Case 14
**Title:** Verify a non-Customer role cannot create a Stripe payment intent
**Type:** Security
**Priority:** High
**Covers:** `role !== 'Customer'` check (controller.js:44-46)
**Preconditions:** Test Agent (`agent@dmoney.com` / `01686606901`, role Agent)
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 100 }` using the Agent's JWT
**Expected Result:** `403` `{ "message": "Only customers can use bank cash-in" }`

---

### Test Case 15
**Title:** Verify a request with no valid auth token is rejected
**Type:** Security
**Priority:** Medium
**Covers:** `authenticateJWT` boundary (`jwtMiddleware.js`) — represents the auth-failure equivalence class (missing token, missing/wrong secret key, expired/invalid JWT all fail closed before reaching the controller)
**Preconditions:** None (unauthenticated request)
**Steps:**
1. `POST /transaction/stripe/create-intent` with `{ "amount": 100 }` and no `Authorization` header
**Expected Result:** `401` `{ "message": "No Token Found!" }`; controller logic never executes

---

### Test Case 16
**Title:** Verify a completed Stripe cash-in renders correctly on the Customer self-statement page despite a NULL transaction_type
**Type:** Regression
**Priority:** Medium
**Covers:** Named consumer `SelfStatement.tsx` of the `Transactions` ledger — this row type uniquely leaves `transaction_type` unset, unlike Deposit/Withdraw/SendMoney rows which do set it
**Preconditions:** Test Customer 1 has just completed a successful cash-in of 250 tk (Test Case 1's flow)
**Steps:**
1. Navigate to the Customer self-statement page and locate the new transaction
**Expected Result:** Row displays with description "Bank Cash In (Stripe)", credit = 250, and correct running balance; the page does not crash, hide, or misfilter the row due to the missing transaction_type

---

### Test Case 17
**Title:** Verify the frontend treats a wallet-cap 208 response as a failure, not a success
**Type:** Regression
**Priority:** High
**Covers:** Named, code-comment-flagged risk (page.tsx:213-217) — axios does not throw on HTTP 208 since it's a 2xx status, so the app must explicitly detect the absence of `clientSecret` to catch this soft failure
**Preconditions:** Test Customer 1, balance = 9,950 tk
**Steps:**
1. On Step 1 of the UI, enter amount `100` and submit
**Expected Result:** UI displays "Limit exceeded. You can cash in a maximum of 50.00 tk." as an inline error and remains on Step 1; it does **not** advance to Step 2 (which would imply the 208 was misread as success)

---

## Bug Candidates Found During Analysis (out of scope for this test-design doc)

Per this project's `test-design` skill rule against bug-claim bleed, these are **not** test cases above — they are defect hypotheses surfaced while reading the code. All three have since been through adversarial `qa-agent-advocate` review (Bug Review Mode). None were rejected; each is capped at `STRONG_POTENTIAL_DEFECT` (not `CONFIRMED_DEFECT`) per this project's rule that a live-app-dependent finding can't be confirmed from static reading alone — each has an explicit "Recommended next action" (a live repro or DB query) that would elevate it.

1. **`confirmCashIn` never re-checks role/status** (only `createPaymentIntent` does, controller.js:44-49 vs. 136-192) — a customer suspended between create-intent and confirm still gets credited. — **STRONG_POTENTIAL_DEFECT, confidence 78.** Contradicting evidence: create-intent's own explicit status gate, and the suspension-email copy ("you will not be able to perform any transactions," `user.controller.js:311`) directly promises otherwise. Counter-argument on file: README §6.8's enforcement table only names 4 controllers (Deposit/Withdraw/SendMoney/Payment) — Stripe cash-in isn't listed, so this may be a documented scope boundary rather than an oversight. Recommended next action: live repro (suspend mid-flow, confirm the ledger write still happens) + clarify with the team whether §6.8 was meant to cover this flow.
2. **No Stripe webhook exists anywhere in the backend** — confirmed via `grep -rni webhook` (zero matches) and no scheduler/cron found either. If the client-side `/confirm` call is lost after the card is successfully charged, there's no automated recovery. — **STRONG_POTENTIAL_DEFECT, confidence 60** (softer than #1/#3 — no requirement anywhere promises webhook-based reconciliation, so this is closer to an architecture gap than a contradicted promise). Recommended next action: live repro (interrupt confirm post-charge, diff Stripe dashboard vs. `Transactions` table) + confirm whether a manual ops/support reconciliation process exists outside this repo.
3. **Confirm-failure message references a Transaction ID never shown to the user** — `handlePaymentSuccess`'s catch block (page.tsx:250-254) has `paymentIntentId` in scope but never calls `setTrnxId(paymentIntentId)` or renders it, so "contact support with your Transaction ID" points to nothing on screen. — **STRONG_POTENTIAL_DEFECT, confidence 82** (highest confidence of the three — self-contained UI logic contradiction, not an inferred external expectation). One-line fix available: include `paymentIntentId` directly in the error message or render it alongside the Alert. Recommended next action: live repro (force confirm to fail post-charge, screenshot the Step 2 banner).
