# Exploratory Testing Report

## 1. Document Information

| Field | Value |
|---|---|
| Project Name | DMoney — Mobile Financial Service (MFS) Platform |
| Application Name | dmoney-transaction-api (backend REST API) |
| Version | Not tagged in repo — commit/branch state as of test date (no `version` field in `package.json`) |
| Tester | Claude (AI QA Agent), on behalf of Nowshad |
| Test Date | 2026-07-28 |
| Environment | Local development — API on `http://localhost:4000` (Node.js/Express + Sequelize), MySQL database `Nowshad` on `localhost`, Stripe **test-mode** key |

## 2. Objective

To perform exploratory testing of dMoney's transaction-related functionality — Deposit, Withdraw, Send Money, Payment, Admin-to-SYSTEM Top-up, and Stripe Bank Cash-In — with the goal of independently discovering and verifying commission structures, transaction limits, business rules, and defects, rather than assuming documented behavior is accurate. Every rule stated as "Verified" below was confirmed either by reading the executing source code directly, by querying the live database, or by issuing real HTTP requests against the running API and observing actual responses/ledger effects. Anything not confirmed this way is explicitly marked **Not Verified**.

## 3. Scope

- Deposit (SYSTEM → Agent, and Agent → Customer)
- Withdraw (Customer/Merchant → Agent)
- Send Money (Customer → Customer)
- Payment (Customer/Agent → Merchant), including discount-code handling
- Admin → SYSTEM top-up
- Stripe Bank Cash-In (create-intent + confirm)
- Supporting flows exercised because they gate transactions: registration, OTP login/verify, JWT + partner-key auth, balance/statement/limit read endpoints

Out of scope: frontend (dmoney-web-react) UI testing, load/performance testing, the legacy CRA app under `dmoney-reactjs/`.

## 4. Testing Approach

This was a code-assisted exploratory pass, not a black-box-only test:

1. Read the actual controller/service source for every transaction type (`controllers/transactions/*.js`, `services/limitChecker.js`, `services/getBalance.js`, `sequelizeModel/Commission.js`) to understand exactly what each endpoint does, rather than guessing from documentation.
2. Queried the live MySQL database directly (`Commissions`, `TransactionLimits`, `Roles`, `Users`, `Transactions` tables) to pull the actual configured fee/limit values in effect, instead of assuming the BRD's documented numbers still hold.
3. Logged in as the pre-seeded test accounts (Admin, Agent, Customer — password `1234`, confirmed from the seeding code in `sequelizeModel/Users.js`) using the real OTP flow (reading the OTP directly from the `Users.otp` column, since the server always persists it regardless of email delivery).
4. Executed real HTTP requests (`curl`) against the running local API for positive, negative, and boundary cases, and cross-checked the resulting ledger rows in MySQL after each call to confirm the money movement actually matched what the API claimed.
5. Where a suspicious code pattern was found (e.g. string-concatenated SQL, missing ownership checks), built a live proof-of-concept against the running system rather than reporting it as a theoretical risk.

Assumption stated up front: this is a local dev database with pre-existing seed/test data of unknown full history; where historical ledger rows contradicted the currently-executing code, the current code (re-verified with a fresh live transaction) was treated as authoritative, and the discrepancy is called out separately rather than silently ignored.

---

## 5. Transaction-wise Findings

### Deposit

#### Overview
Two distinct flows share one endpoint, `POST /transaction/deposit` (requires Agent-role JWT + `X-AUTH-SECRET-KEY`):
- **SYSTEM → Agent**: `from_account` is the literal account `SYSTEM`; funds a regular Agent. No fee, no min/max.
- **Agent → Customer**: a regular Agent tops up a Customer's wallet; Agent earns a commission; min/max amount and a customer wallet cap apply.

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| DEP-01 | Agent deposits valid amount to active Customer | POST deposit, agent(01686606901)→customer(01686606902), amt=50 | 201, commission returned, ledger updated | `{"message":"Deposit successful","trnxId":"TXN9NLCOZO8J8","commission":1.25,"currentBalance":12719.5}` | Pass (functionally) — see Bug DEP-BUG-01 |
| DEP-02 | Amount below minimum (5 tk, min=10) | POST deposit amt=5 | 400 with min/max message | `{"message":"Minimum deposit amount is 10 tk and maximum deposit amount is 10000 tk"}` | Pass |
| DEP-03 | Negative / zero / non-numeric amount | amt=-50, 0, "abc" | 400 "Amount must be a valid number greater than 0" | Confirmed identical message for all three | Pass |
| DEP-04 | from_account == to_account | Same phone both sides | 400 | `{"message":"From account and to account cannot be the same"}` | Pass |
| DEP-05 | Customer role attempts to initiate a deposit | Customer JWT, from=own account | 400 role-restriction message | `{"message":"Invalid from account. Only an Agent or the SYSTEM account can initiate a deposit."}` | Pass |
| DEP-06 | Agent deposits to another Agent (invalid toRole) | to_account = a second Agent | 400 "must be Customer" | Got `{"message":"To account is not active. Please contact admin."}` because that Agent's status happened to be `pending` — status check runs before the role check | Pass (different but valid gate; order-of-checks noted) |
| DEP-07 | to_account does not exist | Random 11-digit phone | 404 | `{"message":"To Account does not exist"}` | Pass |
| DEP-08 | Customer JWT tries to spend from an Agent's account it doesn't own | from_account = Agent's phone, but auth token = Customer | 403 ownership violation | `{"message":"Unauthorized: you can only initiate transactions from your own account"}` | Pass |

