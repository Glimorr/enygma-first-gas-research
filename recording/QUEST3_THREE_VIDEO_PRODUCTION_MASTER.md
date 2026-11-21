# Rayls November Quest 3 — Three-Video Production Master
## Final evaluator-first recording plan and article media package

**Production scope:** three edited evidence documentaries, each with a complete shot list and a voiceover script at the end; seven existing evidence-grounded 1600 × 900 PNGs in a checksum-verified ZIP. These guides are designed to be executed by the researcher with OBS, a real browser and read-only Ubuntu terminal commands. They do **not** claim the final videos have already been recorded, edited or published.

### Open these three self-contained guides
- [Video 1 — Two Routes Into a Private Rayls Payment](VIDEO_1_RECORDING_EDITING_VOICEOVER.md). Main original result, two distinct onboarding routes and receiver wallet 3 → 6 RLS.
- [Video 2 — Public Fee Trail](VIDEO_2_RECORDING_EDITING_VOICEOVER.md). Selected private fee correlations, public controls, exact arithmetic and fixed shifted windows.
- [Video 3 — Reconstruct the Evidence](VIDEO_3_RECORDING_EDITING_VOICEOVER.md). Live public RPC, source-dated frozen historical replay, tamper rejection, release QA and preserved failures.

### Get the original figures
[Download the seven source PNGs as a ZIP](assets/Rayls_November_Quest3_Seven_Research_Figures_PNG.zip). Includes a source-order README and exact SHA-256 checksums. The public article uses F01, F02, F03, F07, F04, F05 and F06 in **narrative order**, so do not assume numeric order equals page order. The ZIP includes the seven original scientific evidence figures only; a distinct 5:2 X Article cover image remains a separate design deliverable.

### Where the videos belong in the X Article
- **Video 1:** After the second funding-route comparison and **Figure 7**. Not at the bottom.
- **Video 2:** After the public fee trail investigation and **Figure 4**. Figure 4 depicts only the original three private operations; show the fourth separately via the second send's real reported-treasury payout receipt.
- **Video 3:** After **How to verify the results yourself**, before **Issues fixed**. Figure 5 depicts the original 3 positive + 6 reverting replay observations; add the second cohort's 1 positive + 2 reverting frozen observations from its separate report.
- The article ends with **What I learned → Evidence, code and primary sources → Official Rayls technical references**, exactly mirroring the successful Quest 1 article's editorial pattern.

### Recording quality baseline
- OBS canvas/output **1920 × 1080, progressive 60 fps**; ideally capture 2560 × 1440 source at stable 60 and scale down once in post. Record MKV with hardware H.264 or AV1 if supported; choose a high-quality constant-quality mode (e.g. NVENC CQP 18–20) rather than overly low bit rate. Remux to MP4 for editing.
- Use OBS Statistics. A 15–30 second trial must show **near-zero rendering/encoding lag and no meaningful frame drops**; the resulting metadata should report 60 fps. If the computer cannot sustain it, lower source resolution or simplify browser effects before recording instead of falsely labeling 20 fps footage as 60.
- Film in separate 10–30 second takes. For live terminal use a 26–30 px monospace font, clean dark theme, zoomed viewport and a 3–5 second hold on each command's real result.
- No unnecessary browser chrome in the finished video: crop it in post, but preserve official domain, block, transaction hash, event label and proof source cues when needed.
- Voice: calm conversational adult female tone, not a synthetic-sounding announcer. Recommended ~135–145 wpm; ask TTS to pronounce RLS as letters **R L S**, USDr as **U S D R**, RPC as **R P C**, and Enygma as **Enigma**. Generate each paragraph separately if needed to correct pronunciation without speeding up.
- Mixing: narration intelligible at about -16 LUFS integrated (platform-dependent), true peak below -1 dBTP; background music unobtrusive under speech, no beeps or musical hits that obscure a source output. Disable sound effects during terminal reproduction.
- Use consistent motion: minimal parallax on diagrams, cropped pan/zoom over existing figures, deliberate easing, no artificial "result" screens. Real official Rayls logo and $RLS token ticker only from known actual Rayls assets.
- Editor timeline should have a proof track and a narration track. Every number appearing as animated text must trace back to the public source or wallet observation.

