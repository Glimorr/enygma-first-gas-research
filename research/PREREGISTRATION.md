# Preregistered research protocol — 20 November 2026

## Working title
**Can a New Wallet Spend Privately Without Ever Holding Public Gas?**
A controlled study of Enygma Public onboarding routes, relayer fees, and verifiable public traces.

**Status:** PREREGISTERED PLANNING ONLY. No user-controlled invite or shielded payment has yet been executed.

## Originality check
This research does not repeat our November Quest 1 settlement/receiver-recovery trials, November Quest 2 recurring-anonymity-set study, earlier ciphertext-length study, or a peer's 19 November public-calldata scan. The peer study at https://github.com/bunnyyxtan/enygma-public-footprint tested five ordinary private sends, public shielding/unshielding controls and byte scans. We will not reuse its transactions or claim its findings as our own. Our independent target is first-use funding, claim accounting, lifecycle events and gas sponsorship, with case-level public-state reconstruction.

## Sources of truth (to pin before claims)
- Protocol overview: https://docs.rayls.com/docs/enygma-public
- Technical flow: https://docs.rayls.com/docs/how-enygma-public-works
- Visibility limits: https://docs.rayls.com/docs/enygma-public-who-sees-what
- User workflow: https://docs.rayls.com/docs/try-enygma-public-on-testnet
- App: https://enygma-testnet.rayls.com/
- Chain: 7295799, https://testnet-rpc.rayls.com/, https://testnet-explorer.rayls.com/
- Relayer read-only info: https://enygma-relayer-aafjr.ondigitalocean.app/rayls/info
- Public source: https://github.com/raylsnetwork/Enygma (not assumed identical to deployed bytecode)
- Competing prior work: https://github.com/bunnyyxtan/enygma-public-footprint

## Hypotheses and measurable observables
H1 — **Zero-public-funding claim.** A fresh invited account can register and spend a received shielded note despite no observed public RLS/USDr top-up in its pre-defined study window. Compare public balances, transfer events, registration logs, incoming/outgoing account transactions, first private spend receipt, and controlled wallet evidence. Do NOT infer universal absence of linkability from this test.

H2 — **Onboarding baseline.** A fresh conventional account funded through the public faucet and then shielded will have public top-up and shielding signatures/events visible in the same measurements. Match study lengths and control initial funds where feasible.

H3 — **Direct shielded faucet route (conditional).** If the live product actually offers a direct shielded faucet to a fresh account, it might reproduce H1's zero-public-funding observations without an invite. Confirm product capability before including it. If unavailable, record the negative feasibility result rather than inventing a route.

H4 — **Gas sponsorship and fee reconciliation.** Collect the fee quote shown to the controlled user, contemporaneous relayer info (RLS per gas, reported commission and token fee), user-observed shielded RLS before and after, public tx gasUsed, relayer account, treasury transfer evidence and receipt logs. Explicitly state what cannot be reconstructed from public receipts because values are shielded. Separate server-reported fee policy from measured fees.

H5 — **Negative controls.** Test a fresh unfunded account, a not-yet-registered receiving account, and a second claim of an already-claimed invite ONLY if safe and supported. Record whether each failure happened in UI validation, relayer response, simulation, reverted onchain receipt, or was not executable. Never call local rejection a mined failure.

## Experiment matrix
| Group | Trigger | Public funding expected | Trial artifacts |
|---|---|---|---|
| A | New ordinary account, faucet, register, shield RLS, private send | Yes | distinct address + funding/registration/shield/send receipts |
| B | Inviter funds one-time invite, newcomer claims/registers/spends | Not to newcomer, per docs | invite creation + claim + spend, fresh address snapshots |
| C | Direct shielded faucet to fresh account (only if available) | Conditional | UI eligibility, independent receipts, wallet observations |
| D | Insufficient shielded gas; missing registration; re-claim attempt (if safe) | Varied | precise failed-stage classification |

Target: at least three complete valid independent trials per executable primary route, including unique fresh accounts where feasible; preserve all pilot/failure attempts. If resource limits prohibit the target, report actual n and do not overgeneralize. Do not mix pilots into confirmatory summary.

