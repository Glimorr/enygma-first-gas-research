# I Sent a Private Payment From a Rayls Wallet With Zero Public RLS

Rayls Enygma Public is designed to let a new user receive shielded funds without first acquiring public gas tokens. The detail that interested me was not the welcome screen. It was whether I could trace the entire onboarding process on a real testnet and separate the things an ordinary block explorer sees from the things only the user's wallet can reveal.

I built two different starting conditions on Rayls Public Chain Testnet. One wallet followed the familiar path of public funding and registration. A second wallet was created with a new passkey and opened an invitation sent privately from a separate funded account.

The first comparison was straightforward. The second produced a result worth examining more closely: **the new account claimed an invitation, registered a public username and then made a private 3 RLS payment while its public RLS, USDr, native balance and EVM transaction nonce stayed at zero.**

There was another detail I had not expected to be this clean. Although the private invitation, claim and outgoing send did not reveal their principals through public token transfer events, the relayer's separate treasury transactions were consistent with the fees shown in the wallets.

I preserved the raw evidence, the commands that reproduce it and the failures I encountered along the way.

## The control: an ordinary funded wallet

I started with a Dev research wallet and funded it with **250 public RLS** through the testnet faucet. That transfer mined in block **24,732,650**. The token transfer and its before-and-after balance were independently checked against the public RPC.

Next, I registered the wallet under **@rq3dev26**. Registration succeeded at block **24,735,856** and charged **7.1930016 RLS** through the publicly observable relayer payment path. The registry event, fee event and actual RLS token movement agreed exactly.

The purpose of this control was simple. It demonstrated the usual public funding history that a block explorer could reconstruct when an account pays to begin using the chain.

