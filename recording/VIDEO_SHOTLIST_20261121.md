# Rayls November Quest 3 — three silent recording guides

**Production status:** both distinct controlled payment lifecycles have mined and been independently verified; public evidence release and live website have passed QA. These are scripts for the user's actual footage; no video recordings have been created by the assistant.

The user will record, edit, add voiceover if desired, and publish the video clips. This file is a recording brief, not a fake recording. Source workspace: `E:\Rayls-Nov-Week3`.

## Video 1 — Two ways to start a private Rayls payment (100–135 seconds)
**Goal:** Show a genuinely executed testnet timeline, not a scripted demo.

| Approx. time | Screen | Readable caption / optional short voice line |
|---|---|---|
| 00:00–00:09 | Site 3D hero and route selector | `Can a newcomer receive and register without public RLS?` |
| 00:09–00:23 | Funded Dev baseline and registration in explorer | `Control: 250 public RLS arrived, and registration charged 7.1930016 RLS` |
| 00:23–00:37 | @god's 40 RLS shield explorer receipt and balance accounting | `40 RLS deposit + 3.50727828 RLS public relayer fee` |
| 00:37–00:49 | 30 RLS invitation's SharedVault events | `One nullifier, three commitments, three encrypted notes. No plaintext amount in public receipt` |
| 00:49–01:04 | **Claim transaction** in explorer, then **registration** receipt | `@devil's claim and registry were two separate mined transactions` |
| 01:04–01:20 | @devil dashboard (crop URL), then receiver verifier | `17.304 shielded RLS; zero public RLS, USDr and account nonce` |
| 01:20–01:35 | **Mined 3 RLS private send** `0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8`, Dev receiving wallet with 3 shielded RLS | `First private payment confirmed on-chain and in both wallets` |
| 01:35–01:48 | @rq3faucet26 fresh zero balance, then 250 RLS public faucet, fee-paid registration and 20 RLS public Shield | `The alternative first-use route leaves a transparent funding history` |
| 01:48–02:05 | Second 3 RLS private send, then separate @rq3dev26 wallet now displaying 6 shielded RLS | `Second independent funding route: private 3 RLS send, cumulative recipient balance 3 → 6` |

Optional voice script: “I tested two genuine private payments starting from different funding routes. One new passkey account claimed an invitation and registered with zero public RLS, then sent 3 RLS privately. Another account followed normal public-faucet onboarding, visibly shielded 20 RLS and made another private 3 RLS send. Both reached the same receiving research wallet: its shielded balance rose first to 3, then 6 RLS. The key difference is the public funding history, not the encrypted-note receipt.”

**Must not:** show invite URL with the `/i#` fragment, passkey setup code, recovery phrase, claim credentials or browser security prompt contents. The original invite link has already been shared in chat; it is not a clean confidentiality test.

## Video 2 — Four private fee trails and actual negative controls (100–135 seconds)
**Goal:** Present our most original secondary observation with its scientific caveat.

| Approx. time | Screen | Caption |
|---|---|---|
| 00:00–00:12 | Site fee chart: selected 18/18 paid receipts + 2 zero-fee controls | `Activity-selected sample. Not a network-wide estimate.` |
| 00:12–00:28 | Shield fee 3.50727828 RLS and separate 0.45747108 RLS treasury transfer | `15% of base, not 15% of gross.` |
| 00:28–00:47 | Private invitation's vault `transferV2` receipt and 0.576 RLS payout 4 blocks later | `Implied fee 4.416 RLS; UI rounded to 4.42.` |
| 00:47–01:06 | Private claim vault receipt and 1.656 RLS payout 2 blocks later | `Implied fee 12.696 RLS; 30−12.696=17.304.` |
| 01:06–01:22 | Registration with public fee zero and no corresponding payout in a +35-block window | `Negative control: no distinct paid relayer fee at registration.` |
| 01:22–01:37 | First private send vault receipt and 0.576 RLS treasury payout 4 blocks later | `Third private case; implied gross fee 4.416 RLS, UI rounded to 4.42.` |
| 01:37–01:55 | Second private 3 RLS send and 0.576 RLS distinct treasury payout four blocks later | `Fourth selected private operation: 4.416 RLS implied gross; wallet rounded 4.42` |
| 01:55–02:09 | 30 time-shifted fee placebo windows, all zero payout | `Exploratory low-traffic sanity check; NOT a network-wide inference rate` |
| 02:09–02:18 | Site boundaries | `Fee metadata, not recovered shielded amount or recipient.` |

Optional voice script: “A shielded transfer hides the payment amount from public vault logs, but its relayer can leave a separate fee trail. In four selected controlled private operations, a public treasury transfer appeared two to four blocks later. Using the relayer's reported 15% policy, those amounts reconstructed the fees shown in the wallet. This is metadata correlation, not a decryption or a network-wide privacy break.”