#### Commission Structure

| Scenario | Commission Type | Amount/Percentage | Business Rule | Verified |
|---|---|---|---|---|
| Agent → Customer deposit | Agent Commission | 2.5% of deposit amount (`percentage`, rate 0.025) | Credited to the depositing Agent | ✅ Verified (DB `Commissions` row id=1, and live test: 50 tk deposit → 1.25 commission) |
| SYSTEM → Agent deposit | None | 0 | No fee on internal SYSTEM funding of agents | ✅ Verified (code path has no commission/fee logic) |

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Minimum deposit amount | 10 tk | Agent → Customer flow only | ✅ Verified (DB `min_txn_amount`=10, live 5 tk rejected) | SYSTEM→Agent flow has no min/max at all |
| Maximum deposit amount (per txn) | 10,000 tk | Agent → Customer flow only | ✅ Verified (DB `max_txn_amount`=10000) | |
| Customer wallet cap | 10,000 tk (same value as max_txn_amount, reused) | Customer's **total balance**, not just this transaction | ✅ Verified via code (`customerBalance >= maxLimit` check in `deposit.controller.js`) | The per-transaction max and the customer's absolute wallet cap are driven by the *same* DB field — a rate change to one silently changes the other. Not Verified whether this is intentional. |

#### Boundary Value Testing

| Test | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Just below minimum | 9.99 tk | Rejected | Not Verified — only integer 5 tk tested | Not Verified |
| Exactly minimum | 10 tk | Accepted | Not Verified (ran out of scope time) | Not Verified |
| Just above maximum | 10,001 tk | Rejected | Not Verified directly, but confirmed via code identical range check to min | Not Verified (live) |

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Negative amount | Rejected 400 | `Amount must be a valid number greater than 0` | Pass |
| Zero amount | Rejected 400 | Same as above | Pass |
| Non-numeric amount | Rejected 400 | Same as above | Pass |
| Deposit to inactive account | Rejected 403 | `To account is not active. Please contact admin.` | Pass |
| Deposit from unauthenticated request | Rejected 401 | `No Token Found!` | Pass |

#### Business Rules Discovered
* An Agent can only deposit into a Customer account (never Merchant, Admin, or another Agent) in the "regular" flow.
* SYSTEM can only fund a regular Agent, never a Customer/Merchant directly.
* The customer wallet cap is enforced as `remaining = maxLimit - currentBalance`; if the deposit would exceed it, the API tells the caller the exact remaining headroom (e.g. "You can deposit a maximum of X tk").
* Account status (`active`/`pending`/`suspended`) is checked for **both** sides before the role check runs, so a `pending` counterpart account produces a status error, not a role error, even when the role would also have been wrong.

#### Potential Bugs

| Bug ID | Description | Severity | Priority | Reproducible |
|---|---|---|---|---|
| DEP-BUG-01 | **Ledger does not balance — Agent commission is minted from nothing.** For an Agent→Customer deposit of 50 tk with 2.5% commission (1.25 tk), the code writes: Agent row `debit=50, credit=1.25`; Customer row `credit=50`. Total debits=50, total credits=51.25. The 1.25 tk commission is credited to the Agent without being debited from anyone (not SYSTEM, not the customer) — money is created out of thin air on every single deposit. Verified live: `SELECT SUM(debit),SUM(credit) FROM transactions WHERE trnxId='TXN9NLCOZO8J8'` → debit=50, credit=51.25. This directly violates the project's own stated design principle that "every financial operation must write matched, balanced ledger rows." | Critical | P1 | Yes — reproducible on every Agent→Customer deposit |

