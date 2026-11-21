# VIDEO 1 — Two Routes Into a Private Rayls Payment
## Complete recording, editing and text-to-speech guide · Rayls November Quest 3

**Target runtime:** 3:15–3:30 (15–25 second holds are fine). **Format:** 1920×1080, progressive 60 fps master, 16:9 landscape; voiceover ~140 words/minute. **Article placement:** immediately after the two-onboarding-route comparison and Figure 7. **Evidence status:** both payments are already mined; this is a replay of real, existing evidence, not a new transfer.

### The core argument
Two fresh passkey wallets each sent 3 shielded RLS to the same controlled recipient @rq3dev26. The invitation-funded newcomer @devil maintained 0 public RLS, USDr, native balance and EVM nonce at checked lifecycle stages. The public-faucet newcomer @rq3faucet26 first received 250 public RLS + 10 public USDr, registered with a public fee, visibly shielded 20 RLS, then made a private send. The recipient's owner-wallet display rose 3 → 6 shielded RLS. Do not describe that private amount as publicly decoded from vault logs.

### Prepare the recording space
- Open the published research website: https://glimorr.github.io/enygma-first-gas-research/
- Open the official public testnet explorer transaction tabs listed below. Use browser full-screen mode or crop browser chrome cleanly in editing, but retain a short legible official explorer URL/chain identity cue.
- Open an Ubuntu terminal in the **public-only extracted research release**, not the private operational workspace. Local source path: /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK (or the newly extracted matching public ZIP). Set terminal font 26–30 px, dark background and no personal username/path overlay in final cut.
- Recording input: OBS MKV hardware encoder, 60 fps; remux to MP4 after capture. Confirm OBS Statistics shows no significant rendering/encoding lag; record each source segment separately for smooth pacing.
- Use the seven original research PNGs, especially F01, F02, F03 and F07, rather than invented charts. Keep transaction hashes legible with short hash label plus Explorer link, not tiny full hashes in lower thirds.
- All terminal verification commands are read-only **on the blockchain**. Some may write local JSON reports. They never require wallet signatures or broadcasts. Do not re-submit a payment to recreate footage.

### Detailed shot-by-shot recording plan

| Time | Record the authentic screen | Motion/edit direction and on-screen exact text |
|---|---|---|
| 00:00–00:13 | Animated site's hero, then the real F07 two-column comparison | Slow parallax, clear title: **Two wallets. Same private payment. Different public history.** No anonymous-transaction guarantee |
| 00:13–00:31 | Public funding control in Explorer: Dev faucet block 24,732,650 and Dev registration block 24,735,856; cut to F01 | Label: **CONTROL — 250 PUBLIC RLS; 7.1930016 RLS REGISTRATION FEE.** |
| 00:31–00:51 | @god public Shield 40 RLS receipt; slow pan over two ERC20 Transfer logs; F02 split-screen | Label: **40.00000000 RLS TO VAULT + 3.50727828 RLS FEE. PUBLIC.** |
| 00:51–01:08 | 30 RLS private invite receipt in Explorer; site proof tab for invitation | Highlight **1 nullifier · 3 commitments · 3 encrypted notes**; label private principal as **owner wallet observed**, not chain-decoded |
| 01:08–01:30 | Private claim receipt block 24,747,924 and @devil registration receipt block 24,748,136; F03 | Label: **CLAIM → REGISTER · PUBLIC REGISTRATION FEE = 0 RLS** |
| 01:30–01:48 | Run clean read-only @devil onboarding verifier in Ubuntu; hold PASS output large for 4 seconds | Callout: **0 PUBLIC RLS / USDr / NATIVE · EVM NONCE 0**; clarify tested account not invisible |
| 01:48–02:12 | First send receipt block 24,760,126; then first owner-wallet snapshot or site's frozen evidence register for receiver 3 RLS | Label: **PRIVATE SEND 3 RLS — RECIPIENT WALLET OBSERVED 3 SHIELDED RLS** |
| 02:12–02:35 | Second fresh account baseline, 250 public RLS + 10 public USDr faucet; public registration 7.19695668 RLS; 20 RLS Shield receipt | Distinct purple contrast panel: **PUBLIC FUNDING → PUBLIC SHIELD 20 RLS** |
| 02:35–02:54 | Show public Shield exact fee then second real private 3 RLS send receipt block 24,767,795 | Label: **20 RLS SHIELD + 3.52580064 RLS PUBLIC FEE · PRIVATE SEND 3 RLS** |
| 02:54–03:11 | Separate @rq3dev26 read-only wallet evidence or site owner-witness panel: 3 before, 6 after; show F07 full-frame | Big split-screen **3 → 6 SHIELDED RLS IN SAME RECEIVER**; note same recipient |
| 03:11–03:25 | Website proof comparison, clean research title card | Closing: **PRIVATE PAYMENT CONTENT ≠ PUBLIC FUNDING HISTORY.** Source links in article |

If the spoken narration takes longer, lengthen evidence holds or use a 3:30 master. Do not accelerate terminal output or compress evidence below readable speed merely to hit the target.

