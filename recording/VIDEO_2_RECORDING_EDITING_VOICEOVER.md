# VIDEO 2 — What a Private Transaction's Public Fee Trail Reveals
## Complete recording, editing and text-to-speech guide · Rayls November Quest 3

**Target runtime:** 3:05–3:25. **Capture:** real testnet explorer and read-only terminal only; 1920×1080 at 60 fps. **Article placement:** immediately after Figure 4 in the public-fee-trail investigation. **Focus:** an original fee-metadata observation, not a claim that Enygma payment principals are decrypted.

### The experiment in one sentence
I used the reported relayer fee formula, public ERC20 transfers and fixed block windows to examine 4 **selected controlled private operations** (one invitation, one claim, two private sends). Each had a distinct nearby reported-treasury transfer with exact implied fee arithmetic. The 30 time-shifted windows were sparse local placebos, not a network-wide inference-rate study.

### Prepare the evidence tabs
Open our research website fee explorer and F04-private-fee-trail.png. Have Explorer tabs for the source operations and their separate treasury payments, with the source and target blocks visible. Do **not** use manufactured animations to replace the real RPC evidence.

### Source-transaction and payout pairs to display accurately

| Controlled operation | Source tx block and type | Reported-treasury payout | Share RLS | Implied gross fee RLS | Gap |
|---|---|---|---|---|---|
| 30 RLS invitation | block 24,744,028; private transferV2 | 0x3650f335ce12fe0c2ad4616aa7d595503e44e18b141e35121fc7cc7f077377f1 | 0.576 | 4.416 | +4 blocks |
| Private invitation claim | block 24,747,924; private transferV2 | 0xc9e3b527d27b152bde59a9529679dcbf2d4237dda1c7f7c2564ad9cff18ab116 | 1.656 | 12.696 | +2 blocks |
| First 3 RLS private send | block 24,760,126; private transferV2 | 0xd639df4cd7d62ea031a313ec5b3b9f6b46241aebe599b29867bf7a3e7302bb32 | 0.576 | 4.416 | +4 blocks |
| Second 3 RLS private send | block 24,767,795; private transferV2 | 0x1e98495ef31b41a8dab93f1a2b284f81991987000a3c69c958287e82f6e9fa8f | 0.576 | 4.416 | +4 blocks |

For the relayer-reported policy, the public reported-treasury share is **15% of the BASE fee** (hence 15/115 of GROSS), not 15% of gross. For 0.576 RLS share: base = 0.576 × 100/15 = 3.840; gross = 3.840 + 0.576 = 4.416 RLS. For 1.656 share: base = 11.040, gross = 12.696 RLS. Do not call either gross fee the private amount sent.

### Detailed shot-by-shot timeline

| Time | Real screen to capture | Edit, motion and precise caption |
|---|---|---|
| 00:00–00:12 | Site fee visual + one actual private send receipt | Bold but restrained hook: **PRIVATE PRINCIPAL HIDDEN · FEE MOVEMENTS PUBLIC** |
| 00:12–00:33 | Original public 40 RLS shield ERC20 logs; then separate public payout 0.45747108 RLS | Animate arithmetic: **3.04980720 BASE + 0.45747108 SURCHARGE = 3.50727828 GROSS** |
| 00:33–00:48 | Read-only terminal selected public-forwarder control summary; show 18 paid cases and 2 zero-fee cases | Small caption: **ACTIVITY-SELECTED SAMPLE · 18 MATCHED PAID + 2 ZERO-FEE CONTROLS** |
| 00:48–01:08 | Open private invitation source and independent treasury payout +4 blocks, then source-screen fee quote | **INVITATION · SHARE 0.576 · IMPLIED GROSS 4.416 RLS** |
| 01:08–01:27 | Private claim source and payout +2 blocks, plus owner's 17.304 shielded RLS | **CLAIM · SHARE 1.656 → GROSS 12.696 · 30 − 12.696 = 17.304** |
| 01:27–01:46 | First 3 RLS send source and separate payout +4 blocks | **FIRST SEND · GROSS 4.416 RLS**; don't imply principal visible publicly |
| 01:46–02:06 | Second 3 RLS send and distinct separate payout +4 blocks | **SECOND SEND · GROSS 4.416 RLS** |
| 02:06–02:24 | F04 original three-cohort data cards, then add the **separate second-cohort payout receipt** alongside | **3 ORIGINAL CASES + 1 SECOND-COHORT CASE = 4 SELECTED OPERATIONS**. F04 itself only depicts the original three |
| 02:24–02:43 | Read-only terminal runs shifted placebo checker; hold the recorded 0/30 hits | **30 FIXED SHIFTED WINDOWS · 0 TREASURY PAYOUTS / 0 NULLIFIERS**. Add: **Sparse local controls; not traffic-matched** |
| 02:43–03:00 | Fee-free @devil registry, no positive payout; two zero-fee public controls | **NEGATIVE CONTROLS · NO PAID OPERATION TO MATCH** |
| 03:00–03:16 | Site scientific boundary paragraph, then full F04 | Closing: **METADATA CORRELATION ≠ PRIVATE AMOUNT RECOVERY** |
| 03:16–03:24 | Outro research website and source repository | **ORIGINAL RECEIPTS + REPRODUCTION IN THE X ARTICLE** |

Figure F04 intentionally depicts the **first cohort's three** invitation/claim/first-send cases. Its original printed note incorrectly points readers to Figure 7 for the fourth fee case: Figure 7 only illustrates funding routes and shared recipient; the fourth fee case is independently documented by the separate second-send receipt and payout. In the edit, clarify this using a real extra transaction/payout card rather than claiming F04 itself displays four cases. Keep the frozen original figure unchanged to preserve provenance.