#### Risks
Uncontrolled money creation on every deposit means the platform's total float (sum of all balances) grows without bound and without any funding source — this would misstate SYSTEM/regulatory reserve accounting in a real MFS product and could mask fraud or reconciliation errors.

#### Recommendations
Fund the Agent's deposit commission by debiting it from the SYSTEM account (as is already correctly done for SendMoney/Payment fees), so every trnxId's total debits equal its total credits.

---

### Withdraw

#### Overview
`POST /transaction/withdraw` — Customer or Merchant withdraws cash through an Agent. Agent earns a commission; SYSTEM collects a separate service fee from the customer.

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| WD-01 | Valid withdraw, Customer→Agent, 100 tk | Live POST | 201, fee shown, balance decremented by amt+fee | `{"message":"Withdraw successful","trnxId":"TXN0Q13BD7MBI","fee":5,"currentBalance":8865.5}` | Pass (functionally) — see Bug WD-BUG-01 |
| WD-02 | Amount below minimum (5 tk, min 10) | Live POST | 400 | `{"message":"Minimum withdraw amount is 10 tk","currentBalance":8835.5}` | Pass |
| WD-03 | Withdraw larger than remaining daily limit | amt=99,999,999 | 400, limit message (limit check runs before balance check) | `{"message":"Daily amount limit exceeded. You can spend at most 4815.00 Tk more (incl. fees) this daily period (limit: 5000 Tk, used: 185.00 Tk).","details":{...}}` | Pass |
| WD-04 | to_account is a Customer, not an Agent | Live POST | 400 | `{"message":"To Account is not agent account"}` | Pass |

#### Commission Structure

| Scenario | Commission Type | Amount/Percentage | Business Rule | Verified |
|---|---|---|---|---|
| Withdraw service fee (to SYSTEM) | Service Fee | 1% of amount, floored at min 5 tk | Charged to the customer (`from_account`), added on top of the withdrawn amount | ✅ Verified — 100 tk withdraw → fee capped at 5 tk (1% of 100 = 1, floored up to min_fee 5) |
| Agent Commission | 2.5% of amount | Credited to the withdrawing Agent | ✅ Verified — 100 tk → 2.5 tk agent commission (from ledger inspection) |

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Minimum withdraw | 10 tk | All withdrawers | ✅ Verified |
| Daily outgoing cap | 5,000 tk / 10 transactions | **Customer role only** | ✅ Verified — hit both the amount ceiling and, separately, drove the count to exactly 10 and got the count-limit message on the 11th attempt | Shared pool — see Business Rules below |
| Monthly outgoing cap | 50,000 tk / 50 transactions | **Customer role only** | ✅ Verified via DB row (`TransactionLimits` id=2) | Not independently exercised live (would require 50 days of data or clock manipulation) |
| Merchant/Agent withdraw limits | None found | Merchant/Agent | ✅ Verified (absence) — `checkCustomerLimits` is only called `if (fromRole === "Customer")`; the `TransactionLimits` table has zero rows for role Agent or Merchant | — |

#### Boundary Value Testing

| Test | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Exactly at daily count cap | 10th transaction of the day | Allowed | Allowed (balance 8460.5 after) | Pass |
| One past daily count cap | 11th transaction of the day | Rejected with count-limit message | `{"message":"Daily transaction limit reached. You have used all 10 allowed transactions for this daily period.","details":{"period":"daily","usedAmount":560,"usedCount":10,"maxAmount":5000,"maxCount":10,"remainingAmount":4440,"remainingCount":0}}` | Pass |

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Amount exceeding daily limit | Rejected 400 with limit detail | Confirmed above | Pass |
| Withdraw to non-Agent account | Rejected 400 | Confirmed above | Pass |
| Withdraw below minimum | Rejected 400 | Confirmed above | Pass |

#### Business Rules Discovered
* SendMoney + Payment + Withdraw **share the same daily/monthly quota** for a Customer — `checkCustomerLimits` sums debit across all three `transaction_type`s together, not per-type. A customer who spends their whole daily budget on Send Money cannot also Withdraw that same day.
* The count limit (max 10/day) is checked **before** the amount limit; hitting either one blocks the transaction.
* Merchant withdrawals go through the same code path as Customer withdrawals but are **not** subject to any daily/monthly cap (no `TransactionLimits` row for role Merchant, and the code never calls `checkCustomerLimits` for `fromRole === "Merchant"` — confirmed by reading the `if (fromRole === "Customer")` guard).

#### Potential Bugs