### Exact public source tabs
- Control funding: https://testnet-explorer.rayls.com/tx/0xe27f8d11983e2049186676827c3de9d46396cbfc0a626dfda2e35be36fb1ff83
- Control registration: https://testnet-explorer.rayls.com/tx/0x238c206b86889a2d98df03978028715c45a50a5232f363745abdd76bd2b59afa
- Original 40 RLS Shield: https://testnet-explorer.rayls.com/tx/0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a
- Private invitation: https://testnet-explorer.rayls.com/tx/0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab
- Invitation claim: https://testnet-explorer.rayls.com/tx/0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec
- Invitation account registry: https://testnet-explorer.rayls.com/tx/0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b
- First private send: https://testnet-explorer.rayls.com/tx/0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8
- Second cohort faucet: https://testnet-explorer.rayls.com/tx/0x952208d50a5711e69589e75e0af619f1e94ff47a8f9372a2c2a26155e1025e5c
- Second cohort registration: https://testnet-explorer.rayls.com/tx/0x0c7419d5d3d334dae29f5e87bdde78481ed61b6ae2907429044b4e56903beb0a
- Second 20 RLS Shield: https://testnet-explorer.rayls.com/tx/0x412a30dfaf94a75b25efbc02edf0f63a6de4846d89392c945e6f9b5b7be5c6b7
- Second private send: https://testnet-explorer.rayls.com/tx/0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb

### One-time Node setup before recording
The public research ZIP intentionally does not bundle node_modules. I tested the pinned dependency installation in a separate working copy. Execute this once before capturing, **never inside the pristine manifest-check folder**:

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK/experiments/browser
npm ci --ignore-scripts --no-audit --no-fund
cd ../..
~~~

This installs local JavaScript dependencies only; it does not sign or broadcast any blockchain transaction. The existing connected Ubuntu working copy has already completed the installation.

### Live read-only recording commands
In Ubuntu, start from the public-only extracted release:

~~~bash
cd /mnt/e/Rayls-Nov-Week3/recording/public-release-RECORDING-WORK

node qa/verify_god_invite_pruned_rpc.mjs
node qa/verify_receiver_onboarding_pruned_rpc.mjs

node qa/verify_devils_first_private_spend.mjs --tx 0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8

node qa/verify_faucet_cohort_registration.mjs
python3 qa/verify_faucet_cohort_public_shield20.py
node qa/verify_faucet_cohort_private_spend_envelope.mjs
~~~

Film the results separately. The full output of each script belongs in the released source, not scrolling by too fast on camera. If a fresh RPC endpoint refuses older state or the account's latest balance differs from the archived snapshot, preserve the real result and use the saved/frozen counterpart with a label; never stage a fake live PASS.

### Editing blueprint and evaluator-sensitive checks
- Use the **actual Rayls mark** from verified existing Rayls assets, and real $RLS icon when token is mentioned; do not approximate or redraw it incorrectly.
- Match the existing scientific article PNG style: near-black/violet background, Rayls lime highlights, lavender secondary UI, restrained cyan for auditor-only labels. Use one clean font family with a consistent numeric type hierarchy. Keep all seven PNGs unchanged except crop/zoom.
- Expose readable transaction block numbers and the source domain; hide only browser chrome or unrelated tabs, never hide evidence that contradicts a claim.
- Use gentle motion graphics to explain public-vs-private routes. No unnecessary question marks, no mislabeled "live research site" banner, no made-up wallet animations presented as footage.
- The 3 RLS amount and recipient are known from **sender and recipient controlled wallet observations**. Public vault logs authenticate the encrypted-note event, not private principal/payee.
- The second funding route is **NOT** a direct shielded-faucet success. The original direct shielded faucet was disabled by a displayed cooldown after standard public onboarding.
- Finish on the research website URL and remind readers the transaction links and full source archive are in the X Article.

### FINAL TEXT-TO-SPEECH SCRIPT — VIDEO 1
Voice direction: Natural, confident adult female narrator; conversational rather than promotional. Approximately 135–145 words per minute. Read RLS as **R L S**, USDr as **U S D R**, and Enygma as **Enigma**. No dramatic slogans or AI-sounding hype. Deliberate half-second pauses after the amounts and between the two cohorts. This is the complete script to paste into TTS; no stage directions are spoken.

I wanted to test something that happens before a private payment even starts. Can a completely new Rayls wallet get funded, register, and send, without ever receiving public RLS?

First, I built a normal public funding control. I used the faucet to fund a separate research wallet with two hundred and fifty RLS, then registered it as my independent receiver.

For the private route, I used a funded account to shield forty RLS. That initial shield was public: forty RLS entered the vault, and about three point five RLS went to the relayer.

From those shielded funds, I created a thirty RLS invitation. The blockchain recorded an encrypted-note transaction, rather than a public transfer showing the private amount.

I opened the invitation in a fresh passkey wallet and registered it as devil. After the claim fee, the wallet showed seventeen point three zero four shielded RLS. Public-chain checks still showed zero RLS, zero USDr, zero native balance, and zero account nonce.

That didn't mean the account was invisible. Its username registration was public. But the new wallet had not needed a normal public token transfer to claim its notes and register. The source invitation receipt contained a nullifier and three encrypted notes, not a plaintext transfer exposing thirty RLS or naming the private recipient. The wallet owner could see the value, while public observers could only authenticate the encrypted-note operation.

Then I sent three shielded RLS to my separate receiver. The transaction was mined, and the receiving wallet independently showed three shielded RLS.

To test the other route, I created another fresh account. This one received two hundred and fifty public RLS and ten public USDr through the standard faucet. Its registration fee was public, and it visibly shielded twenty RLS before sending another three RLS privately.

The second transfer was mined too. When I reconnected the same receiving wallet, its shielded balance had increased from three to six RLS.

Both private sends produced one nullifier, three commitments, and three encrypted notes in the public vault. But their funding histories were different.

For these two controlled testnet accounts, the invitation route avoided public token funding, while the standard faucet route left a visible trail. The article links to every original receipt and to the independent verification.
