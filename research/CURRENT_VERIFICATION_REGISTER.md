# Rayls November Quest 3 — current independently authenticated evidence register
**Updated 21 November 2026, Asia/Kolkata. Primary research remains in progress until private outgoing spend is verified.**
This supersedes earlier draft-level status notes for current conclusions; the earlier notes and failed controls remain preserved for chronology.

## Original question and evidence classes
**Can a new Enygma Public account receive, register and subsequently spend shielded assets without ever publicly funding its EVM wallet?**
- `CONTROLLED_PUBLIC_CHAIN_VERIFIED`: independently reconstructed receipt, block inclusion, logs, deployed ABI and fixed-block state
- `OWNER_WALLET_OBSERVED`: the official application shows private values that public RPC cannot decrypt
- `EXPLORATORY_METADATA_CORRELATION`: public relayer treasury transfers arithmetically match the application's fee quotes, but lack a cryptographic payout→source ID
- `READ_ONLY_HISTORICAL_SIMULATION`: positive/negative eth_call replays with no mined transaction or side effects
- `PENDING`: tests requiring additional actual wallet action or their independent verification

## Executed controlled lifecycle

| Order | Operator/path | Public-chain artifact | Result / evidence class |
|---|---|---|---|
| 1 | Dev ordinary public funding | `0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83`, block **24,732,650** | 250 public RLS received, ERC20 receipt + before/after balance verified |
| 2 | Dev normal funded registration | `0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa`, block **24,735,856** | @rq3dev26 registered, 7.1930016 public RLS fee matched |
| 3 | @god public shield | `0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a`, block **24,738,801** | 40 RLS principal + 3.50727828 RLS relayer fee transferred publicly; commitment/encrypted note verified |
| 4 | @god private invitation | `0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab`, block **24,744,028** | Successful `SharedVault.transferV2`, 1 nullifier / 3 commitments / 3 encrypted notes, **no public RLS Transfer**. 30 RLS invitation principal is owner-wallet observed only |
| 5 | New passkey receiver private claim | `0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec`, block **24,747,924** | Successful separate `SharedVault.transferV2`, 1 nullifier / 3 commitments / 3 encrypted notes, **no public RLS Transfer** |
| 6 | New receiver registration | `0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b`, block **24,748,136** | `UserRegistered` + `UsernameSet("devil")` and `Relayed` fee of **0 public RLS**. No RLS Transfer |
| 7 | @devil outgoing shielded payment to controlled Dev | **Not submitted/verified yet** | **PENDING** — requires recipient account's protected passkey confirmation |

**Exact verified receiver EVM address:** `0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C` (source: mined `UserRegistered` and `UsernameSet` logs). All of these addressed histories remain zero after the claim and registration at sampled blocks: public RLS ERC20, public USDr, native balance, public EVM nonce. Independent scoped inbound/outbound token logs and indexer account histories are empty.

### Address correction audit
Previous screenshot-based receiver address `0x665E88A2867Cb53d05C1381D565e19Da0bC3e76C` was a transcription mistake. Two prior snapshots for that wrong account are **superseded**; see `evidence/public-rpc/controlled/receiver-address-correction.json`. Do NOT quote those snapshots or use them in the release. The authoritative evidence verifier reconstructs pre-claim **block 24,747,863** for the correct account and additional fixed-block checkpoints spanning both on-chain transactions.

### Wallet-observed claims vs publicly verified facts
- Official receiver `@devil` UI shows **17.304 shielded RLS**, after a **30 RLS** invite and approximate **12.70 RLS** claim fee.
- These private values cannot be extracted from the publicly visible `transferV2` receipt. The on-chain association is established by owner-controlled chronology and separate public registry event, not plaintext recipient/amount fields in the vault event.
- The one-time invite link was previously exposed in chat. This remains an exposed-link pilot, not a clean confidential-delivery or anti-theft guarantee.