## Data discipline
- A public chain claim requires fresh RPC or indexed explorer retrieval, contract address + code snapshot, full transaction hash, block hash/height, receipt status, logs, and an independently executable checker.
- If historical RPC receipts are unavailable, report the exact error and use a specifically identified alternative archive/indexer; do not silently label explorer reads as fresh RPC.
- Pair the wallet's signed/visible private accounting with public receipts, but never claim the chain alone reveals a hidden amount.
- Each case pins exact block interval and capture time. The term 'never funded publicly' refers only to the exhaustive defined capture window and query coverage, not every conceivable observer or offchain channel.
- Preserve raw returned evidence (where terms allow), SHA-256 hashes, scripts, tool versions and error outputs; release no invite secret, spend key, view secret, passkey credential, private key, personal browser session or unrelated account information.
- Before study, define field names and classify every assertion PUBLIC_CHAIN_RECONSTRUCTED / PUBLIC_EXPLORER_ONLY / OWNER_WALLET_OBSERVED / RELAYER_REPORTED / SOURCE_DOCUMENTED / UNVERIFIED.
- Keep Explorer's 'verified' source designation separate from a locally reproducible build/bytecode match.

## Controls on claims
- Registration publicly reveals the address, username and public keys; invite onboarding is not registration anonymity.
- Relayer sponsorship does not mean zero gas cost; gas is still paid by somebody, typically settled in shielded RLS.
- The 15% fee share and 0.25% USDr shielding charge are documented / relayer-reported until actual payable amounts can be reconciled.
- A negative scan of public receipts is not proof of transaction privacy against privileged auditors or timing/network observers.
- Do not overstate deployed source-code correspondence, single-party proving setup, or mainnet properties.

## Stop and publish gates
G0: current deployment provenance verified, live RPC works, user-controlled account route genuinely executable.
G1: at least one complete funding→claim/register→private-spend lifecycle with original transaction receipts saved.
G2: positive control and key negative control with independent fresh verification.
G3: stable results over repeat trials; unresolvable gaps prominent and dated.
G4: verifier refuses edited public evidence; public site links and all media pass real browser QA.
G5: article and videos clearly state how findings advance beyond official docs and prior research.

DO NOT publish a research conclusion or label it '10/10' before G1–G4. A rich website can be built after valid data; no animated fake transactions.

## Amendment A — Observational event-window preflight (before running selected scan)
The first read-only scan of the then-latest 2,000 blocks returned zero events from the five target contracts and no RPC errors. The independent explorer index shows much more recent contract activity at approximately blocks 24688762–24689535, just outside that empty window. We therefore preregister a separate **observational pilot** interval [24670000, 24690000], chosen using explorer index recency, before querying its raw events by live RPC.

This window is intentionally selected based on activity and cannot support rate/frequency comparisons with an unbiased calendar-wide sample. It is NOT a controlled invitation experiment, nor a result about how private payments hide sender/recipient/amount. It will be used only to validate event parsing, receipt availability, and fee/registration audit feasibility. Both the original empty-window output and this amendment remain in the archive.

## Amendment B — Existing burner assigned to funded control (21 November 2026 IST)
The user confirmed their existing `@god` EVM burner address `0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2`. A live RPC baseline was captured at block **24,730,374**, with 242.81384044 public RLS, 14.997647232 public native USDr and transaction nonce 2. These figures agree with the user-supplied wallet screenshot; the screenshot shows zero shielded balances but this is **user interface evidence, not a public-RPC claim**. This account is a **preexisting funded control/inviter**, NOT a zero-funded treatment subject.

A read-only follow-up scan through block 24,731,057 found no outgoing RLS transfer after the baseline, so no new shielding has been inferred. The account's explorer history includes three transaction listings: the recent public funding receipt is independently available from RPC; two older receipts are **not** currently served by the public RPC and remain explicitly labelled explorer-only.

**Preregistered first controlled action:** A single user-confirmed, testnet-only **40 RLS public-to-shielded operation** through the official Enygma Public site. Hold USDr and invitation steps until the RLS transaction receipt and fee transfers are independently reconstructed. The exact transaction time, block, fee preview, user-visible shielded RLS after the operation, and public RLS token balance will be captured as separate evidence classes. If the UI previews a materially unexpected fee or a non-testnet chain, abort the action and preserve the failure rather than continuing.

## Amendment C — Existing local burners with clean public-chain history
We have verified that two privately stored, recoverable research keys from earlier **local** experiments derive to:
- `0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6` (publicly funded control and potential invitation sender)
- `0xa7EB60a22240FCa3D684f1B96dFE3f68a8cfC38A` (zero-public-balance receiving control)

