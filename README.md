# Rayls Enygma Public: Two Ways Into a Private Payment

**Independent reproducible study — Rayls Public Chain Testnet, chain ID 7295799 — 21 November 2026.**

## Verified finding

We completed **two actual 3 RLS shielded sends** to the same independent research wallet, starting from different new passkey accounts:

- **Private invitation onboarding:** `@devil` received a 30 RLS shielded invitation, privately claimed it, registered with a zero public fee and sent **3 RLS privately** to `@rq3dev26`. The new sender's public RLS/USDr/native balance and EVM nonce remained zero across all audited checkpoints. Public receipt: [first private send](https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8).
- **Ordinary public-faucet onboarding:** `@rq3faucet26` received **250 public RLS and 10 public USDr**, registered for **7.19695668 public RLS**, transparently shielded **20 RLS** with a **3.52580064 RLS** relayer fee, then sent **3 RLS privately** to `@rq3dev26`. Its public RLS remained **219.27724268** after the private send. Public receipt: [second private send](https://testnet-explorer.rayls.com/tx/0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb).

The independent **recipient's wallet displayed 3 shielded RLS after the first transfer and 6 after the second**, confirmed through separate read-only owner-wallet sessions. Each private send's public vault receipt contains one nullifier, three commitments and three encrypted notes, with no plaintext private payment amount or recipient identified in public logs. Wallet-observed values and public RPC evidence are kept distinct.

**Crucial distinction:** Two *different* funding-route treatments were completed, not two independent repeats of the identical zero-funded invitation treatment. Only the invitation-funded newcomer was ever publicly unfunded throughout the experiment.

## Novel research and controls

Four selected private operations (invitation, claim, invitation-funded send, publicly funded send) each had one distinct nearby RLS transfer to the relayer-reported treasury address, with exact fee arithmetic under the reported **15% of base / 15÷115 of gross** policy. This is an **exploratory fee-metadata correlation** and not a cryptographic attribution of private payer, payee or principal. The original 18 selected paid public-forwarder cases also matched fee-sharing transfers, alongside two zero-fee controls.

Additional controls: **30 preselected time-shifted windows** around the original three private operations, none with a relevant vault-nullifier or reported-treasury payout; one **UI-only insufficient-balance negative control** with the send button disabled; **4 pre-settlement positive and 8 post-settlement revert** read-only historical `eth_call` observations; and **182/182 intentionally corrupted evidence copies rejected** across original and new suites.

Historical RPC block state was later pruned on some older testnet heights. Source-dated replay responses are preserved and checked against original transaction calldata rather than falsely described as live-reproducible archive queries. Independent fresh receipt, block and log checks still run.

## Interactive motion-first website (creative revision 03)

The [live cinematic research experience](https://glimorr.github.io/enygma-first-gas-research/) is a completely reworked original visual journal, with a procedural 3D vault sculpture, four-act scroll-reactive private/public route map, oversized editorial type, kinetic lime/purple motion graphics, source-driven six-transaction proof viewer, public-versus-wallet evidence lens, actual-fee interaction, and an original animated Orbit research navigation guide. Orbit is **illustrative navigation**, not official Rayls or a real AI service.

The experience keeps the user's preferred plum/lavender/lime palette and the authentic Rayls symbol. Key details are source-bound, keyboard usable and readable under reduced motion. The original research source/archive is **not changed by this visual redesign**.

- [Interactive art direction & scientific boundaries](research/SITE_CREATIVE_REBUILD_20261121.md)
- [Motion/accessibility/source-interaction QA](qa/CINEMATIC_REBUILD_INTERACTION_QA_REPORT.json) (70/70) and [source/responsiveness regression QA](qa/CINEMATIC_REBUILD_SOURCE_AND_RESPONSIVE_QA_REPORT.json) (72/72)
- [Desktop visual preview](design-previews/desktop-hero.png) · [Four-act story](design-previews/desktop-story.png) · [Fee laboratory](design-previews/desktop-fee-lab.png) · [Mobile preview](design-previews/mobile-hero.png)

## Research artifacts

- [Live interactive research website](https://glimorr.github.io/enygma-first-gas-research/)
- [Full two-cohort scientific report](research/FINAL_TWO_COHORT_COMPARISON_20261121.md)
- [X Article — publication-ready draft](publication/FINAL_X_ARTICLE.md)
- [Seven article figures](figures/)
- [Three silent recording shot lists and short voice scripts](recording/VIDEO_SHOTLIST_20261121.md)
- [Public evidence integrity manifest](MANIFEST.sha256) and [self-contained source reproduction runner](release/verify_two_cohort_reproduction.py)
- [Standalone evaluator gate checklist](publication/EVALUATOR_GATE_CHECKLIST.md)

The GitHub Pages website provides a link to the **new two-cohort evidence archive**, while the **unchanged first-edition archive** remains separately available for source provenance.

## Reproduce the evidence

Extract the archived release, install Node 22+ and Python 3 with `requests`, then:

```bash
cd experiments/browser && npm ci && cd ../..
python3 qa/check_two_cohort_release.py
node qa/verify_god_invite_pruned_rpc.mjs
node qa/verify_receiver_onboarding_pruned_rpc.mjs
node qa/verify_devils_first_private_spend.mjs --tx 0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
node qa/verify_faucet_cohort_registration.mjs
python3 qa/verify_faucet_cohort_public_shield20.py
node qa/verify_faucet_cohort_private_spend_envelope.mjs
python3 qa/verify_faucet_cohort_private_spend_public_payout.py
python3 qa/verify_private_replay_frozen.py
python3 qa/verify_faucet_cohort_private_spend_replay_frozen.py
node qa/verify_private_spend_offline.mjs
node qa/verify_faucet_cohort_private_spend_offline.mjs
node qa/tamper_private_spend.mjs
node qa/tamper_faucet_cohort_private_spend.mjs
python3 qa/verify_private_fee_shifted_nulls.py
```

The source runner `release/verify_two_cohort_reproduction.py` extracts the ZIP into a fresh directory, verifies every SHA-256 source hash, installs pinned JavaScript dependencies and performs the complete executable QA suite. It does not read user passkeys, private keys or invitation bearer links, nor broadcast testnet transactions.

## Honest scientific limits

This is a testnet evaluation with one completion for each distinct onboarding route, not an official security audit or mainnet guarantee. The original invitation bearer URL had been exposed in the research conversation: **confidential delivery was not demonstrated**. The direct shielded faucet was not claimed: the new passkey was redirected to standard public-funded onboarding, then all four Get controls were disabled with a shared-looking cooldown. The `/auditor-demo` page supplies **sample data**, not privileged auditor decryption of our transactions. The treasury's corporate ownership is known only from the reported relayer configuration, not independently authenticated. A zero-public-funding conclusion applies only to `@devil`, not `@rq3faucet26`.

All actual receipts and failures are preserved; publication and recording are separately user-operated tasks.