### Scientific attribution rules carried forward from all evaluator reports
1. Public chain receipt can prove successful mined SharedVault transferV2 and note event topology, **not publicly reveal** private 3 RLS principal or private payee.
2. The receiving wallet's 3 → 6 shielded balance is an **owner-wallet observation** in a separate controlled account, not decrypted by public RPC.
3. @devil was publicly unfunded across checked lifecycle stages; @rq3faucet26 had visible public faucet and Shield history. Different treatments, **not** two independent repeats of the same treatment.
4. Four private fee cases were **selected**; four nearby reported-treasury payouts match the relayer-reported 15% base surcharge formula. Treasury wallet's organizational owner and a unique cryptographic link to specific encrypted notes were not independently proved. **No recovered private amount or payee** from fee metadata.
5. Thirty time-shifted windows were sparse local controls; 0/30 is not a false-positive probability for the entire network.
6. Historical replay: **four successful saved original-time pre-state eth_call observations and eight reverts at/after state settlement**; 0 replay broadcasts. Old public archive states may have been pruned. The saved observations are labeled **frozen source-dated evidence**, while accessible receipts are rechecked live.
7. The 182 tamper checks modify **offline evidence copies** and establish verifier sensitivity to those introduced corruptions, not a protocol attack/security guarantee.
8. The separate UI 15 RLS overspend with only 3 shielded RLS is an **interface guard**, not a proof of circuit rejection.
9. Direct shielded faucet was not executed after a displayed cooldown; privileged auditor demonstration was not a real transaction decryption; original invitation link had been shared. Do not erase these scope distinctions.
10. An evaluator cannot independently validate an edited animation alone. Show actual public receipts, explicit script filenames and links to the release manifest.

### Practical source workflow
Use the **public-only extracted archive** in Ubuntu. Because some verifiers write local reports, two independent folders have already been extracted from the SHA-matched published ZIP:
~~~
# PRISTINE: never execute source-writing verifiers here, only the release completeness check
/mnt/e/Rayls-Nov-Week3/recording/public-release-PRISTINE

# WORK: execute all live RPC, offline replay and tamper controls here
/mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK
~~~
The pristine directory was independently checked on November 22 with **PUBLIC_RELEASE_AUDIT PASS; manifest 172 files; 7 figures; 182 tamper cases**. This separation fixes an earlier QA recording attempt in a reused extraction where a verifier rewrote a local JSON report and caused a manifest digest mismatch. That earlier error was a contaminated *working-copy integrity check*, not evidence of a faulty original ZIP; keep the explanation rather than hiding the failed result. If you make a new capture folder, extract the original ZIP afresh twice: one untouched copy for integrity and one separate copy for script runs. Keep sensitive research browser profiles out of the capture. A live RPC terminal verification is allowed but must never sign, send or redeploy anything; several scripts may write local result JSON. For old replay data use the published frozen checker rather than trying to force a pruned node to return unavailable history.

### One-time package installation before read-only Node verification

The public-only ZIP contains pinned package manifests, not a bundled node_modules folder. The working copy has already run:

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK/experiments/browser
npm ci --ignore-scripts --no-audit --no-fund
cd ../..
~~~

For a new extraction, install once before filming. Do **not** run npm ci in the pristine source-integrity demonstration folder or treat local node_modules as public source evidence.

### Final pre-publication two-pass evaluator review

**Scientific pass:** Both mined private spend hashes authenticate; public balance reconciliation matches exactly; fee formula is labeled reported; 3 RLS amount/receiver is sourced to wallet owners; negative controls are named; cases don't imply network rates; failed historical queries are retained and corrected; all linked public files and figure images open; actual video content matches the article.

**Presentation pass:** A newcomer understands the research question within 10 seconds; one primary insight per screen; captions match the narrated figures; all text readable without repeated pausing; clean X placement of Videos 1, 2 and 3; correct Rayls branding; no placeholder "?" icon, UTM trackers, broken overlay, 404 site or false official endorsement. Ensure 60 fps is **actually recorded**, not an export-only metadata flag.

### Final deliverables after editing
- Three separate clean 1080p60 MP4s (the user will record and edit them).
- Their final X/YouTube video links inserted beside the appropriate article figures.
- Seven original article figures supplied in the ZIP above, plus a separate article cover if desired.
- Public research website and verified public release visible in the video descriptions and X Article.

**Original Rayls Quest 1 reference:** approved 98/100, 10 RP +3 DP; evaluator praised genuine originality, extensive reproducible evidence, and clear videos but flagged terminal output too fast and a then-broken research link. This package specifically fixes both filming issues. Exact official Quest 3 scoring remains up to the evaluator.