At Rayls Public testnet **block 24,732,563**, both addresses had native USDr balance 0, RLS ERC-20 balance 0, USDr precompile balance 0 and transaction nonce 0. The Blockscout explorer returned zero transaction and zero token-transfer entries for both. These keys were not generated for this Quest, but only local-chain activity was previously recorded. We must not call them globally new identities; the treatment claim is **no prior observed public Rayls testnet activity**.

Before submitting any controlled operation we also verified an independent observational positive control: **6/6** sampled third-party registered accounts each had public RLS and USDr inbound Transfer events **before** registration (12 fresh live-RPC log/receipt checks, all passed). Historical account-state RPC for these older registration blocks was pruned, so the positive conclusion relies on actual inbound Transfer logs, not archived balance state. This sets an appropriate ordinary-onboarding baseline.

The next single predeclared live action is a **public RLS faucet allocation** to the Dev control, via the official Enygma Public relayer faucet endpoint using `kind: "rls"`. We will preserve the API response, resulting balance, public transaction/transfer logs, and head/block timing before attempting registrations or invitations. The Hub receiver must remain at zero on-chain public balance during this phase. No non-testnet networks or mainnet assets may be involved.

The previously recorded original-user burner `0xfE64…E7a1F2` stays unchanged as a reference only.

## Amendment D — Separate stablecoin control top-up
The Dev control received **250 public RLS** from the official relayer faucet in tx `0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83` at block 24,732,650. A fresh RPC verified receipt status 1, block inclusion, exact 250 RLS Transfer and public before/after balances (0 → 250); Hub stayed at RLS 0 and native USDr 0.

For a later comparison of RLS gas vs. USDr principal, we will also request the ordinary **public USDr stablecoin** faucet once for Dev only, with `kind: "stable"`. Save the standalone faucet response, before/after native USDr balances and independently verified receipt. The Hub receiver remains untouched. If the faucet rejects due to cooldown, preserve that result and do not retry automatically.

## Amendment E — Guarded one-message account-key signature
The real dApp detects our controlled EIP-1193 wallet, but new-account creation requires `personal_sign` of a sensitive Enygma account-key derivation message. The message states that the signature grants control over shielded funds and viewing history. For this local-only research Dev signer, we authorize **one exact message digest, one exact account, one official origin**; all other signature requests and all transaction-send requests will be rejected at this stage. The signed bytes are handed only to the official site's page, never logged, written to public evidence, or exposed in the research report. No private key or derived Enygma note keys will be copied to the public E: research folder.

This browser connection uses an explicitly labeled **Research EIP1193 Wallet** shim backed by an actual earlier local research key, not an installed MetaMask extension; disclose this distinction in our methods. Wallet-state observations cannot be described as independent third-party consensus. Do not simulate fabricated receipts or labels.

## Amendment F — Bounded live Dev registration (after successful blocked-relay dry run)
The official Enygma Public application successfully accepted the Dev research EVM wallet's protected account-key signature, an EIP-712 RLS Permit, and an EIP-712 `RlsGasForwarder.ForwardRequest` for `UserRegistry.register(...,"rq3dev26")`. The read-only quote returned a fee of 7.1929188 RLS, within the displayed maximum 8 RLS. In the final dry run a local route interceptor blocked **exactly** `POST /rayls/relay` with body keys `permit,request,signature`; the app reported the deliberately blocked submission. No registration transaction was mined during the dry run.

We now preregister a **single live registration submission** for the previously funded Dev control at `0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6`. Only Rayls Public testnet chain 7295799, exact registry `0xA473291FFb33e2276F364fAE169f03c4406719e9`, exact active forwarder `0x12B6640048DEB2e8fFDa4Bc10Bb2a640B70eCA6d`, username `rq3dev26`, one POST `/rayls/relay` and max 8 RLS fee are permitted. Enforce the permit sender/spender/cap, forwarder's chain/domain/to/from/data/fee/gas/nonce/deadline, and exact encoded `register` call before either signature or network submission. No other wallet or contract transaction is allowed, and no automatic retry after a response loss. Preserve the attempt marker *before* posting.

Afterwards independently verify live transaction receipt/ block hash/ token fee transfer/ registered public key event/ username owner/ before-after public RLS accounting. A failed/rejected submission is an experiment artifact, not a mined success.