### New fee metadata finding
Two private operations (invite creation and recipient claim) each had one unique vault nullifier transaction and one unique relayer→reported-treasury RLS payout in a fixed **[-12,+25]-block window**:
- Private invite: treasury transfer **0.576 RLS** after 4 blocks, implying gross **4.416 RLS** at 15% of base.
- Private claim: treasury transfer **1.656 RLS** after 2 blocks, implying gross **12.696 RLS** at 15% of base, reconciling 30−12.696=17.304.
- Registration had a zero onchain forwarder fee and no matching treasury payout in a +35-block window.
- Separately, 18 selected *public* paid-forwarder cases had 18 exact treasury payouts, with 2 zero-fee controls.
The privacy implication is **possible public fee-metadata inference given correlation and public relayer payout policy**, NOT plaintext recovery of shielded payment amount or payee. Two controlled private examples are too small for a network-wide classifier. Recipient legal entity is relayer-reported, not independently authenticated Foundation ownership.

### State replay controls
Two exact public calldata witnesses (invite and claim) each returned `true` via `eth_call` against the block **before** mining and reverted at the mined block and next block. **2 positive, 4 negative** controlled simulations, no signed or broadcast transactions. Supports state-dependent replay rejection, not a full cryptographic proof of the specific revert mechanism.

## Executable checks
```bash
# Requires Node 22+, Python 3 and requests, pinned ethers via experiments/browser npm ci
cd experiments/browser && npm ci && cd ../..
node qa/verify_god_shield.mjs
node qa/verify_god_invite.mjs
node qa/verify_receiver_onboarding.mjs
node qa/verify_receiver_onboarding_offline.mjs
node qa/tamper_receiver_onboarding.mjs
python3 qa/verify_private_fee_sidechannel.py
python3 qa/verify_private_fee_sidechannel_offline.py
python3 qa/verify_private_fee_sidechannel_offline.py --tamper-tests
python3 qa/verify_private_replay_controls.py
python3 research/reconcile_fee_treasury_controls.py
python3 qa/verify_treasury_controls.py --tamper-tests
```
- Published artifact should contain all public receipts and scripts, plus SHA-256 manifest and fresh-extraction QA, **never private note credentials, wallet signing keys or bearer invite URL**.
- Independently authenticated replay + fee traces should remain labeled with their evidentiary limits.
- Do not state **ZERO PUBLIC FUNDING IS PROVEN FOR ALL EVM TOKENS/ALL CHAINS**. The tested account, RLS, USDr, EVM native nonce, and public logs are scoped to Rayls Public testnet.
- Do not submit final article or publicly present the website as finished until the receiver's outgoing private spend and its controls are genuinely executed.

## Immediate next experimental gate
1. From the new `@devil` passkey wallet, submit a **3 RLS shielded send to @rq3dev26**, assuming a feasible displayed fee. Preserve the precise on-chain hash and owner-wallet after-balance.
2. Independently authenticate the mined `SharedVault.transferV2` receipt, before/after public state for @devil and @rq3dev26, fee trail and note topology; distinguish receipt proof from owner wallet decryption.
3. Run a read-only historical replay/negative control on this new spend if feasible and freeze final source/ABI/evidence into a private-safe manifest.
4. Complete website, visuals, three silent video recording prompts and final article; user handles recording/editing and publishing.

## Archived-state pruning and reproducibility amendment
The original Shield live verifier later failed an archived `eth_call` with the RPC error `state at block #24738801 is pruned`. This failure is preserved in `release/receiver-checkpoint-pruned-state-failure-report.json`; it is **not** falsely represented as a successful direct archived-state query. Instead, `qa/verify_god_shield_postprune.py` queried the current RLS balance on public RPC and independently searched **50 directed token-event windows** over the entire post-shield range, with complete explorer index corroboration. It reconstructed 242.81384044 RLS before and 199.30656216 after the original shield, exactly matching the frozen capture. This new PASS is an **event-based reconstruction with current state**, subject to the assumption that every relevant RLS balance-changing mechanism emits the usual ERC20 Transfer events. It is not a direct historic state proof.
