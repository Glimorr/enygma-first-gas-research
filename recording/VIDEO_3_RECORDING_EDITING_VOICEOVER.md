# VIDEO 3 — Can Someone Else Reconstruct the Evidence?
## Complete recording, editing and text-to-speech guide · Rayls November Quest 3

**Target runtime:** 3:05–3:25. **Format:** 1920×1080 at 60 fps, real read-only terminal and deployed website footage. **Article placement:** after the article's "How to verify the results yourself" section and **before** "Issues fixed". **Goal:** Show what can be independently checked, what was observed only by controlled wallets, and why the original data survives tampering and RPC pruning.

### What the evaluator should understand
This video is about an independently reproducible **evidence package**, not a new wallet transaction. The final published archive contains 172 source files, seven 1600×900 article PNGs and source-based verifiers. The released archive passed 31/31 clean-extraction checks, the deployed website passed 72/72 cross-device browser checks, and the seven tamper suites rejected 182/182 deliberately corrupted **offline evidence copies**. Historical replay results were observed live originally and later verified from preserved source-dated responses after testnet historical state was pruned.

### Start from an uncontaminated, public-only source
Use the public ZIP or its already extracted exact bytes:
- https://glimorr.github.io/enygma-first-gas-research/evidence/rayls-wq3-two-cohort-evidence.zip
- Manifest integrity capture (untouched): /mnt/e/Rayls-Nov-Week3/recording/public-release-PRISTINE
- Script execution capture (separate working copy): /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK
- Published QA report: https://github.com/Glimorr/enygma-first-gas-research/blob/main/qa/TWO_COHORT_RELEASE_QA_REPORT.json
- Live site: https://glimorr.github.io/enygma-first-gas-research/

Show the ZIP name, MANIFEST.sha256, seven figure names and top-level research source tree. Do not show a private workspace, home-folder credentials, passkey backing files, invitation bearer URL fragments or clipboard secrets. Ensure your terminal title does not expose confidential folder names.

### Scene-by-scene capture plan

| Time | Authentic screen and exact source | Captions and legibility instructions |
|---|---|---|
| 00:00–00:13 | Dark website experiment summary, source-archive download | Hook: **TWO REAL PAYMENT ROUTES. CAN THE EVIDENCE BE RECHECKED?** |
| 00:13–00:32 | Extracted evidence tree, SHA-256 MANIFEST and exact ZIP filename | **172 CURATED SOURCE FILES · SEVEN REAL DATA FIGURES**. Briefly show file manifest |
| 00:32–00:51 | Terminal fresh RPC receipt verification for invite and @devil onboarding | **LIVE PUBLIC RPC RECEIPTS + SAVED ORIGINAL-TIME ACCOUNT STATE**; scroll slowly |
| 00:51–01:13 | Separate 20 RLS public shield verifier and 3 RLS second private send verifier | **PUBLIC SHIELD: 20 + 3.52580064 RLS FEE · VAULT 1 NULLIFIER / 3 NOTES** |
| 01:13–01:30 | F05 original three-operation frozen replay (3 positive, 6 reverts), then **second-cohort frozen replay report** (1 positive, 2 reverts) | **3+1 PRE-SETTLEMENT POSITIVE · 6+2 REVERTS · 0 REPLAY BROADCASTS** |
| 01:30–01:47 | Read-only insufficient-balance UI evidence; archived proof of old prune error | **15 RLS SEND REJECTED BY UI WITH 3 RLS AVAILABLE** · **HISTORICAL STATE PRUNED** |
| 01:47–02:10 | Actual terminal run of second cohort 38 in-memory mutations and original suite; hold PASS | **38/38 SECOND-COHORT MUTATIONS DETECTED**. Don't imply one run executed 182 cases |
| 02:10–02:30 | Published complete QA report; original suites aggregate 144 and second 38 | **182/182 EVIDENCE CORRUPTIONS DETECTED** · explicitly label **OFFLINE CHECKS** |
| 02:30–02:48 | Public-release completion QA, source sha checks, saved 31/31 report | **31/31 CLEAN EXTRACTION CHECKS**; not a count of onchain transfers |
| 02:48–03:06 | Live site interactive comparison, six proof tabs, mobile screenshot | **72/72 LIVE SITE CHECKS** · **FIRST EDITION ARCHIVE PRESERVED** |
| 03:06–03:20 | Clean final evidence classification diagram F06 and repository link | **REAL RECEIPTS / CONTROLLED WALLET VIEWS / FROZEN REPLAY — DISTINCT EVIDENCE TYPES** |

Leave 3–5 seconds on each key PASS. If needed, make this video ~3:35 rather than speeding through real terminal output.

### One-time Node setup before recording
The public research ZIP intentionally does not bundle node_modules. I tested the pinned dependency installation in a separate working copy. Execute this once before capturing, **never inside the pristine manifest-check folder**:

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK/experiments/browser
npm ci --ignore-scripts --no-audit --no-fund
cd ../..
~~~

This installs local JavaScript dependencies only; it does not sign or broadcast any blockchain transaction. The existing connected Ubuntu working copy has already completed the installation.

### Safe read-only terminal sequence
Use Ubuntu and the **published** extracted archive. The commands only read public chain data or offline files. Some programs write a local output report; none signs or sends a blockchain transaction.