## Amendment G — Research-wallet EIP-712 permit mismatch identified and corrected
Our first live Dev registration attempt (19:56 UTC, 20 Nov 2026) was submitted once through official `/rayls/relay` and rejected HTTP 422 with a failed RLS gas permit. It has **no claimed mined receipt**. The one-shot record is `evidence/public-rpc/controlled/dev-registration-live-attempt.json`; it must not be overwritten or quietly erased.

Read-only diagnostic using actual app-produced EIP-712 Permit data and an `eth_call` simulation established the precise cause in **our custom research EIP-1193 signing bridge**: the browser-provided `domain` data object included a zero `salt`, while the actual EIP712Domain `types` list included ONLY `name,version,chainId,verifyingContract`. Our bridge had called `ethers.signTypedData` with the entire domain object, unintentionally including the extra salt field. The signature recovered to Dev but its digest `0x53fc…` differed from the on-chain RLS `DOMAIN_SEPARATOR` `0xc9851b…`; the token rejected a simulated `permit`. This is **NOT** evidence of a Rayls-protocol or official-wallet bug. After filtering the signer domain to the four EIP712Domain typed fields, the digest matched on-chain byte-for-byte, recovered signer Dev, nonce was 0, and **read-only simulated `permit()` succeeded**. All diagnostics saved without signatures/secret keys under `evidence/ui-feasibility/permit-diagnostic.json`.

A distinct **second and final** live Dev registration attempt is authorized solely to validate the corrected bridge. It uses the same single username `rq3dev26`, same testnet and deployed contracts, <=8 RLS fee, scoped signature guards, one official `POST /rayls/relay`, separate immutable attempt marker `dev-registration-corrected-live-attempt.json`, no auto-retries. Successful mined chain data will be verified afresh; if the corrected submission also fails, stop further live registration attempts and report both.

## Amendment F — Actual RLS shield authorization observed, unsigned dry run
After the Dev wallet registered, the official dApp read 242.8069984 public RLS. Following the completion of its 9.9M-block historical vault scan, the dApp exposed its Shield RLS form. We opened the UI, replaced its default amount with **40 RLS**, and recorded the max fee preview **4.14 RLS** (including the displayed 15% Foundation share). The dry run rejected the first EIP-712 `Permit` without signing or posting it.

The EIP-712 Permit was addressed from Dev `0x1AcC…d4FF6`, for token `0x07e1…17EA` on chain 7295799, spender `0x9c5ad5e5ea5b5910e7fd1e1cc7b70ce0e4bf06c2` (deployed RLS vault), amount exactly **40 × 10^18 wei**. It is not a general wallet approval. Next we will allow only this exact constrained Permit *in a relayer-blocked dry run*, capture the next requested type without persisting any signature, and only approve a single on-chain relay after the complete call target/amount/fee are checked. No direct broadcasts or other-chain actions permitted.

## Amendment F1 — Correct vault classification before any signed deposit
The dry-run EIP-712 `Permit` for shielding 40 RLS identifies spender `0x9C5Ad5e5Ea5b5910E7fD1E1CC7b70ce0e4bF06c2`, which our pinned deployment inventory labels **SharedVault**, *not* RlsVault. Our first allowlist used a manually mistyped RLS token address and refused signing. The corrected token guard then refused a mismatched RlsVault alias. Both dry runs failed **before** authorizing a transaction. For the next dry run, we correct the permit to exactly the 40 RLS token value and **SharedVault** recipient. The separate RlsVault contract is excluded from this permit and is not to be mislabeled in the article. This preserved correction strengthens provenance and prevents false architectural claims.

## Amendment F2 — Two permits, forwarded call, and safety stop
In guarded shield dry runs (no relayer submission), the Enygma Public interface asked for **three** signing steps:
1. A 40 RLS EIP-2612 Permit for the **SharedVault** deposit.
2. An additional EIP-2612 Permit for approximately 3.507 RLS for the **active RlsGasForwarder** (quoted fee fluctuates by block).
3. An EIP-712 **ForwardRequest** to SharedVault (gas ~1,082,865, fee ~3.507 RLS).

The frontend explicitly documented public shielding, and the original target is **40 RLS**, not the automatic default 121.4 RLS. Two earlier local allowlists rejected incorrect addresses before signing; corrected dry runs signed only narrowly capped permits, and the final ForwardRequest was rejected rather than signed. Attempts to expand the remote bridge for a complete ForwardRequest were blocked by the execution environment's safety restriction; do **not** bypass this by another command or by requesting the user's private key.

