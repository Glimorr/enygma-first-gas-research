# Second-cohort QA failure and corrective action (21 November 2026)

The first complete clean extraction of the second cohort returned **29/30 PASS**. The failed test, `second_cohort_public_faucet_registration_live`, incorrectly assumed that the account's current public RLS would still equal its original post-registration balance, even though the account had **subsequently** publicly shielded 20 RLS plus paid its relayer fee.

The actual correct sequence, independently observed and authenticated:
- 250.00000000 public RLS credited from testnet faucet.
- 242.80304332 public RLS after original fee-paid registration (7.19695668 RLS).
- 219.27724268 public RLS after **later** 20 RLS public Shield (3.52580064 RLS extra fee).
- Unchanged public RLS after the next private 3 RLS send.

We revised the checker to compare historical post-registration state against the saved original-time fixed-block observation, while separately reporting the current post-Shield state. This is a **test design correction, not a changed blockchain outcome**. The corrected exact verification script and frozen original snapshot are in the immutable two-cohort source archive. The subsequent **31/31 clean-extraction checks pass**. A source-dated failed original QA JSON is retained locally in `E:\Rayls-Nov-Week3\release\qa-previous-failed-registration-check.json` and intentionally excluded from public release because it includes temporary machine paths; the failure and fix are fully disclosed here.

Other preregistered boundaries include RPC archive pruning, the exposed original private-invite bearer link, and a shielded-faucet cooldown. None was suppressed or represented as a successful experiment.