[Dev funding transaction](https://testnet-explorer.rayls.com/tx/0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83)

[Dev registration transaction](https://testnet-explorer.rayls.com/tx/0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa)

**Insert Figure 1 — Seven actual testnet milestones:** `figures/F01-07-actual-chain-milestones.png`

## Shielding is public. The later invitation is different.

I used a second, previously funded testnet account, **@god**, as the inviter.

The first operation moved **40 RLS** from its public token balance into the Enygma SharedVault. The source balance fell from **242.81384044 RLS** to **199.30656216 RLS**. Two public transfers explain that complete difference:

- **40 RLS** went to the vault.
- **3.50727828 RLS** went to the relayer as the fee.

That is not an anonymous deposit. The source address, vault address, amount and fee are visible in public ERC-20 transfer events. The transaction also recorded its commitment and encrypted-note output.

[40 RLS public shielding receipt](https://testnet-explorer.rayls.com/tx/0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a)

From the shielded balance, I created a **30 RLS invitation** in the official application. Its public receipt looked different.

The underlying `SharedVault.transferV2` transaction emitted **one nullifier, three new commitments and three encrypted notes**, without a plaintext 30 RLS transfer in those logs. The amount came from the owner's wallet display, not from independently decrypting public chain data.

This distinction matters. A successful encrypted-note event is strong evidence that the contract processed a shielded operation. It does not, by itself, identify the private receiver or disclose the private amount.

[30 RLS invitation transaction](https://testnet-explorer.rayls.com/tx/0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab)

**Insert Figure 2 — Public and shielded transaction footprints:** `figures/F02-public-vs-shielded-footprints.png`

## A fresh passkey account claimed without public funding

I then used the invitation in a separate browser profile and created a new passkey-controlled recipient. The receiving account was later registered as **@devil**.

The official wallet displayed **17.304 shielded RLS** after the private claim. The public chain recorded the claim at block **24,747,924** through another `SharedVault.transferV2` call. Just like the invitation creation, the receipt showed a nullifier, three commitments and three encrypted notes, rather than a public token credit to the recipient.

The receiver's separate registration followed in block **24,748,136**. The `UserRegistered` and `UsernameSet` events confirmed the new account and the username **devil**. The relayer handled the registration, and its public `Relayed` event showed a fee value of **zero RLS**.

The more important control was the account's own public balance history.

I reconstructed the receiving EVM address directly from the mined `UserRegistered` event. I then queried its RLS token balance, USDr token balance, native balance and EVM transaction count at fixed public-chain heights before and after the claim and registration. I also searched relevant public token-transfer events for the account.

Across those checkpoints, the tested public balances and account nonce remained **zero**. No public RLS or USDr transfer arrived in the observed interval, and the explorer showed no normal account transactions.

That is narrower and more defensible than a claim that the account is invisible. The registration username and address are public. The private value shown in the wallet is not public RPC data. The experiment was conducted on Rayls Public Chain Testnet, not every EVM chain or every token contract.

The invitation link had previously been shared in the research conversation. That means this is an **exposed-link onboarding pilot**, not a clean experiment proving confidential delivery of a bearer link. This incident is recorded in the method instead of being removed from the history.

[New wallet private claim](https://testnet-explorer.rayls.com/tx/0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec)

[New wallet public registration](https://testnet-explorer.rayls.com/tx/0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b)

**Insert Figure 3 — Recipient's public state before and after claim:** `figures/F03-recipient-before-and-after.png`

## Sending from the new wallet with no public RLS

The claim and registration were only the first part of the experiment. I wanted to see whether the new wallet could make its **first outgoing private payment** without ever receiving public RLS.

From the @devil passkey wallet, I selected **shielded RLS**, addressed the payment to the already registered **@rq3dev26** research wallet, and submitted **3 RLS**. The application accepted the payment and showed its success screen. This was a real action signed or approved by the wallet operator, not a synthetic locally generated example.

The transaction mined in block **24,760,126**, with receipt status 1. Independent public RPC reconstruction confirmed the relayer-to-SharedVault `transferV2` call, one nullifier, three new commitments, three encrypted notes, and matching data from a separate log query.

The private spend did **not** create a public token transfer from @devil. I checked the actual recipient's public RLS and USDr balances, native balance, EVM nonce, and scoped token-transfer history again after the send. The publicly unfunded account still had **zero public RLS, zero public USDr and an account nonce of zero**.

There was an independent positive check on the receiving side. I reconnected the controlled @rq3dev26 account to the official Enygma testnet in a **read-only browser session**, using its existing authorized research wallet. Its account dashboard showed **3 shielded RLS**, while retaining its original **242.8069 public RLS**. No new transaction was signed or sent from that receiving wallet in this check.

That distinction is important. The sender's success screen and the separate receiving wallet establish the human-operated **3 RLS amount and recipient**. The public vault receipt establishes that a private transaction was mined, **not** that a public observer can decode either private fact from its events.

[Read the first private payment receipt](https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8)

For this one controlled lifecycle, I verified the full sequence: **new passkey → private invitation claim → public registration without public funding → first outgoing shielded send**. That is a stronger result than merely opening an invitation or seeing a positive balance after the claim.



## The surprising part was the fee trail

The Enygma vault's private transfer receipt does not reveal the payment principal. But the relayer also creates separate public transactions to settle some fees.

For the 40 RLS public shield, the gross relayer fee was **3.50727828 RLS**. Three blocks later, a separate RLS transfer of **0.45747108 RLS** went from the relayer to an address identified as treasury by its configuration.

The amounts reconcile exactly when the 15% share is applied to the base fee, not to the gross fee:

**3.04980720 RLS base + 0.45747108 RLS surcharge = 3.50727828 RLS gross.**

I checked an activity-selected collection of public-forwarder transactions. The sample contained **18 paid operations**, each followed by one distinct matching reported-treasury transfer. There were also **two zero-fee controls** without positive matching payout. This is a selected testnet sample, not an estimate of how all relayers behave.

Then I checked **three actual private operations** from the same controlled invitation lifecycle.

The invitation transaction was followed four blocks later by a reported-treasury RLS transfer of **0.576 RLS**. Applying the publicly reported fee-share formula implies a gross fee of **4.416 RLS**. The official wallet had shown approximately **4.42 RLS**.

The later private claim had a separate **1.656 RLS** treasury transfer two blocks afterward. It implies a **12.696 RLS** gross fee, consistent with the wallet's rounded **12.70 RLS**. The arithmetic also reconciles the recipient's wallet observation:

**30 − 12.696 = 17.304 shielded RLS.**

The first outgoing 3 RLS private payment gave me a third independent comparison. Its SharedVault transaction was followed four blocks later by a separate treasury transfer of **0.576 RLS**, implying **4.416 RLS** gross fee under the same formula. The wallet had shown **4.42 RLS**, rounded. Its dedicated receipt, block inclusion and transfer bytes were checked, too.

For each of the three private operations, I searched a fixed 38-block window, from 12 blocks before the operation to 25 blocks after it. Each window contained just one relevant vault-nullifier transaction and one relayer-to-treasury RLS transfer. A separate registration receipt with zero public fee had no matching payout in the subsequent 35-block window.

The result is evidence of **fee-level metadata correlation**, not a decryption of private payments.

The on-chain treasury transfer carries no cryptographic pointer tying it uniquely to a particular shielded note. The reported treasury address is drawn from relayer configuration and its legal ownership was not independently authenticated. Three controlled private cases from one lifecycle are still too few to support a general network-wide inference rate.

Still, the result suggests a useful design consideration for private payment infrastructure: hiding the principal and recipient does not automatically hide the economic metadata of a fee settlement.

**Insert Figure 4 — Private operation fee trail:** `figures/F04-private-fee-trail.png`

## A replay check using historical chain state

I also tested whether the exact public calldata for the private invitation, claim **and outgoing 3 RLS send** would behave differently before and after their original settlement.

Using read-only `eth_call`, I executed the same call data against the block immediately preceding each transaction. All three pre-settlement simulations returned success.

The same call data reverted when simulated against the state at the mined block and one block later. The original RPC responses and calldata hashes are retained because the live testnet RPC later pruned some of those historical block states; I no longer describe those old simulations as freshly rerunnable against the current endpoint.

That gave me **three positive** and **six negative** read-only results without submitting any additional transactions.

The observed behavior is consistent with nullifier state being consumed by a successful shielded operation. I cannot isolate the exact reason for each revert from these simulations alone, and this is not a complete cryptographic replay-security proof.

**Insert Figure 5 — Before and after historical-state replay controls:** `figures/F05-historical-state-replay-controls.png`

## What verified

The public funding and registration control completed on Rayls testnet. The 40 RLS shield deposit and its exact public fee reconciled. The 30 RLS invitation and the new passkey receiver's private claim each had independently authenticated encrypted-note receipts. The new account registered as @devil and then sent a 3 RLS shielded payment to @rq3dev26, confirmed by both user-controlled wallet views and the mined vault receipt, while its tested public RLS, USDr, native balance and EVM nonce stayed zero.

The fee analysis also reproduced selected public-forwarder treasury transfers and identified three correlated fee settlements around actual invitation, claim and first-spend operations. These public traces do not reveal the shielded payment principal.

**The study contains one researcher-controlled private onboarding-to-spend lifecycle.** The direct shielded-faucet comparator was not performed, the invitation link was exposed in the research conversation, and an auditor-side decrypted view was not independently tested. These constraints define the conclusion, rather than being silently generalized to the whole network.

**Insert Figure 6 — Evidence classification:** `figures/F06-evidence-taxonomy.png`

## How to reproduce

The evidence register contains raw public receipts, fixed-block state checks, independently decoded events, selected transaction hashes, contract ABI snapshots and an integrity manifest.

The project can be reproduced using Node 22+, Python 3 and the stored public RPC endpoints:

```bash
cd experiments/browser
npm ci
cd ../..

node qa/verify_receiver_onboarding_pruned_rpc.mjs
node qa/tamper_receiver_onboarding.mjs
node qa/verify_devils_first_private_spend.mjs --tx 0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
node qa/verify_private_spend_offline.mjs
node qa/tamper_private_spend.mjs
python3 qa/verify_private_spend_public_payout.py
python3 qa/verify_private_fee_sidechannel.py
python3 qa/verify_private_fee_sidechannel_offline.py --tamper-tests
python3 qa/verify_private_replay_frozen.py
python3 qa/verify_god_shield_postprune.py
```

The final archive is separately extracted and checked before publication. The evidence-tampering suites rejected **144 of 144** deliberate changes across the initial shield, fee sample, invitation, new receiver, private fee study and first private spend. Those tests show that the reconstruction is sensitive to corrupted data. They are not proofs that the entire privacy protocol is secure.

## Issues fixed

Two problems were worth keeping visible.

First, I manually transcribed one character of the new receiver's EVM address incorrectly from a screenshot. The correct address came from the actual `UserRegistered` event. I preserved the original failed baseline and excluded it from the published evidence set, then rebuilt the correct account's entire pre-claim and registration history.

Second, the public RPC eventually pruned the state at the early 40 RLS shield block. The originally successful historical state query later failed. Rather than report that it still worked, I wrote a separate checker that starts from the latest RLS token balance and reconstructs the earlier balance from all intervening public ERC-20 transfer events. Fifty directional log windows and a separate explorer index comparison recovered the same **242.81384044 → 199.30656216 RLS** values. This is event-based reconstruction, not a direct archive-state read.

An early testnet faucet request also hit a rate limit and was preserved as a failed attempt. Later browser-signing tests did not produce a valid 40 RLS shield transaction from the Dev signer; the completed shield was a separate user-authorized transaction from @god and is labeled accordingly.

## Sources visited

- [Rayls Enygma Public documentation](https://docs.rayls.com/docs/enygma-public)
- [How Enygma Public works](https://docs.rayls.com/docs/how-enygma-public-works)
- [Who sees what](https://docs.rayls.com/docs/enygma-public-who-sees-what)
- [Rayls Enygma Public testnet guide](https://docs.rayls.com/docs/try-enygma-public-on-testnet)
- [Rayls Public Chain testnet explorer](https://testnet-explorer.rayls.com/)
- [Rayls Public Chain testnet JSON-RPC](https://testnet-rpc.rayls.com/)

The research is independent and was conducted with testnet wallets and researcher-controlled transactions. It does not represent an official Rayls security audit or a mainnet result.

**Video 1:** Public funding control, private invitation and the new wallet’s first private spend — [insert actual video link after recording]

**Video 2:** Public treasury fee metadata behind three private operations — [insert actual video link after recording]

**Video 3:** Independent recipient confirmation, replay checks and evidence corruption controls — [insert actual video link after recording]