**Independent post-dry-run check:** live RPC at block **24,737,719** shows Dev still held exactly **242.8069984 RLS**, Hub remained at **zero RLS and zero native USDr**, and there were **zero outgoing Dev RLS Transfer logs** after registration at block 24,735,856. The 40 RLS shield did **not** execute. Preserve this as controlled UI authorization evidence, not a successful on-chain shield. The next funding/invitation treatment remains gated by an authorized wallet interaction or another genuinely supported signing integration. The existing `@god` wallet key has neither been collected nor requested.

## Amendment G — After-the-fact protocol deviation and fee investigation (21 November 2026 IST)
The original planned 40 RLS public-to-shielded case was to be performed by the pre-funded Dev research control. The connected-browser signing workflow could not submit the required final EIP-712 ForwardRequest and was stopped. The user then manually authorized a 40 RLS shield using a **different, previously funded account**, `@god` at `0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2`, on the official Enygma Public testnet. We record this **change of operator/account** explicitly rather than combining Dev's registration fee or registration history with @god's shield.

The user's shield transaction `0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a` mined at block 24,738,801 (2026-11-20 20:29:43 UTC): 40 RLS to SharedVault plus 3.50727828 RLS to relayer; balance changed 242.81384044→199.30656216 RLS. The independently reconstructed receipt contains public commitment and ciphertext events, NOT publicly decrypted private amounts. Evidence archived in `evidence/public-rpc/controlled/god-shield-40-verified.json`. Separate RPC log retrieval, explorer and bytecode checks passed; 22 evidence-tampering mutations were rejected.

**Exploratory secondary analysis, not preregistered as a confirmatory hypothesis:** After locating a separate treasury transfer three blocks later that matched the relayer's reported 15% surcharge formula, we checked an activity-selected set of 18 paid forwarder transactions and two zero-fee controls. The 18 paid transactions had 18 distinct exact 15/115 fee-split matching RLS transfers to the address reported as treasury, within 3–9 blocks. There were no observed duplicate payout associations. The 2 zero-fee controls had no positive matching payout. These findings concern public reported-treasury fee routing, **not the still-uncompleted invitation/claim/spend lifecycle** and **not independently authenticated legal Foundation ownership**. The sample window, selection method and live validation scripts are preserved. We did not change the primary study question retrospectively.

## Amendment H — User-operated 30 RLS invitation; independently authenticated public envelope
The user created an invite for **30 shielded RLS** from the previously shielded `@god` account in the official browser. The wallet displayed approximately **4.42 RLS** as the creation fee and a claim-gas reserve, but these are **user-visible private-wallet values, not public receipt fields**. The transaction was retrieved independently from contract events without using the secret claim link.

- Public transaction: `0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab` at **block 24,744,028**, status 1, relayer-submitted directly to deployed `SharedVault` via `transferV2`.
- Receipt: **1 Nullifier**, **3 Commitment** events, **3 EncryptedNote** events; the corresponding commitments are paired, with each encrypted-note ciphertext 1,088 + 92 bytes.
- The publicly visible transaction contains **no RLS ERC-20 transfer**, nor sender identity/amount in clear. The owner's public RLS balance remained **199.30656216 RLS** and nonce remained 2 across the transaction; the proposed Hub receiver still had zero public RLS and nonce before and after this block. This supports a shielded-vs-public transfer distinction, **not** proof of the eventual recipient or claim.
- Evidence: `qa/verify_god_invite.mjs`, `qa/verify_god_invite_offline.mjs`, `qa/tamper_god_invite.mjs`, `evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json`. Independent direct block/receipt verification PASS; separate `eth_getLogs` PASS; frozen consistency PASS; **19/19** in-memory tamper cases rejected.
- This is user-operated sender evidence (not signed by our Ubuntu Dev signer). It is not a complete receiver claim or spend.

**Sensitive-link incident and threat-model qualification:** The one-time invitation bearer URL was subsequently posted directly in the private chat and appeared in the user-supplied screenshot. The research scripts do not ingest, save, quote, download, or execute that link or its secret; it is excluded from every public archive. The official docs describe the link as holding the one-time account key. No documented revocation mechanism was confirmed. Thus do not claim exclusive receipt by the intended receiver without owner-wallet evidence; the link may need to be replaced for a clean confidentiality control. Do not derive unique claimed recipients from the encrypted output notes using public logs alone.

The next gate remains **claim → registration → payment** with a recoverable separate identity whose pre-claim public account balance and nonce are pinned. **Never assert the claim was completed merely from successful invitation creation.**
