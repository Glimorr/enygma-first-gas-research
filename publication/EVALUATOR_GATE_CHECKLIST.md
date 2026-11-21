# Evaluator gate checklist — Rayls November 2026 Quest 3

**Evaluator-targeted QA.** Completed first-spend checks should be read with `research/FINAL_VERIFICATION_REGISTER.md`. User videos and public publication still need final review; no score guarantee.

## Scientific integrity and evidence quality
- [x] Independent, useful research question: whether a newcomer can claim/register/spend shielded RLS without public funds, and what public fee metadata persists
- [x] Different network and privacy model from the previous Enygma Sovereign anonymity-set study; this is Enygma Public on chain 7295799
- [x] A normal public onboarding control: Dev faucet + fee-paid public registration, complete receipts
- [x] User-created 40 RLS shield: exact deposit, relayer fee and ERC20 reconciliation
- [x] User-created 30 RLS private invitation: actual mined `SharedVault.transferV2` receipt and note events
- [x] New passkey-controlled `@devil` private claim: actual separate mined private claim receipt
- [x] New receiver registration: actual `UserRegistered`, `UsernameSet`, `Relayed.fee=0` mined receipt
- [x] Receiver EVM address derived from verified onchain log, with false screenshot transcription preserved and superseded
- [x] Correct recipient public RLS, public USDr, native balance and nonce sampled before claim, after claim, before registration, after registration, and latest
- [x] Complete scoped public RLS/USDr token transfer scan involving correct receiver address across full controlled interval
- [x] Wallet-observed 17.304 shielded RLS explicitly distinguished from public receipt fields
- [x] **Receiver-originated private send** of 3 RLS to registered Dev user `@rq3dev26`, protected passkey confirmation, mined transaction and owner-wallet screenshots
- [x] Independent receiver private-spend receipt decoding, current public sender/recipient balances, fee trail, note topology, owner-wallet attribution, tamper control
- [ ] Negative spend control (e.g. insufficient shielded balance/fee preview or safe expired/previously spent note UI route); must be legitimate, reproducible and not fabricated
- [ ] Direct shielded faucet comparator (distinct fresh identity); ideal but not required to invent if unavailable. Must disclose nonexecution
- [ ] At least one repeat of full invite→claim→spend lifecycle if eligible/reliable; otherwise honestly report n=1 and avoid generalization

## Original side finding: fee metadata
- [x] 15/115 share formula independently reconciled to public shield gross RLS fee
- [x] 18/18 distinct transfers matched in a selected public-forwarder paid sample; 2 zero-fee controls
- [x] Separate private invite and claim RLS fee metadata: two isolated fixed comparison windows, one vault nullifier transaction and one treasury payout each
- [x] Private invite: 0.576 RLS treasury ⇒ 4.416 gross, matching 4.42 UI
- [x] Private claim: 1.656 RLS treasury ⇒ 12.696 gross; 30−12.696=17.304 UI
- [x] Public registration zero fee / no payout within +35-block control
- [x] Distinguish metadata correlation from recovery of private principal or payee
- [x] Explicitly qualify treasury address as relayer-reported, not independently authenticated legal entity
- [ ] Private outgoing spend comparison to extend controlled n=2 metadata findings to n=3

## Robustness and evaluator reliability
- [x] Raw receipts, transaction headers and separate logs, ABI/provenance snapshots, fixed-chain IDs
- [x] Five corruption suites **107/107** PASS: shield22, public treasury15, invite19, receiver30, private fee21
- [x] Historical `eth_call` replay positive/negative simulations **2 success before mining, 4 reverts after**, correctly labeled noncommitting
- [x] Technical failures preserved instead of edited out: rate-limit, signing barrier, wrong transcribed address, pruned historical state
- [x] State pruning reproducibility repair: current ERC20 state + 50 full post-shield directional log-window queries; exact historical balance reconstruction
- [x] Fresh extracted public-only archive **16/16** stages PASS at checkpoint
- [x] Public security scan for passkeys, private keys, invitation bearer link; exclude intentionally superseded wrong-address snapshots
- [x] Original note secrecy preserved: wallet UI values never presented as publicly decrypted chain data
- [ ] Rerun full fresh live/extracted QA and SHA-256 manifest after final send
- [ ] Publish immutable public evidence archive and **live check each public URL** before user posts article

## Visuals, videos and editorial
- [x] Responsive Vite/Three.js/GSAP Rayls-themed research website built as an unpublished local preview
- [x] Tabs for public shield, encrypted invite, recipient claim and registered identity, data-derived fee visuals and replay comparisons
- [x] 63/63 local responsive browser QA + **63/63 nested production-path browser QA** across desktop/tablet/mobile
- [x] Six original evidence PNGs at 1600×900, visually reviewed and fixed clipping
- [x] Three silent, user-recordable video shot lists and short voiceover scripts, without fabricated completed footage
- [x] Full article fact pack with sources/limits, reproducibility and issue log
- [ ] Update site/figures/recording scripts with verified outgoing send and its exact public receipt
- [ ] Publish the site to user-selected GitHub Pages (only once ready); fresh browser QA exact URL, no 404 and no UTM
- [ ] Final humanized X Article, no rhetorical questions inside article, no fake citations, precise human-run signer attribution, include required sections: **What verified**, **How to reproduce**, **Issues fixed**, **Sources visited**, 3 real video placeholders
- [ ] Actual user-recorded and edited videos; user publishes site links, X Article, X attachment question
- [ ] Legitimate team question in separate X attachment post (only if it advances real technical research)

## Honest constraints
The core claim is now **two of three** stages complete: private invite was created, new zero-public-funded receiver claimed and registered, but the new receiver has **not yet sent** a private outgoing payment. This step cannot be represented as success from registration alone. The previous invitation was shared in chat and therefore does not prove confidential delivery; the test is an exposed-link onboarding pilot, not a security breach finding. Use the explicit one-time wallet consent route for the actual private send, never a bypass of protected passkey signing. Until that mined receipt exists, the complete quest remains a **research checkpoint only**.

## Single next execution gate
Submit one official app shielded send of **3 RLS** from `@devil` to `@rq3dev26`, if the app's fee quote allows it. Copy only the public TX hash once mined. Run `node qa/verify_devils_first_private_spend.mjs --tx <hash>` then reconstruct recipient wallet observation and note fee-control and replay evidence. Only afterwards freeze the finished site and X Article.
