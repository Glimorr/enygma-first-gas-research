# Two onboarding routes, two completed private payments

**Independent Rayls Enygma Public testnet extension, 21 November 2026**  
**Chain ID:** 7295799 • **Evidence class:** controlled wallets + live RPC + owner-wallet observations.  
**Scope:** two different funding-route lifecycles, not two independent reproductions of the same zero-funded treatment.

## Primary comparison

| Verified stage | A: invitation-first @devil | B: public faucet-first @rq3faucet26 |
|---|---|---|
| Fresh-passkey public balance before first funds | Public RLS/USDr/native all 0; nonce 0 | Public RLS/USDr/native all 0; nonce 0 at block 24,765,718 |
| Initial receipt route | Private 30 RLS invitation link after funded @god shielded 40 | **Public** RLS 250 and USDr 10 + native 10; public faucet transfer receipts |
| Initial identity registration | @devil in block 24,748,136; **0 RLS** public relayer fee | @rq3faucet26 in block 24,766,266; **7.19695668 public RLS** registration fee |
| Source wallet public RLS at private-send stage | **0**, verified before/after claim, registration and send | **219.27724268**, following public 20 RLS shield and 3.52580064 RLS fee |
| Public deposit into vault | No public deposit by @devil; used existing invitation notes | 20 RLS visibly transferred from @rq3faucet26 to SharedVault |
| Private sender wallet operation | 3 RLS to @rq3dev26 confirmed by owner UI | 3 RLS to @rq3dev26 confirmed by owner UI |
| Private send mined | Block **24,760,126**, `0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8` | Block **24,767,795**, `0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb` |
| Public vault event topology | 1 Nullifier, 3 Commitments, 3 EncryptedNotes | 1 Nullifier, 3 Commitments, 3 EncryptedNotes |
| Owner recipient independently reconnected | @rq3dev26 wallet **3 shielded RLS** after first payment | Same controlled @rq3dev26 wallet **6 shielded RLS** after second payment, a further +3 |
| Distinct reported-treasury payout | 0.576 RLS in block 24,760,130, four blocks later | 0.576 RLS in block 24,767,799, four blocks later |
| Gross private send fee implied by treasury formula | 4.416 RLS, wallet rounded 4.42 | 4.416 RLS, wallet rounded 4.42 |
| Original calldata historical state test | pre-mined `eth_call` success, at/after mined reverts | pre-mined success, at/after mined reverts; all were **read-only**, with no extra transactions |

**What this proves for these two tests:** both routes completed real encrypted-note sends to the same controlled recipient. Funding via a private invitation let the new @devil recipient register and send with **no public wallet funding**. The standard first-use faucet path required **public RLS/USDr funding and a public shield**; the subsequent shielded send had the same one-nullifier/three-note public envelope topology, and its private amount and payee were not disclosed by the vault logs. Both sender→receiver identities and both amounts are **owner-wallet observations, not decrypted public chain events**.

**What it does not prove:** funding-route equivalence, identical privacy across all users, protocol-wide anonymity, confidential delivery of the previously exposed invitation bearer link, direct shielded-faucet zero-funding onboarding, or auditor-side decryption. This is a controlled testnet comparison with n=1 per distinct funding route.

## Second-cohort real public receipts

1. **Public RLS faucet:** `0x952208d50a5711e69589e75e0af619f1e94ff47a8f9372a2c2a26155e1025e5c`, 250 RLS to public account, block 24,766,137.
2. **USDr/native faucet:** `0x66ddb33fb227849c301ff08f197e16844376de3f37130ebbacf1bfc9dd471604`, 10 USDr plus native balance, block 24,766,137.
3. **Public registration:** `0x0c7419d5d3d334dae29f5e87bdde78481ed61b6ae2907429044b4e56903beb0a`, block 24,766,266, fee 7.19695668 RLS, UserRegistered/UsernameSet/Relayed validated.
4. **Public Shield 20 RLS:** `0x412a30dfaf94a75b25efbc02edf0f63a6de4846d89392c945e6f9b5b7be5c6b7`, block 24,767,225. ERC20 public source 20.00000000 RLS to SharedVault and 3.52580064 RLS to relayer. Public wallet balance changed 242.80304332 → 219.27724268. Separate reported-treasury payout `0x2a462176bace48a23a164a6811019b9792121f2f5a7b41e765bca0f55ef84ef0` 3 blocks later: 0.45988704 RLS. Exact 15% of base calculation: 3.06591360 + 0.45988704 = 3.52580064 RLS.
5. **Private Send 3 RLS:** `0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb`, block 24,767,795, status 1, public relayer → SharedVault `transferV2`, 1 Nullifier, 3 Commitments, 3 EncryptedNotes, no public source-token transfer at this spend. Source wallet public RLS stayed at 219.27724268, USDr 10, native 10, EVM nonce 0. Separate reported-treasury payout `0x1e98495ef31b41a8dab93f1a2b284f81991987000a3c69c958287e82f6e9fa8f`, block 24,767,799, 0.576 RLS, implying 4.416 RLS gross.
6. **Independent receiving-wallet witness:** authorized read-only reconnect of established `@rq3dev26` shows shielded RLS **6**, up from previously preserved **3**, while public RLS remains **242.8069**. No new transaction was signed from this receiving wallet.