~~~bash
# First record a PASS from the completely pristine, untouched extraction.
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-PRISTINE
python3 qa/check_two_cohort_release.py

# All later verifiers run in a different working copy; they may write local JSON reports.
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK
node qa/verify_receiver_onboarding_pruned_rpc.mjs
python3 qa/verify_faucet_cohort_public_shield20.py
node qa/verify_faucet_cohort_private_spend_envelope.mjs

python3 qa/verify_private_replay_frozen.py
python3 qa/verify_faucet_cohort_private_spend_replay_frozen.py

node qa/tamper_receiver_onboarding.mjs
node qa/tamper_faucet_cohort_private_spend.mjs

python3 qa/verify_god_shield_postprune.py
~~~

If Python or Node dependencies are not set up in a NEW extraction, install the documented pinned dependencies first in the test copy, off camera. Do not change the verified source scripts just to get green output in a recording. Keep the genuine failure message, explain whether it was a temporary live RPC/network issue or an original historical pruning constraint, and show the applicable frozen/offline checker.

**Important count distinction:** the two replay-frozen checkers contain the original source-dated historical successes/reverts (4 positive + 8 negative across four operations), not 12 new blockchain transactions. The latest live RPC can be used to recheck the public mined receipts but may not retain the same older execution state.

### Visual editing, evidence-correct captions and sound design
- Figure 5 depicts only the original three private operations (3 positive + 6 revert). Add the fourth second-cohort replay via its separate frozen-source report (1 positive + 2 revert). Do not imply that F05 itself shows 4+8.
- Use Figure 6 for evidence-class boundaries and Figure 7 for the two-route comparison. No decorative graphs displaying unsupported percentages.
- For tamper tests, do a real terminal capture of **38/38** in the second suite and cut to the published combined report showing **182/182**. Avoid overlaying "182 live attacks blocked" — these were evidence-copy mutations.
- For release QA, show the actual saved JSON QA report and archive SHA instead of inventing a new live 31/31 execution if not recorded.
- Show the exact correction: historical post-registration RLS 242.80304332 versus later postshield RLS 219.27724268. Earlier checker wrongly compared the two. Preserve it as an **identified QA assumption and fix**, not a blockchain failure.
- Do not call saved audit output "onchain verified" by itself. Use **independently retrieved receipt**, **read-only owner wallet observation**, **saved original-time eth_call**, **offline tamper check** and **public source archive** as separate caption categories.
- Pause on the original SHA-256 manifest and source repository, then conclude without marketing or unsupported security guarantees.

### Reviewer sign-off checklist for this video
1. At least one fresh independently queried transaction receipt, not only a saved screenshot.
2. A readable source comparison between public-faucet and invitation route, not two identical-treatment replicates.
3. At least one original-time historical replay result labeled **frozen**; no old pruned state presented as new execution.
4. Deliberate corruption test failure sensitivity explained, without claiming a protocol exploit or defense proof.
5. Proof of publication completeness and the public archive's SHA-256, not merely successful file hashes for whichever files happen to be present.
6. The original account address transcription correction and the corrected post-registration vs post-Shield accounting issue are acknowledged. Evidence failures are not edited away.
7. Final source URL and replay steps appear on screen. No secrets or wallet signing screens.

### FINAL TEXT-TO-SPEECH SCRIPT — VIDEO 3
Voice direction: Calm, confident female narrator, natural conversational emphasis, approximately 135–145 words per minute. Say "RLS" as **R L S**, "RPC" as **R P C**, and "SHA" as "S H A". All verification categories must remain distinct. Paste only the following spoken paragraphs into TTS.

After the two private payments worked, I had a different problem to solve. Could someone else examine the evidence without trusting my screenshots?

I released the original public transaction records, verification scripts, figures, and a source integrity manifest. The full two-cohort package contains one hundred and seventy-two curated files.

First, I used independent public RPC queries to check mined transactions, receipt status, blockchain inclusion, and event logs. That includes the transparent twenty RLS shield and both genuine private transfers. The private amounts and recipients are still identified through the controlled wallet observations, not from decrypting public vault data.

Next, I checked historical transaction behavior. The original experiments contained four successful simulations against pre-settlement state and eight reverts at or after settlement. None of those tests broadcast another transaction.

Some older testnet states were later pruned, so I saved the original-time responses and checked them against the original calldata. I didn't claim those old queries could still be repeated live.

I also tested whether the verification process would detect altered evidence. I intentionally changed receipt data, event fields, transaction details, and fee calculations.

The second payment's suite rejected thirty-eight corrupted copies. Combined with the original six suites, the research detected one hundred and eighty-two of one hundred and eighty-two deliberately altered evidence cases. Those are offline integrity tests, not attacks against the live protocol.

I tested one smaller guard too. With three shielded RLS available, entering a fifteen RLS send disabled the button. That's an interface-level check, not an on-chain attack.

I also verified the expected file list, not only the checksums of whichever files happened to be present. That matters because a missing source file could otherwise go unnoticed.

One early registration checker also failed because it compared a later post-shield balance with the earlier post-registration balance. I corrected that assumption and preserved the failure.

The final public release passed thirty-one clean-extraction checks, and the published website passed seventy-two browser checks.

The result is a research package that someone else can reproduce, inspect, or challenge. The full receipts, code, and verified archive are linked in the article.
