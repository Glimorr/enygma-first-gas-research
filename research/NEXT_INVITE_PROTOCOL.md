# Next controlled experiment — private invitation and the first-gas question

**Pre-execution protocol, dated 21 November 2026 (IST). Not a result.**

## Objective
Determine whether an account with no prior public Rayls-testnet funding can claim an invite and subsequently initiate a shielded payment, while paying claim/registration and payment fees from the shielded RLS it receives. This is the central unresolved Quest 3 hypothesis, beyond the completed public-shield and treasury-payout studies.

## Pre-existing controlled conditions
- **Inviter:** user-controlled `@god` account at `0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2`, with 40 RLS deposited into SharedVault in tx `0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a`. Public-chain evidence confirms the deposit, but not present private spendability.
- **Potential zero-public-funding receiver:** separate Hub research wallet `0xa7EB60a22240FCa3D684f1B96dFE3f68a8cfC38A`; at block 24,740,175 it had zero public RLS/USDr, nonce zero, zero indexed transactions/transfers and no registry entry. Previously used only on local research chains; this fact must be disclosed.
- The receiver must have a recoverable, authorized signer. If claim must use a separate fresh passkey account instead, capture **that account's** public EVM address/baseline before claim. Do not reuse the Hub baseline as evidence for a different address.
- Do not submit or reproduce any invite secret, claim link, passkey PRF output or spending key in public datasets, screenshots or chat.

## Proposed trial I1 — one-time invitation
1. In the official Enygma Public testnet, under `@god`, confirm private shielded RLS note is available in the user wallet UI (owner observation).
2. Create one invitation with **20 shielded RLS** as a predeclared principal. Capture the displayed fee quote, local timestamp, and public transaction hash. If fee or chain is unexpected, stop and preserve the failure, never auto-retry.
3. Record only non-secret data: invite transaction hash, block, receipt, `Relayed` event, vault commitments/nullifiers/encrypted notes and token-transfer logs, fee policy. The link and the key in it must remain private.
4. Preserve the inviter's public RLS balance and nonce before and after (because private payment claims should not publicly debit the EVM account).
5. Freeze recipient EVM address and pre-claim block, then check public RLS/USDr balances, nonce and registry registration before claim; inspect history for prior incoming public funds.
6. Claim the invite with a **separate recoverable account**. Verify claim and registration as separate receipts if applicable; do not infer the claim succeeded just because the UI displayed success.
7. Check that public funding remained zero during the exact predeclared claim interval. Distinguish registry user/address visibility from hidden payment details and owner-only balances.
8. After wallet confirms spendable shielded RLS, initiate a separate, non-round **3 RLS** shielded send to a registered controlled recipient if gas quotes permit. The amount/recipient can only be established from controlled wallet evidence, not public RPC alone.
9. For a negative control, attempt an already-claimed invitation only if the UI provides a safe duplicate-action route, recording the exact failure stage without constructing an exploit.

## Positive and confounding controls
- Public ordinary onboarding: Dev received 250 public RLS, registered via paid public transaction, and its fees were fully verified. This is a different account and must remain distinct from `@god`.
- Direct shielded faucet: the relayer's read-only API advertises shielded RLS/USDr routes. A third clean, recoverable account is required to test whether zero-public-funding behavior is invite-specific. This arm is **not** executed yet.
- Separate fee controls: 18 paid forwarder transactions, with 18 subsequent exact matching reported-treasury payments, plus two zero-fee controls. These are exploratory secondary findings, not substitutes for the recipient treatment.

## Evidence gates before final website/article
- At least one original invite→claim→private spend lifecycle actually mined.
- Distinct public address, time, full hash, block hash, status, events, and fixed-block state for every stage, with independent fresh public-RPC reconstruction.
- At least one negative control and a matched alternative onboarding mechanism. Prefer three separate complete trials if resources permit; report actual n.
- Rerunnable scripts, hash manifest, data classification, deliberate corruption checks and an honest failure log.
- Never infer 'anonymous sender' from an absent EVM sender or a negative public scan; address/registry visibility and auditor access remain important qualifications.

## Security and authority boundary
The user's existing `@god` browser passkey/credential is not available to this Ubuntu automation. User permission does not bypass secure signing restrictions. Authorize the operation through the official app's own wallet confirmation; do not paste private keys or invite link secrets into chat. If the protected action cannot be performed by available tools, the operator must confirm it in their wallet. Preserve every transaction action as an explicit voluntary testnet action rather than assume background consent.