| Bug ID | Description | Severity | Priority | Reproducible |
|---|---|---|---|---|
| WD-BUG-01 | **Same ledger-imbalance defect as Deposit.** Live test: Customer debited 105 (100+5 fee); Agent credited 102.5 (100+2.5 commission); SYSTEM credited 5 (fee). Total debit=105, total credit=107.5 — 2.5 tk (the agent commission) minted from nothing, identical root cause to DEP-BUG-01. | Critical | P1 | Yes |
| WD-BUG-02 | Merchant withdrawals are completely unmetered — no daily/monthly cap of any kind, unlike Customers. Whether this is intentional (Merchants are trusted business accounts) or an oversight is **Not Verified** from code/data alone — flagging as a rule needing product confirmation. | Medium | P3 | Yes (by design gap) |

#### Risks
Same reconciliation/float-integrity risk as Deposit. Unmetered Merchant withdrawals could be used to bypass the anti-money-laundering-style caps that apply to Customers.

#### Recommendations
Fix the ledger imbalance the same way as Deposit. Explicitly decide and document (or implement) whether Merchant accounts should have their own `TransactionLimits` rows.

---

### Send Money

#### Overview
`POST /transaction/sendmoney` — Customer-to-Customer transfer only. Flat SYSTEM fee, no agent/merchant commission involved.

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| SM-01 | Valid Customer→Customer transfer, 30 tk | Live POST | 201, fee=5, ledger balanced | `{"message":"Send money successful","trnxId":"TXNZLSBGPX7ZF","fee":5,"currentBalance":8880.5}` | Pass |
| SM-02 | Customer sends to a Merchant | Live POST | 400 — customer-to-customer only | `{"message":"Send money is only allowed between two Customer accounts"}` | Pass |
| SM-03 | Amount below minimum | amt=5 (min 10) | 400 | `{"message":"Minimum amount is 10 tk"}` | Pass |

#### Commission Structure

| Scenario | Commission Type | Amount/Percentage | Business Rule | Verified |
|---|---|---|---|---|
| Send Money | Service Fee | Flat 5 tk (`fee_type=flat`, not percentage) | Charged to sender, credited entirely to SYSTEM | ✅ Verified — the only flat-fee transaction type in the whole Commissions table; all others are percentage-based |

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Minimum amount | 10 tk | Sender | ✅ Verified |
| Daily/Monthly cap | Shared with Withdraw/Payment (5,000/day, 10 count; 50,000/month, 50 count) | Customer only | ✅ Verified (see Withdraw section) | |

#### Boundary Value Testing
See shared Withdraw section — the count-limit boundary (10th vs 11th transaction) was exercised using Send Money calls specifically and confirmed exact cutoff behavior.

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Send to Merchant | Rejected 400 | Confirmed above | Pass |
| Below minimum amount | Rejected 400 | Confirmed above | Pass |

#### Business Rules Discovered
* Send Money is the **only** transaction type using a flat fee rather than a percentage — worth confirming this is intentional product design vs. an inconsistency, since every other transaction type scales its fee with amount.

#### Potential Bugs
None found — this is the one transaction type whose ledger writes were verified to balance exactly (debit = credit across the trnxId) on live data. No SendMoney-specific defects identified.

#### Risks
None identified beyond the shared daily/monthly quota risk already noted under Withdraw.

#### Recommendations
None beyond what's captured under the shared limit-pool business rule above.

---

### Payment

#### Overview
`POST /transaction/payment` — Customer or Agent pays a Merchant. Supports an optional discount code.

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| PAY-01 | Valid Customer→Merchant payment, 40 tk | Live POST | 201, fee=5 (1% floored), balanced ledger | `{"message":"Payment successful","trnxId":"TXNASL2LFEO2E","fee":5,"currentBalance":8835.5}` | Pass (ledger balanced; but see PAY-BUG-01 for the commission table) |
| PAY-02 | Payment to a non-Merchant (Customer) | Live POST | 400 | `{"message":"From A/C should be customer or agent and To A/C should be merchant type"}` | Pass |
| PAY-03 | Wrong discount code | discount_code="WRONGCODE" | Discount silently ignored, full amount charged | `{"message":"Payment successful",...}` — no `discountedTotal`/`discountedAmount` fields present, fee based on full 100 tk | Pass |
| PAY-04 | Correct discount code (`top5`), 50% off | discount_code="top5", discount_amount=50 | finalAmount halved, fee recalculated on discounted amount | `{"message":"Payment successful","fee":5,"discountedTotal":50,"discountedAmount":50}` | Pass |
| PAY-05 | discount_amount = 150 (>100%) | Expect rejection or floor at 0 | finalAmount computed as 100-150=-50, caught by the *minimum amount* check, not a dedicated discount-range check | `{"message":"Minimum Payment amount is 10 tk"}` | Pass (accidentally caught, not by design — see PAY-BUG-02) |
| PAY-06 | **discount_amount = -50 (negative)** | Expect rejection | finalAmount computed as 100 − (100×−50/100) = **150** — MORE than the original requested amount, and it was accepted | `{"message":"Payment successful","trnxId":"TXNPTCU7VZX1T","fee":5,"currentBalance":8520.5,"discountedTotal":150,"discountedAmount":-50}` | **FAIL** — see PAY-BUG-02 |

