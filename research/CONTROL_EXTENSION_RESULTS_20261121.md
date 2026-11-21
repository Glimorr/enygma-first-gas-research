# Rayls WQ3 follow-on methodological controls (21 November 2026)

STATUS: Two new noncommitting controls completed, faucet-first independent cohort pre-registered but not executed. This file is a separate follow-on research record and **does not change the original frozen 140-source-file release** or claim a second lifecycle.

## 1. Public fee timing placebo (completed; PASS for precisely stated diagnostic)
- Script: `qa/verify_private_fee_shifted_nulls.py` (read-only live JSON-RPC; original evidence unchanged).
- Raw report: `evidence/public-rpc/controlled/private-fee-temporal-shift-placebo-verified.json`.
- Positive cases: three already authenticated private operations at blocks 24744028, 24747924, and 24760126. Their pre-fixed 38-block windows [source−12,source+25] each contained precisely one relevant vault-nullifier tx and one reported relayer-to-treasury fee payout with the expected amount.
- Placebo windows: 10 shifts per private operation, fixed offsets [−1024,−768,−512,−256,−128,+128,+256,+512,+768,+1024] (30 equal-width windows). **0/30 contained a reported-treasury payout**, **0/30 contained a vault-nullifier transaction**, and **0/30 had an immediate one-to-four-block vault/payout pair**. Each log scan was fresh public RPC, not copied from earlier receipts.
- Interpretation: This is a valid **sparse-environment sanity check** establishing that positive windows were not surrounded by routine frequent same-address payouts during the selected nearby periods. It is **not a matched-active-traffic comparison**, independent random sample, classifier false-positive rate, causal cryptographic link, or proof that the private principal is public. Official Rayls documentation already describes per-transaction fee-share payouts. Do not say the feature was unknown or that treasury matching deanonymizes users.

## 2. Genuine insufficient-balance UI negative control (completed; PASS for UI guard only)
- Existing research-controlled Dev wallet `@rq3dev26`, official connected Enygma Public testnet.
- Valid registered recipient `@devil` resolved by official UI.
- Owner wallet displayed **3 shielded RLS** before input.
- Typed **15 RLS** into Shielded Send as a read-only form preview. The official app displayed `That's more than your shielded balance.` and the `Send 15 RLS` button was **disabled**.
- The button was never clicked, no passkey transaction authorization occurred, and **no transaction was broadcast**.
- Sanitized report: `evidence/public-rpc/controlled/dev-overspend-guard-readonly-verified.json`. Owner screenshot (no recovery phrases) `evidence/ui-feasibility/dev-overspend-ui-disabled-20261121.png`.
- Evidence class: **UI-level balance validation only**; does not prove Groth16 circuit failure or contract-level rejection if someone were to submit malformed or malicious proofs. The three historical read-only before/after replay simulations remain independent contract-level control evidence.

## 3. Current faucet capability (read-only documented, next experiment pending)
- Logged in to current official testnet UI as `@rq3dev26` and navigated to `/faucet` without submitting a claim.
- The UI states: shielded **250 RLS** and shielded **10 USDr**, sent straight into shielded balance, plus separate *public* alternatives of 250 RLS and 10 USDr, once **every 3 hours**. This contrasts with the current public Rayls product page/blog amounts of 50 RLS/5 USDr hourly; document UI current-time observation instead of claiming immutable settings.
- The official `/auditor-demo` says **Demo, sample data, no wallet**; this cannot verify our actual 3 RLS payment. Official `/auditor` requires a privileged auditor wallet, which we do not possess. Do not claim real auditor decryption from a demo.
- Best next high-value case: **fresh separate passkey identity**, capture zero-public-funding baseline before any faucet request, then use **Shielded RLS Faucet Get**, register, privately send 3 RLS to `@rq3dev26`, independently check current public balances/nonce and Dev's receiving-wallet shielded balance (expected 3→6 RLS if no intervening activity). The human operator must approve genuine passkey actions; no unauthorized signing or bypass is necessary.
- Exact preregistration and alternative outcomes: `research/FAUCET_FIRST_COMPARATOR_PREREG_20261121.md`. This new case is a **different funding-route cohort**, not an exact invitation lifecycle replication.
- If direct faucet requires public funding/registration, preserve that as a concrete negative result; do not force-fit the original hypothesis.

## Evaluator recommendation
Prioritize the one new faucet-first account to challenge how general the existing zero-public-funding claim is. Do not expend time repeating an identical 30 RLS invite just to increase n by one unless a genuine unresolved branch emerges. Do not seek or publish live auditor private keys. The extra negative control and 30 placebo windows can be cited in the eventual supplementary article update if accurately bounded. No new chain transactions have been signed as part of these controls.

The original frozen research release remains at https://glimorr.github.io/enygma-first-gas-research/evidence/rayls-wq3-final-evidence.zip ; independently verified original hash 49e897c712e7d452700be2dca369f3988ca46c5316f0bad306fef292f335f97a.
