# The First-Gas Question — interactive experience design, revision 03
Date: 21 November 2026 · Research website creative / technical implementation notes

This independent research experience is an **original interactive visualization of a factual Rayls Public Chain Testnet investigation**. It is **not** an official Rayls app, a wallet service, auditor, token dashboard, or cryptographic proof visualizer. The user requested an ambitious cinematic creative-development treatment with detailed motion, typography, 3D depth and meaningful controls, without compromising independently authenticated evidence.

## Creative direction

Colors intentionally retain the user's preferred Quest 1 palette: black-plum `#090711`, deep violet `#151122`, glass-purple surfaces, lavender `#b59af6`, acid lime `#e7fd4c`, evidence mint `#95ebce`. The **authentic Rayls symbol asset**, not a generated imitation, remains a local website asset. The site identifies itself as independent research. Typography deliberately juxtaposes bold Space Grotesk headlines with Instrument Serif editorial italic and IBM Plex Mono chain-source labels, with DM Sans readable body copy.

The design is a **story**, not an animated dashboard:
1. Bold enormous white/lime first-gas typographic hero with background atmospheric light, a custom orbiting procedural WebGL vault and an owner-evidence metrics ribbon.
2. Delicate glowing animated scroll progress and 6 chapter markers; a fixed adaptive glass navigation bar.
3. Kinetic lime truth-marquee under the hero.
4. A complete **four-act scrolling narrative** with a sticky copy panel, source-accurate SVG two-lane animated packet tracks, controlled wallet handles and independent receiver symbol. This stage is **illustrative topology**, not a visual decryptor.
5. Interactive three-route case cards with 3D tilt/light, real selected receipt links and documented comparison outcomes.
6. Giant responsive “PUBLIC IS NOT PRIVATE” typographic reveal, illustrative orbital lines.
7. Full six-tab **source-driven public-receipt viewer**: independent raw receipt links, authenticated block metadata, nullifier/commitment/note counts and separate wallet-only attribution.
8. Oversized lime kinetic pause before a two-cohort evidence comparison. One invitation-funded wallet remained publicly unfunded; a different faucet-funded wallet visibly shielded 20 RLS.
9. **Public versus wallet evidence lens**, a manually controlled visual divider that distinguishes transparent funding and encrypted public outputs from owner-wallet observations. It explicitly states it cannot decrypt private data.
10. **Fee laboratory** with a source-verified toggle between public Shield 20 RLS (gross 3.52580064, base 3.06591360, reported treasury 0.45988704 RLS) and a separate real 3 RLS private send (gross implied 4.416, base 3.84, reported treasury 0.576 RLS). All exact token arithmetic and explorer destinations come from the saved verified dataset.
11. Reproducibility section with real receipt scripts and public two-cohort evidence archive; no synthetic events, dummy transaction URLs or fake results.
12. Artistic end orbital signature and **Orbit**, an original small lavender/lime CSS-illustrated guide. Orbit provides only fixed chapter-navigation tips and source pointers: it is **not** an AI assistant or official Rayls character.

## What actually moves

GSAP ScrollTrigger choreography for chapter reveal, scale, lateral kinetic headlines, 3D card transforms, chart-bar growth, floating decorative rings, scroll-progress SVG path drawing, and staggered source readouts. Three.js renders a geometrically original nested faceted vault with physically based purple materials, 5 slightly different orbit tracks, three dotted paths, luminance sprites and abstract data shards, reacting gently to pointer input and scroll.

All WebGL scene elements, circuit paths, guide-character forms, particle shapes and orbital states are **illustrations**. The authoritative evidence comes from the published JSON, source hashes, source ABI/contract transcripts and direct RPC links. Animations never claim to encode real shielded notes or decryption.

## Detail and progressive enhancement

- UI labels: real network ID **7295799**, two differently funded controlled lifecycles, 3→6 shielded RLS receiving-wallet observation, 182/182 rejected evidence mutations and separate receipt identities.
- Animated UI only where it adds reading/interaction value: kinetic typography, sparkling nav chapter markers, focused proof metadata, subtle glow/layering and guide eye blink.
- User **Pause motion** toggle pauses CSS and GSAP, halts WebGL when not permitted; `prefers-reduced-motion:reduce` makes the scroll story ordinary visible vertical cards.
- For mobile (<=950px), all four story acts become separately readable cards, without scroll pinning or hidden copy. At phone sizes the expensive 3D WebGL vault is skipped while CSS ambiance provides the intended visual character.
- WebGL rendering stops outside its viewport, on hidden tabs and when motion is paused. Frame rate capped around 48fps on full desktop, 35fps on compact, 22fps under automated software rendering.
- No external tracking pixel, marketing UTM, secret passkey signature, invite bearer link or private key. No third-party page builder. Native GSAP/Three.js loaded from pinned project dependencies.
- Keyboard-activated case cards, guide Escape closing, active-selected evidence tabs, accessible labels on the SVG and slider, explicit aria on paused motion.
- Mobile tested at 390×844, tablet at 900×1050 and desktop at 1440×900 with motion on and off.
- The historical research archive is immutable; design-source revision is tracked as a Git commit outside the frozen zip. Old article figures and exact transaction documents remain unchanged.

## Evidence type and evaluation boundary

The new animation does not increase experiment sample size. We still have **one completed lifecycle per distinct funding route**. Fee correlation remains exploratory. Wallet-observed transfer amounts/recipient balances are not publicly decrypted. Direct shielded-faucet credit during cooldown and privileged auditor-side decryption were not performed. These remain clearly disclosed by the site and its linked scientific report.

## Verification

The rebuild is paired with `qa/site_cinematic_interaction_qa.mjs`, testing the novel interactions and reduced-motion reading paths in addition to the existing `qa/site_browser_qa.mjs`. The published artifact must pass its own public URL tests, 200 status asset/download checks, exact SHA-256 match with the frozen 172-source-file evidence archive and source-secret exclusion scan before calling the creative site complete.

Design references were studied as principles of editorial type, scroll-movement orchestration and original interaction, **not** copied as source code or templates.