#### Commission Structure

| Scenario | Commission Type | Amount/Percentage | Business Rule | Verified |
|---|---|---|---|---|
| Payment service fee | Service Fee | 1% of (post-discount) amount, floored at 5 tk | Charged to payer, credited to SYSTEM | ✅ Verified |
| Merchant Commission | Configured in DB as 2.5% (`Commissions` id=6, recipient=Merchant) | **Never actually applied** | ❌ Configured but dead — merchant receives 100% of the discounted amount, 0% commission taken | ✅ Verified: `Commission.getConfig()` computes `merchantCommissionRate` but `payment.controller.js` never reads that field; live ledger for a 40 tk payment shows the merchant credited the full 40 tk, not 39.0 |

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Minimum payment amount | 10 tk (applied to **post-discount** amount) | Payer | ✅ Verified |
| Daily/Monthly cap | Shared pool with Withdraw/Send Money | Customer only (not Agent, per code: limit check gated on `fromRole === "Customer"`) | ✅ Verified — Agent-initiated payments have no cap at all | Agent can pay Merchants per business rule, but with zero spending limit |

#### Boundary Value Testing

| Test | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| discount_amount = 100 (100% off) | finalAmount → 0 | Not Verified directly (ran 150 and -50 instead) | Not Verified |
| discount_amount = 150 | Rejected | Accidentally rejected via min-amount floor, not an explicit bounds check | Pass (by coincidence) |
| discount_amount = -50 | Should be rejected — a "discount" should never increase the charge | Accepted, charge inflated 100→150 | **Fail** |

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Payment to non-Merchant | Rejected 400 | Confirmed above | Pass |
| Wrong discount code | Discount not applied | Confirmed above | Pass |
| Negative discount_amount | Rejected | Accepted, charge increased | Fail |

#### Business Rules Discovered
* Discount eligibility is gated by a **single static code** read from `process.env.DISCOUNT_CODE` (currently `top5`) — there is no discount/coupon table, no per-user or per-merchant discount, no expiry, and no cap on the percentage. The percentage itself (`discount_amount`) is fully caller-supplied with no server-side source of truth for what a valid promotion actually is.
* Agent-to-Merchant payments exist as a valid flow but carry no transaction limit of any kind.

#### Potential Bugs

| Bug ID | Description | Severity | Priority | Reproducible |
|---|---|---|---|---|
| PAY-BUG-01 | Merchant Commission configured in the `Commissions` table (2.5%, recipient=Merchant) is never read or applied by `payment.controller.js`. The DB configuration and actual system behavior disagree — anyone reading only the DB config would believe merchants pay a 2.5% commission on received payments; they do not. | High | P2 | Yes — every Payment transaction |
| PAY-BUG-02 | `discount_amount` accepts negative values and values >100 with no bounds validation. A negative value *increases* the amount charged beyond what the customer requested (verified: requested 100 tk, actually charged 150+fee). A value >100 produces a negative `finalAmount`, which is only accidentally caught by the unrelated minimum-amount check — if `minAmount` were ever configured as 0 or a very small negative-tolerant check, this would let a Merchant be credited a negative/zero amount while still consuming a real debit from the customer under certain amount combinations. | High | P2 | Yes |

#### Risks
PAY-BUG-02 is a real payment-integrity risk: a compromised or buggy frontend (or a direct API caller) can arbitrarily inflate or deflate what a customer is charged in a "discounted" payment, since the percentage is entirely client-supplied and unbounded.

#### Recommendations
* Wire the existing Merchant Commission DB rule into `payment.controller.js` (either use it, or remove the misleading DB row).
* Clamp `discount_amount` to `[0, 100]` server-side, and reject the request outright (not silently floor via an unrelated minimum-amount check) when it's out of range.

---

### Admin → SYSTEM Top-up

