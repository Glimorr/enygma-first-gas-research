# Preregistered second-cohort public-shield comparator, 2026-11-21 UTC

Source wallet: @rq3faucet26, EVM 0xe1136dCF839c4aD2704094241928Fa2896A118c5.

Preaction independently confirmed: 250 public RLS and 10 public USDr from the default faucet; registration exact 7.19695668 RLS fee; latest public RLS 242.80304332, native balance 10, nonce 0. Sources: evidence/public-rpc/controlled/faucet-cohort-funding-and-registration-verified.json and faucet-cohort-unified-ui-cooldown-observation.json.

The official faucet screen displayed approximately 2h55 cooldown and disabled all FOUR Get controls (shielded RLS, shielded USDr, public RLS, public USDr). This only establishes the observed frontend cooldown, not its server-side mechanism or an underlying absence of a direct shielded faucet.

ALTERNATIVE TEST NOW: user can transparently Shield EXACTLY 20 RLS from @rq3faucet26 using official wallet Shield RLS flow. Capture real transaction hash and success screen. Independent researcher decodes and checks 20 RLS public ERC20 vault deposit, true fees, block inclusion, before/after balances. Then, if private balance after shielding allows quoted fees, send exactly 3 shielded RLS to controlled registered @rq3dev26; independently verify vault receipt and a separate recipient owner-wallet UI read. Existing @rq3dev26 private balance prior to second cohort was 3 RLS, so if no other activity occurs the post-send private balance is expected to be 6 RLS, but must be observed rather than assumed. The user must authorize protected passkey signing. No synthetic receipts or bypass.

This is DIFFERENT from a direct shielded faucet credit. Research question: how publicly funded / transparently shielded onboarding differs from invite-funded zero-public-funding onboarding. The older final Quest 3 archive remains unchanged until a full evidence-backed addendum is ready.

If user prefers to test a true shielded faucet, only do so when its official Get action becomes enabled; first capture fresh balances. Do not infer a direct shielded faucet outcome while disabled.

## Executed Stage 1: 20 RLS public shield independently verified
- Official wallet @rq3faucet26 displayed `Shielded 20 $RLS`, fee rounded `3.53 $RLS`, and success transaction `0x412a30dfaf94a75b25efbc02edf0f63a6de4846d89392c945e6f9b5b7be5c6b7`. The user signed in their protected passkey interface.
- Independently mined at block 24767225, status 1; exact RLS Transfers: **20.00000000 RLS to SharedVault** and **3.52580064 RLS to relayer**, both from @rq3faucet26 public account. Public RLS balance 242.80304332 → 219.27724268. Public USDr 10, native 10, nonce 0.
- Separate reported-treasury RLS payout `0x2a462176bace48a23a164a6811019b9792121f2f5a7b41e765bca0f55ef84ef0` block 24767228, exactly **0.45988704 RLS** three blocks later. Relayer reported 15% of base, 3.06591360 base + 0.45988704 = 3.52580064 gross. Its relationship to the shield is correlated, not encoded with unique onchain causal event ID.
- Receipt/block/independent logs/fees and balances PASS using `qa/verify_faucet_cohort_public_shield20.py`. Full public bytes archived in `evidence/public-rpc/controlled/faucet-cohort-public-shield-20-verified.json`.
- Next protocol step: official wallet `Send shielded RLS` to controlled registered @rq3dev26 **3 RLS**. STOP before signing if it does not resolve the correct destination or displays insufficient shielded balance including fees. The public RLS funding history remains visible and must never be called anonymous or zero-funded. Verify the actual private send and separate receiving-wallet observation before claiming the full comparison is complete.