**Important:** The treasury recipient's legal Rayls Foundation ownership comes from relayer configuration; not independently established. An inferred fee must never be presented as the private **principal**.

## Video 3 — Independent receipts, replay and corruption controls (80–105 seconds)
**Goal:** Demonstrate verification, mutation rejection and provenance.

| Approx. time | Screen | Caption |
|---|---|---|
| 00:00–00:12 | Final extracted evidence release, `MANIFEST.sha256`, `RELEASE_STATUS.json` | `Frozen two-cohort archive; show the actual source-file count and live clean-extraction PASS summary` |
| 00:12–00:28 | `node qa/verify_receiver_onboarding_pruned_rpc.mjs` | `Fresh claim and registry receipts, current zero public balances, and original fixed-block records` |
| 00:28–00:40 | `node qa/tamper_receiver_onboarding.mjs` | `30 of 30 deliberate receipt and state corruptions rejected` |
| 00:40–00:52 | `python3 qa/verify_private_replay_frozen.py` | `4 positive before / 8 reverts after; original pruned states retained as hash-matched historical observations` |
| 00:52–01:05 | `python3 qa/verify_god_shield_postprune.py` | `Pruned historic state fixed by independent current-balance + transfer-log reconstruction` |
| 01:05–01:20 | `node qa/tamper_faucet_cohort_private_spend.mjs` and total mutation summary | `Second spend 38/38 rejected; combined tamper controls 182/182` |
| 01:20–01:35 | Website: the two onboarding routes, proof tabs, fee study, boundaries, archive download | `The funded control and zero-public-funding result are not conflated` |

Optional short voice script: “This research is reproducible. The archive contains public receipts, contract interfaces and verification scripts—not wallet secrets. The live RPC tests, tamper checks and historical replay controls are all documented. When archived state was pruned, I kept the failure and built an independent event-based reconstruction rather than claiming the old query still worked.”

## Terminal recording hygiene and framing
- Record in full HD at 1920×1080 if feasible. Make terminal type at least 22 px and pause on each PASS screen long enough for a viewer to read exact hashes.
- Prefer the **public-only extracted final research release** over the private working directory; no command should dump `~/.rayls-w2-private` or browser profiles.
- Do not replay or display confidential invitation link fragments. A claimed invite URL is not necessary for reproduction; use public tx hashes.
- Show the **already mined** 3 RLS outgoing payment; do not submit another transfer just to recreate footage.
- Preserve actual failures, especially the provider's `state ... pruned` error, rather than editing them out.
- Add YouTube/X links to article only after videos are actually recorded and the links are checked.

## Public-chain receipts to open on camera
1. Public funded Dev registration: https://testnet-explorer.rayls.com/tx/0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa
2. Public shield: https://testnet-explorer.rayls.com/tx/0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a
3. Private invitation: https://testnet-explorer.rayls.com/tx/0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab
4. Private claim: https://testnet-explorer.rayls.com/tx/0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec
5. Public registry (@devil): https://testnet-explorer.rayls.com/tx/0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b
6. Treasury payouts: https://testnet-explorer.rayls.com/tx/0x3650f335ce12fe0c2ad4616aa7d595503e44e18b141e35121fc7cc7f077377f1 and https://testnet-explorer.rayls.com/tx/0xc9e3b527d27b152bde59a9529679dcbf2d4237dda1c7f7c2564ad9cff18ab116

Final outgoing spend: https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8


## Two-cohort supplement — must capture these particular source receipts
- @rq3faucet26 transparent faucet RLS: https://testnet-explorer.rayls.com/tx/0x952208d50a5711e69589e75e0af619f1e94ff47a8f9372a2c2a26155e1025e5c
- @rq3faucet26 registration with transparent RLS fee: https://testnet-explorer.rayls.com/tx/0x0c7419d5d3d334dae29f5e87bdde78481ed61b6ae2907429044b4e56903beb0a
- 20 RLS public shield: https://testnet-explorer.rayls.com/tx/0x412a30dfaf94a75b25efbc02edf0f63a6de4846d89392c945e6f9b5b7be5c6b7
- Second real 3 RLS private send: https://testnet-explorer.rayls.com/tx/0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb
- Separate second private send's reported-treasury payout: https://testnet-explorer.rayls.com/tx/0x1e98495ef31b41a8dab93f1a2b284f81991987000a3c69c958287e82f6e9fa8f
- Independent receiver read-only account view: @rq3dev26 shows **6 shielded RLS**; capture the account screen with no secrets. Previously verified same receiving wallet showed **3 shielded RLS**.
- Optional UI negative control: a 15 RLS send preview was rejected while the receiving wallet held 3 shielded RLS; do not portray it as an onchain attack.

The new full direct **shielded faucet** flow was not executed: app first redirected the new passkey to transparently funded onboarding, then all four faucet options were disabled by an approximately 3-hour cooldown. Preserve that as a documented limitation rather than claiming it was completed.
