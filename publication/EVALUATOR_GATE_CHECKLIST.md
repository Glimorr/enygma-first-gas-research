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
- [x] Private outgoing spend: distinct 0.576 RLS treasury payout 4 blocks later; implied 4.416 RLS gross fee matching 4.42 UI; exploratory controlled n=3

## Robustness and evaluator reliability
- [x] Raw receipts, transaction headers and separate logs, ABI/provenance snapshots, fixed-chain IDs
- [x] Six corruption suites **144/144** PASS: shield22, public treasury15, invite19, receiver30, private fee21, first spend37
- [x] Historical `eth_call` replay positive/negative simulations **3 success before mining, 6 reverts after**, correctly labeled noncommitting
- [x] Technical failures preserved instead of edited out: rate-limit, signing barrier, wrong transcribed address, pruned historical state
- [x] State pruning reproducibility repair: current ERC20 state + 50 full post-shield directional log-window queries; exact historical balance reconstruction
- [x] Final extracted public-only archive **23/23** stages PASS (pruning-safe checks)
- [x] Public security scan for passkeys, private keys, invitation bearer link; exclude intentionally superseded wrong-address snapshots
- [x] Original note secrecy preserved: wallet UI values never presented as publicly decrypted chain data
- [x] Rerun full fresh live/extracted QA and SHA-256 manifest after final send
- [x] Publish public evidence archive and **live check website/archive checksum and public source URLs** before user posts article

## Visuals, videos and editorial
- [x] Responsive Vite/Three.js/GSAP Rayls-themed research website publicly deployed on GitHub Pages
- [x] Tabs for public shield, encrypted invite, recipient claim and registered identity, data-derived fee visuals and replay comparisons
- [x] **66/66 public deployed URL browser QA** across desktop/tablet/mobile, including real archive download
- [x] Six original evidence PNGs at 1600×900, visually reviewed and fixed clipping
- [x] Three silent, user-recordable video shot lists and short voiceover scripts, without fabricated completed footage
- [x] Full article fact pack with sources/limits, reproducibility and issue log
- [x] Update site/figures/recording scripts with verified outgoing send and its exact public receipt
- [x] Publish the site to GitHub Pages; fresh 66/66 browser QA at public URL, 200 downloads and matching SHA-256
- [x] Final X Article **draft** prepared, no rhetorical questions inside article, precise signer attribution, include required sections: **What verified**, **How to reproduce**, **Issues fixed**, **Sources visited**, 3 real video placeholders
- [ ] Actual user-recorded and edited videos; user publishes site links, X Article, X attachment question
- [ ] Legitimate team question in separate X attachment post (only if it advances real technical research)

## Evaluator boundary: verified versus optional or unperformed

The complete controlled invitation → private claim → public registration → first 3 RLS private send **has been verified**, with separate receiving-wallet confirmation and the sender's public funding/nonce remaining zero. The work spans one lifecycle on Rayls Public Chain Testnet. The invitation bearer link was exposed in the research conversation; secret delivery was not tested. There is no direct shielded-faucet comparator, independent second full lifecycle or privileged auditor-side decryption. These are disclosed limitations, not missing pieces of the completed controlled lifecycle.

**Publication remains the user's task:** record and edit three real videos, insert figures and working video links, publish the X Article and submit the quest; optionally post the separate legitimate question to Rayls. This checklist is an internal evaluator-aligned quality audit, **not** the Rayls team's official scoring rubric or guarantee of 10/10 RP.

## Public provenance
- Website: https://glimorr.github.io/enygma-first-gas-research/
- Repository: https://github.com/Glimorr/enygma-first-gas-research
- Controlled private send: https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
- QA: `qa/FINAL_RELEASE_QA_REPORT.json`, 23/23 clean-extraction checks, 66/66 public live website checks and 144/144 mutation detections.
