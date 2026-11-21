# Cinematic site — live fee-control consistency correction

Date 21 November 2026. This is a website-only correction. No RPC records, signed transactions or historical evidence archive bytes changed.

## Failed real deployed QA
The first full interaction test on the **live GitHub Pages deployment** returned **68 of 70 PASS**. The two failed assertions were the desktop full-motion fee-case switch into the 3 RLS private send and back into the public 20 RLS shield. The selected button and destination explorer URL updated immediately, but the displayed numbers remained from the previous case for an interval under real deployed page/GPU load.

**Root cause:** old `experience.js` delayed updating source-authenticated DOM text until an outgoing GSAP fade-out `onComplete` callback. This was a UI correctness problem (temporary mismatched values), not a testnet receipt or data-model error. Under browser load the visual completion callback could be delayed beyond the test wait.

## Correction and regression
The fee-case action now updates **all exact source-backed numbers and the explorer link together, synchronously**, then runs purely decorative y-translation animation. Prior GSAP tweens are killed before switching to prevent stale fading.

A rapid-switch stress test toggled between original independently verified fee cases **six times** and verified exact values immediately after each action:
- PUBLIC Shield 20 RLS: gross 3.52580064 RLS, base 3.06591360 RLS, reported-treasury payout 0.45988704 RLS.
- PRIVATE Send 3 RLS: gross **4.41600000** (derived), base **3.84000000**, reported-treasury payout 0.57600000 RLS.

All six rapid source switches passed with zero browser runtime errors. A fresh full-motion live QA run must pass before publication is considered final. The original first live failure is retained in the local machine report `qa/site-cinematic-v3-published-interactions-interaction-qa-report.json`, and its cause is disclosed in this document. This is not a security claim about the shielded protocol.

## Evidence provenance
Both immutable archives still have their original SHA-256 values, with no changes:
- v1: `49e897c712e7d452700be2dca369f3988ca46c5316f0bad306fef292f335f97a`
- v2: `310daaee8867db412fdbc9ad1bd10553e4d02671b9f9db10f23258cefc2ed0a9`

The valid public-chain fee data remains the same; this correction only changes when the frontend displays it.
