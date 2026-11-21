> **Original first-edition provenance register (Cohort A).** This document deliberately preserves the first completed invitation-funded lifecycle with three selected private fee cases and the 3 RLS recipient balance observed at that time. The **authoritative two-cohort extension and final comparison** is [FINAL_TWO_COHORT_COMPARISON_20261121.md](FINAL_TWO_COHORT_COMPARISON_20261121.md); it includes the second publicly funded 3 RLS send and receiver balance increasing to 6 RLS. Do not mistake this original source-dated record for an unfinished second cohort.

# Rayls Quest 3 — FINAL controlled first-gas lifecycle verification register

**Last updated:** 21 November 2026 IST. **Network:** Rayls Public Chain Testnet, chain ID 7295799.

This register is the authoritative evidence and scope statement for the final public release. Earlier dated `STATUS_2026-11-21.md` and `PREREGISTRATION.md` records remain preserved as chronological research/failed-stage notes and may contain now-superseded *pending* descriptions. **Do not replace actual mined results with those historic placeholders.**

## The central result

A new passkey wallet **@devil** completed a private invitation claim, public registry onboarding, and its **first outgoing 3 RLS shielded payment** to a separate previously registered and funded researcher-controlled wallet **@rq3dev26**. Throughout the checked control interval, @devil's **public EVM RLS, USDr token and native balances remained zero**, its account nonce stayed zero, and the scoped transparent token-transfer search found no public funding.

The official **sender** wallet displayed a successful private 3 RLS send, with the exact transaction hash below. A separate **recipient** wallet was independently reconnected read-only and showed **3 shielded RLS**. The chain's mined SharedVault receipt supports an authenticated encrypted-note transaction but does **not** itself expose the private principal or payee. The result is one **researcher-controlled Enygma Public testnet lifecycle**, not a network-wide or mainnet anonymity/security guarantee.

**Correct EVM receiver (source: public UserRegistered/UsernameSet logs):** `0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C`.

**Separate controlled Dev receiving wallet:** `0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6`.

## Chronological receipts

| Stage | Block | Public receipt | Verified class |
|---|---:|---|---|
| Dev faucet, normal funding | 24,732,650 | `0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83` | 250 public RLS Transfer |
| Dev funded public registration | 24,735,856 | `0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa` | @rq3dev26 registered with 7.1930016 public RLS fee |
| @god 40 RLS public shield | 24,738,801 | `0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a` | 40 RLS public vault deposit + 3.50727828 RLS fee |
| @god 30 RLS invitation | 24,744,028 | `0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab` | `transferV2`, 1 nullifier, 3 commitments, 3 encrypted notes |
| New passkey private claim | 24,747,924 | `0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec` | `transferV2`, 1 nullifier, 3 commitments, 3 encrypted notes |
| New passkey public registration | 24,748,136 | `0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b` | `UserRegistered`, `UsernameSet(devil)`, public relayer fee 0 |
| **First private 3 RLS send** | **24,760,126** | **`0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8`** | **Mined SharedVault transferV2 receipt, 1 nullifier, 3 commitments, 3 encrypted notes** |

For the final send, `qa/verify_devils_first_private_spend.mjs` reconstructed raw public transaction, mined block inclusion/hash/status, separate `eth_getLogs`, token balances/nonce and transparent token transfer interval; **PASS**. It never signed or submitted a transaction. `qa/verify_private_spend_offline.mjs` rechecks frozen bytes, with `qa/tamper_private_spend.mjs` rejecting **37/37** modified copies.

The sender's actual 3 RLS payment instruction and recipient @rq3dev26 come from the owner wallet's successful action, **not** a plaintext vault event. A separate authorized **read-only** owner-wallet session of @rq3dev26 displayed **3 shielded RLS** and 242.8069 public RLS, with no additional send/sign-transaction action. Sanitized positive-control evidence is saved as `evidence/public-rpc/controlled/receiver-dev-owner-ui-3rls-verified.json`.

## Public fee-trail observations

The reported relayer-to-treasury formula is **treasury = gross × 15 / 115** (or 15% of the base fee, not gross). This can be independently checked from actual publicly visible ERC20 RLS Transfer logs, but direct source-to-treasury attribution remains **temporal/policy correlation, not an onchain cryptographic link**.

| Controlled operation | Source block | Separate reported-treasury transfer | Delta blocks | Treasury RLS | Implied gross RLS |
|---|---:|---|---:|---:|---:|
| Public shield | 24,738,801 | `0x0f541a2275c4fcce2e43ba3219d37503fd38032932e0b94f9973f4cbce62233c` | 3 | 0.45747108 | 3.50727828 |
| Shielded invitation | 24,744,028 | `0x3650f335ce12fe0c2ad4616aa7d595503e44e18b141e35121fc7cc7f077377f1` | 4 | 0.576 | 4.416 |
| Shielded claim | 24,747,924 | `0xc9e3b527d27b152bde59a9529679dcbf2d4237dda1c7f7c2564ad9cff18ab116` | 2 | 1.656 | 12.696 |
| Shielded first send | 24,760,126 | `0xd639df4cd7d62ea031a313ec5b3b9f6b46241aebe599b29867bf7a3e7302bb32` | 4 | 0.576 | 4.416 |