#### Overview
`POST /transaction/adminDeposit` — an Admin injects new money into the SYSTEM pool that agents subsequently draw from.

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ADM-01 | Non-Admin (Agent) attempts this endpoint | Live POST with Agent JWT | 403 | `{"message":"Only Admin can use this deposit endpoint"}` | Pass |
| ADM-02 | Admin deposits to an account other than SYSTEM | Not executed live (would require a second Admin-role test account authorized to test the negative path) | 400 expected per code (`toUser.phone_number !== 'SYSTEM'` check) | Not Verified (live) — confirmed only by code reading | Not Verified |

#### Commission Structure
None — by design, this is a pure money-creation entry point (legitimately, unlike Deposit/Withdraw's unintended minting).

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Minimum/Maximum | None enforced | Admin | ✅ Verified via code — only `amt > 0` is checked, no ceiling | Consistent with this endpoint being the platform's external funding source |

#### Boundary Value Testing
Not Verified — did not attempt extreme values (e.g. very large amounts, decimal precision) live for this endpoint.

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Non-admin caller | Rejected 403 | Confirmed above | Pass |

#### Business Rules Discovered
* This is the only deposit-type endpoint in the system with genuinely no balance check on the sender — by design, since Admin isn't drawing from a real balance.

#### Potential Bugs
None identified for this endpoint specifically within the scope tested.

#### Risks
Because there's no upper bound on amount, a compromised Admin credential could inject an arbitrary amount of "real" money into SYSTEM. This is arguably expected for an Admin-trusted operation, but worth confirming against the intended operational controls (e.g., should this require secondary approval in production?). Not Verified as a bug — flagged as a risk/question only.

#### Recommendations
Confirm whether this endpoint needs an amount ceiling or a maker-checker (dual approval) control given it's the platform's sole real money-creation point.

---

### Stripe Bank Cash-In

#### Overview
Two-step flow: `POST /transaction/stripe/create-intent` (validates and creates a Stripe PaymentIntent) then `POST /transaction/stripe/confirm` (verifies and writes the ledger entry).

#### Exploratory Scenarios

| Scenario ID | Test Scenario | Steps Performed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| STR-01 | Create intent, valid amount (100 tk) | Live POST | 200, clientSecret returned | `{"clientSecret":"pi_3TyCeV3foZQw5Wuu1Z2utFyl_secret_...","amount":100,"minAmount":10,"maxAmount":10000}` | Pass |
| STR-02 | Create intent, amount below minimum | amt=5 | 400 | `{"message":"Minimum cash-in amount is 10 tk"}` | Pass |
| STR-03 | Confirm with a non-existent paymentIntentId | Live POST | Graceful error | `{"message":"Failed to process cash in","error":"No such payment_intent: 'pi_fake_does_not_exist'"}` returned with **HTTP 500** | Pass (functionally handled) — see STR-BUG-01 for status-code concern |
| STR-04 | Confirm with an **already-processed** real paymentIntentId (idempotency) | Reused a historical, already-completed PI from the DB | Rejected as duplicate | `{"message":"This payment has already been processed"}` (HTTP 208) | Pass |

#### Commission Structure
None on cash-in itself — full amount is credited to the customer 1:1; the Deposit commission config is reused only to borrow its min/max, not to charge a fee here.

#### Transaction Limits

| Limit Type | Value | Applies To | Verified | Notes |
|---|---|---|---|---|
| Min/Max cash-in | 10 / 10,000 tk | Customer | ✅ Verified — reuses the Deposit commission row's `min_txn_amount`/`max_txn_amount` | |
| Wallet cap check pre-intent | Same 10,000 tk cap | Customer | ✅ Verified via code (`currentBalance >= maxAmount` check before creating the Stripe intent) | Not independently exercised live (would require pushing a customer to exactly the cap) |

#### Boundary Value Testing
Not fully exercised — did not push a customer's balance to exactly the wallet cap to test the "at capacity" rejection live.

#### Negative Test Cases

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Below minimum | Rejected 400 | Confirmed above | Pass |
| Bogus PaymentIntentId | Rejected gracefully | Confirmed above (500, not 400/404) | Pass (with status-code caveat) |
| Duplicate confirm | Rejected 208 | Confirmed above | Pass |

#### Business Rules Discovered
* Idempotency is enforced by reusing the Stripe `paymentIntentId` as the ledger's `trnxId` and checking for an existing row with that `trnxId` — a clean, verifiable idempotency design, and the one part of the codebase that correctly follows the "no duplicate financial side-effects" principle under live test.
* Anti-spoofing: the code checks `paymentIntent.metadata.customer_phone` against the authenticated caller — Not Verified live (would require a second Stripe PaymentIntent minted for a different customer), but the logic itself is present and directly readable in the source.
* Rows written by this flow have `transaction_type = NULL` (not set to `'Deposit'` or any other value), unlike every other transaction type, which is inconsistent with the rest of the schema and would make `transaction_type`-filtered reports silently miss Stripe cash-ins (confirmed by inspecting the historical `Transactions` rows for `description = 'Bank Cash In (Stripe)'`).

#### Potential Bugs

| Bug ID | Description | Severity | Priority | Reproducible |
|---|---|---|---|---|
| STR-BUG-01 | Confirming a non-existent/invalid `paymentIntentId` returns **HTTP 500** with the raw upstream Stripe error message forwarded to the client (`"No such payment_intent: '...'"`), rather than a 400/404 client error. This both mis-signals the failure class to API consumers and leaks a raw third-party error string. | Low | P3 | Yes |
| STR-BUG-02 | Stripe cash-in ledger rows never set `transaction_type` (confirmed `NULL` in existing DB rows), unlike Deposit/Withdraw/SendMoney/Payment which always tag it. Any reporting/limit logic that filters `WHERE transaction_type = 'X'` will silently exclude Stripe cash-ins. | Medium | P2 | Yes (structural, not timing-dependent) |

#### Risks
STR-BUG-02 could cause under-reporting in any future limit or analytics feature that relies on `transaction_type` to classify cash-ins.

#### Recommendations
Set `transaction_type: 'Deposit'` (or a new `'StripeCashIn'` value) on both ledger rows in `stripeCashIn.controller.js`. Map the Stripe "not found" case to a 400/404 with a generic message instead of forwarding the raw Stripe exception text.

---

## 6. Summary of All Commission Structures

| Transaction | Commission | Calculation | Conditions |
|---|---|---|---|
| Deposit (Agent→Customer) | Agent Commission | 2.5% of amount | Minted, not funded by any debit (Bug DEP-BUG-01) |
| Deposit (SYSTEM→Agent) | None | — | — |
| Withdraw | Service Fee (to SYSTEM) | 1% of amount, min 5 tk | Charged to customer |
| Withdraw | Agent Commission | 2.5% of amount | Minted, not funded by any debit (Bug WD-BUG-01) |
| Send Money | Service Fee (to SYSTEM) | Flat 5 tk | Only flat-fee transaction type in the system |
| Payment | Service Fee (to SYSTEM) | 1% of (post-discount) amount, min 5 tk | Charged to payer |
| Payment | Merchant Commission (configured) | 2.5% (DB only) | **Never applied in code** (Bug PAY-BUG-01) — merchant keeps 100% |
| Admin → SYSTEM | None | — | Pure funding entry |
| Stripe Cash-In | None | — | 1:1 credit to customer |

## 7. Summary of All Transaction Limits

| Transaction | Minimum | Maximum | Daily Limit | Monthly Limit | Notes |
|---|---|---|---|---|---|
| Deposit (Agent→Customer) | 10 tk | 10,000 tk/txn | — | — | Max txn amount doubles as the customer's absolute wallet cap |
| Deposit (SYSTEM→Agent) | None | None | — | — | |
| Withdraw | 10 tk | — | 5,000 tk / 10 txns (Customer only, shared pool) | 50,000 tk / 50 txns (Customer only, shared pool, not independently exercised) | No limit at all for Merchant/Agent withdrawals |
| Send Money | 10 tk | — | Shared with Withdraw/Payment | Shared with Withdraw/Payment | Customer-to-Customer only |
| Payment | 10 tk (post-discount) | — | Shared with Withdraw/SendMoney (Customer only) | Shared, Customer only | Agent-initiated payments have **no** limit at all |
| Admin → SYSTEM | >0 | None | — | — | Sole unconstrained money-creation point |
| Stripe Cash-In | 10 tk | 10,000 tk (reuses Deposit's config + wallet cap) | — | — | |

## 8. Overall Observations

* **Key findings**: Two systemic financial-integrity defects (Deposit and Withdraw both mint uncontrolled money equal to the agent commission on every transaction) are the most severe issues found — they were independently reproduced with fresh live transactions and cross-checked against raw ledger SQL, not inferred from documentation.
* **Missing validations**: `discount_amount` in Payment has no bounds check; `phone_number` at registration has no character-set/format validation (only a length check), which directly enabled a working SQL injection PoC (see Security below).
* **Inconsistencies**: The DB-configured Merchant Commission for Payment is silently unused; the legacy `GET /transaction/limit/:account` endpoint computes an entirely different, hardcoded (10,000) limit definition than the one actually enforced by `checkCustomerLimits`, which would mislead any client relying on it; Stripe cash-in rows omit `transaction_type`.
* **Security observations** (all confirmed live against the running local instance, not theoretical):
  - **Critical — SQL Injection**: `services/getBalance.js` builds its balance query via raw string concatenation (`"...account='" + account + "'"`). Because registration's `phone_number` field only enforces `length === 11` with no format restriction, an attacker can self-register an account with an 11-character SQL-metacharacter payload as their phone number (e.g. `zz'OR'1'='1`) and then query `/transaction/balance/<that literal string>` to inject arbitrary SQL into the `WHERE` clause. Live PoC: this returned `10000335.5`, which exactly matched `SELECT SUM(credit)-SUM(debit) FROM transactions` (the entire ledger's grand total) instead of the ~0 balance a brand-new account should have — proving the injected `OR '1'='1'` bypassed the intended per-account filter. This is reachable by any registered user (registration is public, unauthenticated) with a valid JWT for *any* account, combined with the IDOR below.
  - **High — Broken Access Control / IDOR**: None of `GET /transaction/balance/:account`, `GET /transaction/statement/:account`, or `GET /transaction/limit/:account` verify that the authenticated caller owns the requested `:account`. Live PoC: a Customer's JWT successfully retrieved the **Admin** account's balance (`-5000`) and another Customer's full transaction statement, neither of which belong to the caller.
  - **High — Missing role restriction on transaction ledger**: `GET /transaction/list` requires only a valid JWT + partner key — no role check. Live PoC: a Customer JWT retrieved the platform-wide transaction list (145 total records across all users, all account types) with no filtering. Any registered Customer can browse every other user's and every other role's transaction history.
  - Password hashing is unsalted SHA-256 (confirmed in `utils/hash.js`) — a rainbow-table/pre-computation risk for weak passwords, though this matches CLAUDE.md's note that the BRD's "plain text" claim is outdated; SHA-256-without-salt is still a materially weaker choice than bcrypt/argon2.
  - The OTP dev-bypass (`?env=dev` + `DEFAULT_OTP` env var) exists in code but is currently inert because `DEFAULT_OTP` is unset in both `.env` and `.env.example` — confirmed not exploitable in this environment, but flagged as a latent risk if that variable is ever set in a shared/staging environment without also restricting the bypass to non-production.
* **Usability observations**: Error messages are generally clear and specific (e.g. exact remaining limit amounts, exact minimums) — a genuine strength found during testing. The one exception is Stripe's raw error passthrough (STR-BUG-01).

## 9. Recommendations

1. **(P1 — Critical) Fix the ledger-imbalance bug in Deposit and Withdraw.** Fund agent commissions by debiting SYSTEM, matching the pattern already correctly used in SendMoney and Payment. This is the single highest-impact defect found — it currently manufactures money on every deposit/withdrawal.
2. **(P1 — Critical) Fix the SQL injection in `services/getBalance.js`.** Replace string concatenation with a parameterized query (`sequelize.query(..., { replacements: [account] })`), matching the pattern already used correctly elsewhere in the same codebase (e.g. the `FOR UPDATE` balance locks in the transaction controllers). Additionally add format validation (numeric-only) to `phone_number` at registration.
3. **(P1 — High) Add ownership checks to `/transaction/balance/:account`, `/transaction/statement/:account`, and `/transaction/limit/:account`**, and a role check (e.g. Admin-only, or self-only) to `/transaction/list`.
4. **(P2 — High) Either wire up or remove the dead Merchant Commission rule** for Payment, and **bound `discount_amount` to `[0, 100]`** with an explicit rejection rather than relying on the minimum-amount check as an accidental backstop.
5. **(P2 — Medium) Set `transaction_type` on Stripe cash-in ledger rows**, and **replace the legacy `/transaction/limit/:account` endpoint's hardcoded 10,000/description-based logic** with one that reflects the real `TransactionLimits`-driven rule, or remove it to avoid misleading API consumers.
6. **(P3) Decide and document** whether Merchant/Agent accounts are intentionally exempt from daily/monthly limits, and whether the Admin→SYSTEM top-up should have an amount ceiling or dual-approval control.
7. Several scenarios were marked **Not Verified** above (exact boundary values for Deposit min/max, monthly limit exhaustion, Stripe wallet-cap-at-capacity, Admin-deposit-to-wrong-account) due to time/practicality constraints (e.g., needing 50 days of transaction history, or a second controlled test account) — these are recommended as the next round of exploratory testing rather than assumed to pass.
