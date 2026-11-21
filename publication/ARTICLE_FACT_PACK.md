# The First-Gas Question — fact-checked editorial dossier for the final X Article

**Historical editorial fact pack:** the original draft described the then-unfinished spend. Refer to `research/FINAL_VERIFICATION_REGISTER.md` and `publication/FINAL_X_ARTICLE.md` for authoritative complete results. All figures are current as of 21 November 2026 IST. The full register is `research/CURRENT_VERIFICATION_REGISTER.md`.

## Clean central claim
We reproduced an Enygma Public onboarding case in which a new passkey wallet received a private invitation, made a shielded claim and registered a username while **its public RLS balance, USDr balance, native balance and EVM nonce remained zero** in the verified Rayls testnet state. The private wallet displayed **17.304 shielded RLS**. Distinguish this wallet-observed private amount from events that are independently visible to public RPC.

**Still to prove before the final article:** the newly registered account actually **spends** a private amount to a controlled recipient while remaining publicly unfunded.

## 1. Problem and institutional relevance
New users often need native or public gas assets before their first on-chain action. The Enygma Public invitation model attempts to separate public on-chain identity creation from publicly funded token balances. The research tests exactly where that separation holds and where public metadata persists. The result matters for banks, wallet designers and regulated payment operators because account identity, fee metadata and audit access must not be conflated with fully hidden transfers.

This investigates **Enygma Public on Rayls Public Chain Testnet**, not the previously studied Enygma Sovereign Private Network and not a mainnet exploit. Chain ID **7295799**.

## 2. Controls and chronology (all live public receipts)
| Action | Block | Public transaction | Chain-derived result |
|---|---:|---|---|
| Dev control faucet | 24,732,650 | `0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83` | 250 public RLS |
| Dev control registry | 24,735,856 | `0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa` | @rq3dev26; 7.1930016 public RLS fee |
| @god public shield | 24,738,801 | `0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a` | 40 RLS transferred to vault + 3.50727828 public relayer fee |
| @god shielded invitation | 24,744,028 | `0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab` | One nullifier, three commitments, three encrypted notes; 30 RLS known only from inviter UI |
| New receiver claim | 24,747,924 | `0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec` | One nullifier, three commitments, three encrypted notes; no public RLS Transfer |
| New receiver registry | 24,748,136 | `0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b` | UserRegistered + UsernameSet(@devil), Forwarder Relayed fee 0 public RLS |
| @devil outgoing private spend | **PENDING** | **NO TRANSACTION HASH** | Do not claim a completed send |

Onchain receiver: `0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C`. This is verified directly in UserRegistered and UsernameSet events, not manually reconstructed from the screenshot.

## 3. What public RPC did and did not reveal
Public shield: the owner EVM address and exact 40 RLS amount (plus 3.50727828 fee) appear in ERC20 logs. Two independent log retrieval paths plus the receipt reproduce them.

Private invitation and claim: direct `SharedVault.transferV2` transactions each have 1 nullifier, 3 commitments and 3 encrypted notes. They disclose a proof-associated encrypted note footprint but no plaintext principal or recipient identity in those events. The relayer is visible as public tx sender.

Registered account @devil: onchain UserRegistered and UsernameSet prove an address joined and a username was publicly recorded. Public RLS/USDr, native balance and EVM nonce remain zero at historical pre-claim, claim and registration checkpoints, and there are no transparent token-transfer receipts for the account in the defined interval. The owner's wallet UI, **not public RPC**, showed 17.304 RLS in the shielded column.

## 4. Secondary finding: fee metadata is visible
First transparent shield fee:
- Gross `3.50727828` RLS; reported treasury payout `0.45747108` RLS.
- `3.04980720 × 15% = 0.45747108` RLS. The 15% is on **base**, not gross.

Two private operations:
- Private invite treasury transfer **0.576** RLS 4 blocks later; using reported 15% base surcharge implies **4.416** gross RLS, the owner's UI rounded to 4.42.
- Private claim treasury transfer **1.656** RLS 2 blocks later; implies **12.696** gross RLS, the wallet's 12.70 quote and `30 − 12.696 = 17.304` wallet balance.
- In an exact, disclosed **source−12 through source+25 block** window, each of the two controlled private operations had one vault-nullifier transaction and one distinct relayer→reported-treasury RLS transfer.
- An additional control: successful public registry with `Relayed.fee=0` had no corresponding treasury payout within +35 blocks.
- Separately, the 18-transaction selected sample of public paid-forwarder events produced 18 matching reported-treasury payouts, plus two zero-fee controls.

