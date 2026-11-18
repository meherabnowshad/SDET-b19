# Deposit (Cash-In) — Test Cases

**Feature under test:** `POST /transaction/deposit`
**Source:** `dMoney/dmoney-transaction-api/controllers/transactions/deposit.controller.js`
**Consumer:** Agent Cash-In page — `dMoney/dmoney-web-react/src/app/agent/cash-in/page.tsx`

## Scope Summary

The endpoint supports **two flows** distinguished by whether `from_account` resolves to the SYSTEM account: (1) **SYSTEM → regular Agent** top-up (no commission, no min/max, only balance-sufficiency enforced) and (2) **regular Agent → Customer** cash-in (2.5% agent commission, 10–10,000 tk amount range, and a hard 10,000 tk customer wallet cap enforced via row-locked reads). Key decision points: caller-owns-`from_account` authorization, both-accounts-active status checks, role validation on both legs (differs per flow), amount range/cap math, and balance sufficiency — all wrapped in a `FOR UPDATE` transaction to prevent concurrent over-spend/over-cap. Named regression risk: the frontend's Axios layer does not treat HTTP `208` as an error, so `agent/cash-in/page.tsx` has to special-case it explicitly — any soft-failure (insufficient balance, cap exceeded) must still render as an error, not a success, in the UI.

---

### Test Case 1
**Title:** Verify successful deposit from a regular Agent to a Customer within amount/cap limits
**Type:** Functional
**Priority:** High
**Covers:** Core business promise — Agent→Customer cash-in with 2.5% agent commission (deposit.controller.js:161-251)
**Preconditions:**
- Logged in as Test Agent (`agent@dmoney.com` / `01686606901`, role Agent, status active)
- Target Customer `01686606902` (Customer 1), status active
- Record both accounts' current balances via `GET /transaction/balance/:account` before the test (Agent balance ≥ 500 tk; Customer balance ≤ 9,500 tk so the cap isn't hit)
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": 500 }`
2. `GET /transaction/search/:trnxId` using the returned `trnxId`
**Expected Result:**
- `201` response: `{ message: "Deposit successful", trnxId: "TXN..." (13 chars), commission: 12.5, currentBalance: <preTestAgentBalance - 487.5> }`
- Ledger has exactly 2 rows for `trnxId`: Agent row `debit=500, credit=12.5, description="Deposit Commission"`; Customer row `debit=0, credit=500, description="Deposit"`

---

### Test Case 2
**Title:** Verify successful SYSTEM → Agent top-up with no commission applied
**Type:** Functional
**Priority:** High
**Covers:** SYSTEM top-up flow — no commission, no min/max amount check (deposit.controller.js:85-156)
**Preconditions:**
- Logged in as SYSTEM (`system@dmoney.com`, phone `SYSTEM`, bypasses OTP)
- Target Agent `01686606901` (Test Agent), status active
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "SYSTEM", "to_account": "01686606901", "amount": 20000 }` (an amount above the 10,000 tk Agent→Customer cap, to prove it's not enforced here)
**Expected Result:**
- `201` response: `{ message: "SYSTEM deposit to Agent successful", trnxId: "TXN...", amount: 20000, agentBalance: <preTestAgentBalance + 20000> }`
- Ledger has 2 rows for `trnxId`: SYSTEM row `debit=20000, credit=0, description="System Deposit to Agent"`; Agent row `debit=0, credit=20000, description="Top-up from SYSTEM"`

---

### Test Case 3
**Title:** Verify deposit succeeds at the exact minimum boundary amount (10 tk)
**Type:** Functional
**Priority:** Medium
**Covers:** Boundary of `amt < minAmount` check — 10 is inclusive, not rejected (deposit.controller.js:173)
**Preconditions:**
- Logged in as Test Agent `01686606901`, balance ≥ 10 tk
- Customer `01686606902` balance ≤ 9,990 tk
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": 10 }`
**Expected Result:**
- `201` — deposit succeeds (not rejected as below-minimum); `commission: 0.25`

---

### Test Case 4
**Title:** Verify deposit is rejected when amount is outside the Agent→Customer range (10–10,000 tk)
**Type:** Negative
**Priority:** High
**Covers:** Amount range validation `amt < minAmount || amt > maxLimit` (deposit.controller.js:173-177), seeded from `Commissions` row `('Deposit', ..., min_txn_amount=10.00, max_txn_amount=10000.00)`
**Preconditions:**
- Logged in as Test Agent `01686606901`
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": 9 }`
2. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": 10001 }`
**Expected Result:**
- Both calls return `400`: `{ "message": "Minimum deposit amount is 10 tk and maximum deposit amount is 10000 tk" }`

---