Three shielded operation windows `[block−12, block+25]` each contained exactly one vault-nullifier transaction and one relayer-to-reported-treasury positive payout. The wallet-displayed fee quotes rounded to 4.42, 12.70 and 4.42 RLS, consistent with exact on-chain payout-derived values. `30−12.696=17.304` RLS reconciles the claimant wallet's private balance after claim.

Separately, an activity-selected sample of 18 paid public-forwarder cases found 18 distinct exact fee-share payouts with two zero-fee controls; the successful invitation-funded public registration had `Relayed.fee=0` and no corresponding treasury transfer in the next 35 blocks. Do **not** generalize n=3 selected shielded cases to every network payment or describe this as recovered private payment principal.

## State-replay controls

For **each of the three controlled private operations** (invitation, claim, first send), the exact original public `transferV2` calldata returned `true` from read-only `eth_call` against the block state immediately **before** mining, and **reverted** against the state at and after the mined block.

**3 pre-state positive and 6 post-state negative simulations; 0 extra transactions broadcast**. This is consistent with state-dependent replay rejection but does not prove the exact revert cause or every replay variant. Files: `qa/verify_private_replay_controls.py` and `qa/verify_private_spend_fee_replay.py`.

## Independent reproduction

From the root of the extracted release:

```bash
cd experiments/browser && npm ci && cd ../..
node qa/verify_receiver_onboarding_pruned_rpc.mjs
node qa/verify_devils_first_private_spend.mjs --tx 0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
node qa/verify_private_spend_offline.mjs
node qa/tamper_private_spend.mjs
python3 qa/verify_private_fee_sidechannel.py
python3 qa/verify_private_spend_public_payout.py
python3 qa/verify_private_replay_frozen.py
python3 qa/verify_god_shield_postprune.py
```

The six independent in-memory tamper suites detected **144/144** mutations: shield 22, public fee treasury 15, invitation 19, receiver onboarding 30, private fee 21, first send 37. A clean extraction QA script tests hashes, installs fixed dependencies and reruns all source/provenance verifications on the extracted archive.

## Evidence integrity and failures preserved

- The first screenshot-transcribed receiver address `0x665E88...` was **wrong**. Authoritative receiver address is `0x665E08...`, derived directly from verified registry events. Both wrong-address baseline files are excluded from release; the correction register is included.
- Original public shield historical `eth_call` eventually failed because the provider **pruned** block 24,738,801. Original failure remains archived. A distinct live checker queries current ERC20 RLS state and 50 directional transfer-log scan windows to reconstruct original 242.81384044→199.30656216 RLS, corroborated by the independent explorer index; this is *event-based reconstruction*, not an archive-state query.
- The invitation's bearer link was previously shared in the research chat and is treated as an **exposed-link pilot**, not secret-delivery evidence. The released archive contains no bearer link or account credentials.
- The testnet stable faucet initially rate-limited a request; one initial browser sign/forwarder automation was blocked. The successful operator-controlled actions are attributed to their actual wallets.
- Direct shielded-faucet comparator, auditor-side privileged decryption, and repetitions on independent accounts are **not** experimentally proven. We report one complete onboarding-to-first-spend lifecycle and exploratory n=3 fee correlation. Do not claim mainnet behavior or guaranteed cryptographic safety.

## Final presentation artifacts
- `site/`: full responsive research website source with five receipt tabs, three private fee-trail comparisons, three historical replay cases, and source-linked public evidence. User-facing site should be QA'd on deployed URL before publishing the article.
- `figures/`: six visual evidence figures (1600×900 PNGs), each generated from the frozen final site dataset.
- `publication/FINAL_X_ARTICLE.md`: finished article draft with figures, transaction references, reproducibility, issues fixed, sources visited, and three video placeholders. User handles article publication and recording/editing.
- `recording/VIDEO_SHOTLIST_20261121.md`: three user-operated video guides, updated for the completed private send.

**Research verdict:** A live, independently checked first shielded send from a new publicly unfunded passkey account was observed on Rayls Public Testnet. The treasury fee metadata deserves discussion as a scoped design observation, without alleging that Enygma's encrypted payment principals have been decrypted or that an auditor was independently tested.

## Archival-RPC availability at final reproduction
After the originally successful historical-state simulations were captured, the live public RPC pruned the relevant old block states. The final extraction suite now separately validates **fresh mined receipts, logs, reported-treasury transfers, live current public account state, and all scoped Transfer logs** without claiming old balance queries still work. The three before/after replay experiments are retained as **frozen, calldata-hash-matched historical responses** (3 positive / 6 negative), verified with `qa/verify_private_replay_frozen.py` instead of promising a fresh `eth_call` at a pruned block. The previous failed live-QA report is preserved under `release/final-first-gas-pruned-rpc-failures.json`. This is a reproducibility boundary, not a change to the observed on-chain receipts.