A 3:25 cut is preferable to speeding through fee arithmetic. Hold each exact fee equation for 3–5 seconds; use high-contrast static typography rather than excessive animated digits.

### One-time Node setup before recording
The public research ZIP intentionally does not bundle node_modules. I tested the pinned dependency installation in a separate working copy. Execute this once before capturing, **never inside the pristine manifest-check folder**:

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK/experiments/browser
npm ci --ignore-scripts --no-audit --no-fund
cd ../..
~~~

This installs local JavaScript dependencies only; it does not sign or broadcast any blockchain transaction. The existing connected Ubuntu working copy has already completed the installation.

### Commands to execute live (public chain read-only or offline)
Start from the extracted public release. These programs have already been part of the tested reproducibility package; execute the exact script from the frozen version. Prefer a real PASS summary over a time-compressed wall of JSON.

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK

python3 qa/verify_treasury_controls.py
python3 qa/verify_private_fee_sidechannel_offline.py
python3 qa/verify_private_spend_public_payout.py
python3 qa/verify_faucet_cohort_private_spend_public_payout.py
python3 qa/verify_private_fee_shifted_nulls.py
~~~

The first two check selected public relayer fee controls and source-dated private fee observations; the payout checks read the original public transaction and distinct public payouts. Historical comparison windows are an exploratory local control. If a service is unavailable during filming, use the exact frozen report and say "saved original evidence" rather than implying live RPC re-execution succeeded.

### Source Explorer links
- 40 RLS public shield: https://testnet-explorer.rayls.com/tx/0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a
- Invitation source: https://testnet-explorer.rayls.com/tx/0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab
- Invitation treasury payout: https://testnet-explorer.rayls.com/tx/0x3650f335ce12fe0c2ad4616aa7d595503e44e18b141e35121fc7cc7f077377f1
- Claim source: https://testnet-explorer.rayls.com/tx/0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec
- Claim treasury payout: https://testnet-explorer.rayls.com/tx/0xc9e3b527d27b152bde59a9529679dcbf2d4237dda1c7f7c2564ad9cff18ab116
- First private send: https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
- First send treasury payout: https://testnet-explorer.rayls.com/tx/0xd639df4cd7d62ea031a313ec5b3b9f6b46241aebe599b29867bf7a3e7302bb32
- Second private send: https://testnet-explorer.rayls.com/tx/0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb
- Second send treasury payout: https://testnet-explorer.rayls.com/tx/0x1e98495ef31b41a8dab93f1a2b284f81991987000a3c69c958287e82f6e9fa8f

### What the evaluator must be able to follow
- Show **two distinct mined public transactions** for source operation and payout; do not cut from a transaction hash to an unrelated treasury transfer without both block numbers.
- Fee formula is verified under the **reported** relayer policy. The reported treasury owner is not independently verified.
- 4/4 refers to **selected** private operations, not all Enygma network transactions; the events do not cryptographically tie a private note to a treasury payout.
- The fee side channel does **not** reveal 3 RLS private principal. Private amounts and usernames are sourced from owner-wallet evidence.
- The 30 controls are low-traffic shifted windows, not randomized contemporaneous traffic-matched samples, and must not be plotted as an attack true-positive rate.
- Include original errors or missing public RPC state only with honest provenance labels; never hide an adverse result to create a perfect-looking demo.

### FINAL TEXT-TO-SPEECH SCRIPT — VIDEO 2
Voice direction: Natural adult female narrator with careful numerical pacing, approximately 135–145 words per minute. Say RLS as **R L S**, and say "treasury" as a reported destination. Avoid the words "decrypted," "identified every sender," or "proven privacy vulnerability." Paste only the following spoken paragraphs into TTS.

While following the two private payment lifecycles, I noticed something else on the public chain.

The vault transaction didn't reveal the amount of the private payment, but the relayer still moved public RLS while settling its fees.

I first checked a completely public forty RLS shield. Its fee was three point five zero seven RLS. A separate public treasury transfer appeared three blocks later. The arithmetic matched the relayer's reported policy: fifteen percent added to the base fee, not fifteen percent taken from the final total.

I then checked eighteen selected paid public-forwarder operations, plus two zero-fee controls. The paid operations had matching reported-treasury transfers in their chosen windows, while the zero-fee controls did not.

The private transactions were more interesting.

For the thirty RLS invitation, the nearby treasury share was zero point five seven six RLS. That implied a gross fee of four point four one six RLS, matching the rounded quote in the wallet.

For the invitation claim, the treasury share was one point six five six. The implied gross fee was twelve point six nine six RLS. Subtracting that fee from thirty left seventeen point three zero four RLS, exactly what the receiving wallet showed.

Both private three RLS sends also had separate nearby treasury transfers. Each implied a gross fee of four point four one six RLS.

I also checked the second wallet's public twenty RLS shield. Its exact fee was three point five two five eight RLS, with a matching reported treasury share of about zero point four six RLS. That public deposit exposed its originating address and principal, unlike the later private transfer.

That was four matching selected private cases.

To avoid relying on coincidence alone, I checked thirty fixed time-shifted comparison windows. None contained a matching payout or vault nullifier. Those windows were quiet, so they are a local timing control, not a network-wide accuracy measurement.

And this point matters: a public treasury transfer doesn't name the private sender or recipient, or reveal the payment principal.

What I found was a reproducible fee-metadata correlation around selected controlled operations, not a decryption of Enygma payments. The original receipts and code are linked in the article.