**Accurate conclusion:** public fee-routing metadata can carry information about a private operation's fee when temporal and policy assumptions hold. It is NOT a recovery of hidden payment amount or private sender/recipient; the source→payout match lacks a cryptographic linking identifier. The reported treasury address comes from the relayer's configuration; legal ownership was not independently confirmed. The controlled private sample is n=2, selected, not a trained classifier or general exploit.

## 5. State-dependent replay controls
Original public `transferV2` calldata for both the invitation and the claim returned `true` by **read-only `eth_call`** at block immediately before mining. Exactly the same call reverted at the mined block and one block afterward: 2 positive, 4 negative historical-state checks, no sent transactions. This supports state-dependent replay rejection consistent with the onchain nullifier footprints but does not establish the exact revert reason or every adversarial replay case.

## 6. Reproducibility and issues fixed
- `qa/verify_receiver_onboarding.mjs`: independently fetches and decodes both claim and registry receipts, confirms state chronology for the corrected account, complete transparent token-log scan and explorer account history; live PASS.
- `qa/tamper_receiver_onboarding.mjs`: **30/30** in-memory corruptions rejected.
- `qa/verify_private_fee_sidechannel.py`: live treasury payout receipts, full fixed comparison windows and zero-fee registration control; PASS.
- `qa/verify_private_fee_sidechannel_offline.py --tamper-tests`: **21/21** mutations rejected.
- `qa/verify_private_replay_controls.py`: two historical positive controls and four after-state reverts; PASS.
- Other tamper suites: shield 22/22, invitation 19/19, treasury 15/15. In total **107/107** purposely corrupted cases rejected across these five suites.
- Original `qa/verify_god_shield.mjs` live historical `eth_call` failed later because the RPC state at block **24,738,801 was pruned**. Preserved failure: `release/receiver-checkpoint-pruned-state-failure-report.json`. A separate checker `qa/verify_god_shield_postprune.py` reproduces **242.81384044→199.30656216 RLS** using latest public RLS state and 50 independently scanned post-shield directional RLS Transfer windows, with explorer index agreement. **Not** a fresh archived-state `eth_call`.
- The first manually transcribed receiver address was wrong by one hex digit (`0x665E88` vs `0x665E08`). Two affected preliminary baseline files were deliberately excluded from the research archive and superseded by an event-derived address correction.
- The invitation bearer link was earlier pasted in chat. Document this as an **exposed-link pilot**, not a proof that the link remained secret. No link is included in public evidence.
- Testnet faucet stable-asset request initially hit rate limiting (HTTP 429), preserved instead of repeatedly retried.
- Avoid claiming that a signed passkey action was performed by the assistant; the user approved private actions in the official wallet.

### Fresh-checkpoint bundle
`E:\Rayls-Nov-Week3\release\rayls-nov-wq3-receiver-onboarding-checkpoint-20261121.zip`

Check `release/receiver-checkpoint-extracted-qa-report.json`: 16/16 clean-extraction tests PASS at the latest successful run, with 119 source files and a SHA-256 manifest. This is a public-only research checkpoint, not the final Quest submission.

### Website and figures
Unpublished local interactive research preview: `E:\Rayls-Nov-Week3\site\dist\index.html` (deploy via HTTP/GitHub Pages, not by opening local file://). Six 1600×900 evidence diagrams from `figures/render_research_figures.mjs`, re-rendered to fix clipping after first visual review. Browser QA: 63/63 checks across desktop, tablet and mobile. This site remains marked preliminary because outgoing private spend is pending.

### Sources (official)
- https://docs.rayls.com/docs/enygma-public
- https://docs.rayls.com/docs/how-enygma-public-works
- https://docs.rayls.com/docs/enygma-public-who-sees-what
- https://docs.rayls.com/docs/try-enygma-public-on-testnet
- https://docs.rayls.com/docs/public-chain-reference
- https://www.rayls.com/blog/rayls-enygma-public-testnet-pilot
- https://testnet-explorer.rayls.com/
- https://testnet-rpc.rayls.com/
- Verified deployed ABI snapshots under `research/verified-abis`

## Final article/editorial contract
The final X Article should not contain rhetorical questions, underlines, unnecessary hyphenation, invented live results, or tables that won't survive X formatting. Use the six PNG evidence figures, a clean human narrative, exact transaction explorer links, proper separation of wallet/UI and RPC provenance, the real replay and negative controls, and the required sections **What verified**, **How to reproduce**, **Issues fixed**, **Sources visited**. Three actual video links/placeholders are added only once the clips are available. The separate X attachment post can ask a genuine technical question to the Rayls team. Article publishing is done by the user.

Do not predict an official 10/10 RP score. Full onchain-controlled spend evidence plus final public source/link QA are evaluator gates still pending.