All submitted transaction hashes were user-approved official wallet actions; the independent verification scripts only read RPC/explorer and local evidence. Raw receipts + logs and SHA-256 reproducibility are part of the release.

## Fee metadata and methodology upgrade

The original controlled invitation, claim and first send provided **3/3** matched nearby treasury payouts. The second independent private send adds a fourth **separately verified selected private operation**, also with one distinct reported-treasury payout in its predefined [block−12, block+25] window. This makes **4/4 selected controlled private operations**, NOT a statistically representative success rate or cryptographic source→treasury attribution. The two shield events remain PUBLIC, and their amounts and relayer fees are plain in ERC20 logs.

The original fee-timing diagnostic compared **30 fixed shifted placebo windows** (10 offsets per original three private operation blocks): **0/30** contained a reported treasury payout or vault nullifier. This describes an unusually sparse local segment, not a random-traffic-matched privacy experiment.

A separate UI-only overspend control used @rq3dev26's initial 3 RLS shielded balance and tried entering 15 RLS; the official Send button was disabled with an insufficient-balance message, and no transaction was submitted. This is not a proof that arbitrary malicious proofs fail cryptographic verification.

A state replay checker observed three original successful pre-state simulations and six post-state reverts; a fourth second-cohort private send contributes one pre-state success and two post-state reverts. **4 positive, 8 negative read-only historical simulations total**, 0 replay broadcasts. Public RPC subsequently pruned older historical states. The original successful RPC responses and calldata hashes remain **source-dated frozen evidence** rather than falsely presented as newly executable on the current pruned node.

## Faucet gating that affected the comparison

Fresh passkey `@rq3faucet26` directly opening `/faucet` was routed to **Finish setting up**, requesting transparent faucet funding first. The operator obtained 250 public RLS and 10 public USDr, registered, and then saw all FOUR faucet buttons, including **Shielded RLS**, disabled for approximately **2 hours 55 minutes**. The built-in shielded faucet UI advertises 250 RLS and 10 USDr into shielded balances once per 3 hours, but this case **did not** claim a direct shielded faucet credit. No rate-limit bypass was attempted.

This is the meaningful product distinction: an invitation can fund a new receiver privately with no public wallet funding, whereas ordinary first-use onboarding can publicly link a fresh account to its funded amounts. Do not claim the default public faucet disproves the *existence* of a direct shielded faucet; only the actual route availability and cooldown were observed.

## Reproduction and exact scientific boundaries

Source files:
- `qa/verify_faucet_cohort_registration.mjs` — public funding, registration event and 7.19695668 RLS fee.
- `qa/verify_faucet_cohort_public_shield20.py` — public vault deposit, 3.52580064 RLS fee, treasury payout and public balances.
- `qa/verify_faucet_cohort_private_spend_envelope.mjs` — exact mined private transaction, 7 logs, separate `eth_getLogs`, scoped postshield public account state.
- `qa/verify_faucet_cohort_private_spend_fee_replay.py` — distinct treasury transfer, 4.416 RLS fee, pre/at/post historical replay.
- `qa/verify_faucet_cohort_private_spend_offline.mjs` — frozen source-byte consistency.
- `qa/tamper_faucet_cohort_private_spend.mjs` — 38/38 in-memory mutations rejected.
- `qa/verify_private_fee_shifted_nulls.py` — 30 offset placebo windows (3 original private operations).
- `evidence/public-rpc/controlled/faucet-cohort-recipient-owner-witness-6rls.json` — sanitized separate destination wallet observation.

Original six tamper suites detected **144/144** mutations; the second-send suite detects **38/38** additional: **182/182** combined. No tamper suite is a protocol security proof. Technical detail and exact evidence-class limits are preserved in each independently extractable file.

This report supersedes any older *pending* second-cohort language but does **not** overwrite the original Quest 3 experiment's provenance. The original released archive SHA-256 is documented in its own Git history and prior research status files.