### Test Case 5
**Title:** Verify the Customer 10,000 tk wallet cap is enforced, both when already at cap and when an amount would exceed remaining headroom
**Type:** Negative
**Priority:** High
**Covers:** `CUSTOMER_CAP_EXCEEDED` and `AMOUNT_EXCEEDS_REMAINING_LIMIT` branches (deposit.controller.js:208-217) — core wallet-cap business promise
**Preconditions:**
- Logged in as Test Agent `01686606901` with sufficient balance for both steps
- Step 1: Customer `01686606902` balance = exactly 10,000.00 tk
- Step 2: Customer `01686606902` balance = 9,800.00 tk (200 tk of headroom remaining)
**Steps:**
1. With customer at 10,000.00 tk, `POST /transaction/deposit` with `amount: 10`
2. With customer at 9,800.00 tk, `POST /transaction/deposit` with `amount: 500`
**Expected Result:**
- Step 1: `208` — `{ "message": "Limit exceeded. You cannot deposit any more to this account." }`
- Step 2: `208` — `{ "message": "Limit exceeded. You can deposit a maximum of 200.00 tk to this customer." }`

---

### Test Case 6
**Title:** Verify insufficient Agent balance is rejected by the API and correctly surfaced as an error (not success) in the Cash-In UI
**Type:** Regression
**Priority:** High
**Covers:** `INSUFFICIENT_BALANCE` branch (deposit.controller.js:195-199) + named frontend risk: Axios does not throw on `208` (`agent/cash-in/page.tsx:85-89` explicitly checks `res.status === 208`)
**Preconditions:**
- Logged in as Test Agent `01686606901` via the web app, current balance verified to be less than 100 tk
**Steps:**
1. On `/agent/cash-in`, enter Customer `01686606902` and amount `100` (greater than the Agent's current balance), click "Cash In"
**Expected Result:**
- API responds `208`: `{ "message": "Insufficient balance", "currentBalance": <agentBalance> }`
- UI shows the red error `Alert` with that message — the green success panel (Transaction ID / Total Amount / Current Balance) must NOT render

---

### Test Case 7
**Title:** Verify deposit is rejected when from_account and to_account are the same
**Type:** Negative
**Priority:** Medium
**Covers:** `from_account === to_account` check (deposit.controller.js:58-60)
**Preconditions:**
- Logged in as Test Agent `01686606901`
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606901", "amount": 100 }`
**Expected Result:**
- `400` — `{ "message": "From account and to account cannot be the same" }`

---

### Test Case 8
**Title:** Verify a non-numeric or non-positive amount is rejected independently of frontend validation
**Type:** Negative
**Priority:** Medium
**Covers:** Backend-only guard `!Number.isFinite(amt) || amt <= 0` (deposit.controller.js:29-31) — protects the endpoint when called directly (e.g. via API client), bypassing the React form's own validation
**Preconditions:**
- Logged in as Test Agent `01686606901`; call the API directly (not through the UI form)
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": -50 }`
**Expected Result:**
- `400` — `{ "message": "Amount must be a valid number greater than 0" }`

---

### Test Case 9
**Title:** Verify an Agent cannot initiate a deposit using another account's phone number as from_account
**Type:** Security
**Priority:** High
**Covers:** Caller-owns-`from_account` authorization check, case-insensitive on phone/email (deposit.controller.js:44-56) — prevents one Agent moving another account's (including SYSTEM's) funds
**Preconditions:**
- Logged in as Test Agent (`agent@dmoney.com` / `01686606901`) — JWT `identifier` = `agent@dmoney.com`
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "SYSTEM", "to_account": "01686606901", "amount": 100 }` (attempting to move SYSTEM's funds while authenticated as the Test Agent)
**Expected Result:**
- `403` — `{ "message": "Unauthorized: you can only initiate transactions from your own account" }`

---

### Test Case 10
**Title:** Verify role validation on both legs of the regular Agent→Customer flow
**Type:** Security
**Priority:** Medium
**Covers:** `from_account` must be role Agent (deposit.controller.js:71-75) and `to_account` must be role Customer (deposit.controller.js:164-168) — prevents non-Agents initiating deposits and prevents misrouting funds to Agent/Merchant/Admin accounts
**Preconditions:**
- Customer 1 account `01686606902` (role Customer, active)
- Test Agent `01686606901` and Test Merchant `01686606905` (role Merchant, active)
**Steps:**
1. Logged in as Customer 1, `POST /transaction/deposit` with `{ "from_account": "01686606902", "to_account": "01686606901", "amount": 100 }`
2. Logged in as Test Agent, `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606905", "amount": 100 }`
**Expected Result:**
- Step 1: `400` — `{ "message": "Invalid from account. Only an Agent or the SYSTEM account can initiate a deposit." }`
- Step 2: `400` — `{ "message": "To account must be a Customer account. A regular Agent can only deposit to a Customer." }`

---

### Test Case 11
**Title:** Verify deposit is rejected when the target Customer account is not active
**Type:** Security
**Priority:** Medium
**Covers:** `to_account` status-active enforcement (deposit.controller.js:66-68), per BRD §6.8 transaction-eligibility rules
**Preconditions:**
- A Customer account with `status = "suspended"` or `"pending"` (e.g., Admin sets Customer 1 `01686606902` to `suspended` via `PATCH /user/update/:id`, then reverts after the test)
- Logged in as Test Agent `01686606901`
**Steps:**
1. `POST /transaction/deposit` with `{ "from_account": "01686606901", "to_account": "01686606902", "amount": 100 }`
**Expected Result:**
- `403` — `{ "message": "To account is not active. Please contact admin." }`
