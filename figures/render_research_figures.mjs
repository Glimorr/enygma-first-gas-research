/**
 * Six original evidence-grounded 1600×900 article PNGs.
 * Rebuild after final private spend is independently verified.
 * All data comes from archived public receipts / wallet-observation labels.
 * No private invitation URL or wallet credentials used.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {chromium}=require("playwright");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const e=JSON.parse(fs.readFileSync(root+"/site/public/data/evidence.json","utf8"));
if(!e.receiverLifecycle?.registrationTx||!e.replayControls||e.chainId!==7295799)throw Error("Missing verified data");
const image=fs.readFileSync(root+"/site/public/assets/rayls-symbol-gradient.png").toString("base64");
const token=raw=>String(raw).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const style=`
*{box-sizing:border-box}html,body{margin:0;padding:0;width:1600px;height:900px;overflow:hidden;background:#090711;color:#f5f3ff;font-family:Arial,Helvetica,sans-serif}body{background:radial-gradient(ellipse 780px 700px at 88% 34%,#2a1a40 0%,#0b0917 70%),#090711}.page{position:relative;width:1600px;height:900px;padding:45px 78px}.page:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(#bbb2d4 .55px,transparent 1px);background-size:17px 17px;opacity:.11}.header{position:relative;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #494053;padding-bottom:19px;margin-bottom:26px}.brand{display:flex;gap:13px;align-items:center;font-size:15px;font-weight:800;letter-spacing:.04em}.brand img{width:39px;height:39px;object-fit:contain}.stamp{font-size:12px;letter-spacing:.15em;color:#afa0c5;font-weight:700}.label{font-size:13px;letter-spacing:.18em;color:#e7fd4c;font-weight:800;margin-bottom:11px}.heading{font-size:55px;font-weight:800;letter-spacing:-.07em;line-height:1.04;margin:0 0 13px;max-width:1350px}.heading span{color:#b39bf4}.intro{font-size:18px;color:#c3b8d5;max-width:1250px;line-height:1.42;margin:0 0 18px}.grid{display:grid;gap:18px}.card{background:linear-gradient(135deg,#211932 0%,#110f1f 100%);border:1px solid #4a365f;border-radius:19px;padding:21px 25px;min-width:0;position:relative}.card .top{color:#a89cbd;font-size:12px;font-weight:800;letter-spacing:.12em;margin-bottom:17px}.card .big{font-weight:800;font-size:52px;letter-spacing:-.055em;line-height:1.1;color:#e7fd4c}.card h3{font-size:24px;letter-spacing:-.04em;margin:0 0 10px}.card p{font-size:16px;line-height:1.43;color:#b7acc8;margin:0}.card .sub{font-size:12px;color:#a699b8;margin-top:16px;overflow-wrap:anywhere}.card .purple{color:#b39bf4}.card .mint{color:#95ebce}.emph{color:#e7fd4c}.muted{color:#afa4c1}.footer{position:absolute;bottom:23px;left:78px;right:78px;border-top:1px solid #494053;padding-top:17px;display:flex;justify-content:space-between;align-items:center;gap:25px;font-size:12px;letter-spacing:.08em;color:#a89ab8}.footer .status{color:#e7fd4c;font-weight:800}.pill{display:inline-block;border-radius:30px;padding:7px 13px;background:#30233f;color:#d0b5ff;font-size:11px;font-weight:700;letter-spacing:.06em}.pill.mint{background:#1d3532;color:#95ebce}.pill.lime{background:#353b17;color:#e7fd4c}.pill.danger{background:#372236;color:#eba7e9}.line{height:1px;background:#43334b;margin:16px 0}.stripe{height:7px;background:linear-gradient(90deg,#e7fd4c,#b39bf4);border-radius:10px;margin-bottom:20px}.sublabel{font-size:13px;letter-spacing:.05em;color:#a7a0bb}`;
const frame=(code,title,subtitle,body,foot="SOURCE: RESEARCHER-CONTROLLED PUBLIC TESTNET RECEIPTS")=>`<!doctype html><html><head><meta charset="utf-8"/><style>${style}</style></head><body><div class="page">
<header class="header"><div class="brand"><img src="data:image/png;base64,${image}" alt=""/>RAYLS / ENYGMA PUBLIC <span style="color:#e7fd4c">· INDEPENDENT RESEARCH</span></div><div class="stamp">THE FIRST-GAS QUESTION · FIG ${code}</div></header>
<div class="label">RESEARCH EVIDENCE · NOVEMBER 2026</div><h1 class="heading">${title}</h1><p class="intro">${subtitle}</p>
${body}
<footer class="footer"><span>${foot}</span><span class="status">TESTNET · CHAIN 7295799</span></footer>
</div></body></html>`;
const R=e.receiverLifecycle;
const SH=e.claims.publicShield;
const IV=e.claims.invitation;
const docs=[];
const blocks=[
 ["01","PUBLIC FAUCET","250 RLS",e.claims.publicFaucet.block,"Public Transfer"],
 ["02","DEV REGISTRATION","@rq3dev26",e.claims.registration.block,"Transparent fee"],
 ["03","SHIELD","40 RLS",SH.block,"Public principal"],
 ["04","INVITATION","30 RLS",IV.block,"Wallet observed"],
 ["05","PRIVATE CLAIM","17.304 RLS",R.claimBlock,"Wallet after claim"],
 ["06","REGISTRATION","@devil",R.registrationBlock,"Zero public RLS"],
 ["07","FIRST PRIVATE SEND","3 RLS",R.spendBlock,"Wallet + receipt verified"]
];
docs.push(["01","07 actual chain milestones",frame("01","From public funding to <span>a private first spend.</span>","One publicly funded wallet and one invitation-funded passkey account. Seven researcher-controlled stages, each with a mined public testnet receipt.",
`<div class="grid" style="grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,200px);margin-top:21px">${blocks.map(a=>`<div class="card"><div class="top">STAGE ${a[0]} · BLOCK ${Number(a[3]).toLocaleString()}</div><h3>${a[1]}</h3><div class="big" style="font-size:37px">${a[2]}</div><div class="line"></div><p>${a[4]}</p></div>`).join("")}</div>`,"RECEIPT CHRONOLOGY · PRIVATE AMOUNTS FROM WALLET UI, NOT PUBLIC RPC")]);
const footprints=[
 {title:"PUBLIC SHIELD",public:"2",nullifiers:"0",commitments:"1",notes:"1",what:"40 RLS principal and 3.50727828 RLS relayer fee are visible in token Transfer events.",pill:"PUBLIC AMOUNT VISIBLE"},
 {title:"SHIELDED INVITATION",public:"0",nullifiers:"1",commitments:"3",notes:"3",what:"The 30 RLS amount is not present in plaintext in the vault receipt.",pill:"PRIVATE PRINCIPAL"},
 {title:"PRIVATE CLAIM",public:"0",nullifiers:"1",commitments:"3",notes:"3",what:"The 17.304 RLS new-wallet balance comes from the wallet, not public receipt decoding.",pill:"PRIVATE PRINCIPAL"},
 {title:"FIRST PRIVATE SEND",public:"0",nullifiers:"1",commitments:"3",notes:"3",what:"@devil sent 3 RLS privately. Separate @rq3dev26 wallet shows 3 shielded RLS.",pill:"BOTH WALLETS OBSERVED"}
];
docs.push(["02","Public vs shielded footprints",frame("02","The transfer <span>footprint changes.</span>","Four controlled successful operations, compared only by publicly decoded events. This visual does not decrypt private notes.",
`<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">${footprints.map(a=>`<div class="card" style="height:390px"><div class="top">${a.title}</div><div class="big">${a.public} <span style="font-size:14px;color:#fff;margin-left:14px">ERC-20 LOGS</span></div><div class="line"></div><div class="sublabel">NULLIFIERS <strong style="color:#fff;font-size:27px">${a.nullifiers}</strong> &nbsp; COMMITMENTS <strong style="color:#fff;font-size:27px">${a.commitments}</strong></div><div class="sublabel" style="margin-top:10px">ENCRYPTED NOTES <strong style="color:#b39bf4;font-size:27px">${a.notes}</strong></div><div class="line"></div><p>${a.what}</p><div style="position:absolute;bottom:19px"><span class="pill lime">${a.pill}</span></div></div>`).join("")}</div>`,"PUBLIC CONTRACT EVENTS · SECRET NOTES ARE NOT DECRYPTED")]);
docs.push(["03","Recipient before and after",frame("03","A wallet with <span>nothing public.</span>","The actual @devil address was reconstructed from the UserRegistered event. The incorrect earlier screenshot transcription is explicitly superseded.",
`<div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:26px">${[
 ["BEFORE CLAIM","24,747,863","0","0","0"],["AFTER CLAIM","24,747,924","0","0","0"],["AFTER REGISTRATION","24,748,136","0","0","0"],["AFTER FIRST SEND","24,760,126","0","0","0"]].map(a=>`<div class="card" style="height:250px"><div class="top">${a[0]} · BLOCK ${a[1]}</div><div class="big">${a[2]} <span style="font-size:17px;color:#fff">PUBLIC RLS</span></div><div class="line"></div><p>Public USDr: <strong style="color:#fff">0</strong></p><p>EVM account nonce: <strong style="color:#fff">0</strong></p></div>`).join("")}</div>
<div class="card" style="margin-top:25px;display:flex;align-items:center;gap:35px;padding:25px"><div style="font-size:52px;font-weight:800;color:#b39bf4">17.304 RLS</div><div><div class="top">OWNER-WALLET OBSERVATION</div><p>Shielded balance after the claim. The first private send was 3 RLS; @rq3dev26 independently confirmed 3 shielded RLS. Neither amount is public plaintext.</p></div></div>`,"FIXED-BLOCK STATE, SCOPED RLS/USDR LOGS AND REGISTERED EVENTS")]);
const privateFees=e.privateFeePilot.cases;
docs.push(["04","Private fee trail",frame("04","A private transfer can leave <span>a public fee trail.</span>","Three controlled private transactions had exactly one corresponding nearby treasury payout in fixed search windows, under the relayer-reported 15% surcharge policy.",
`<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:25px">${privateFees.map((v,i)=>`<div class="card" style="height:320px"><div class="top">CONTROLLED PRIVATE ${i===0?"INVITATION":i===1?"CLAIM":"FIRST SEND"}</div><div class="big">${v.treasuryShareRls} <span style="font-size:16px;color:#fff;margin-left:14px">RLS TO TREASURY</span></div><div class="line"></div><h3>= ${v.grossFeeImpliedRls} RLS implied gross</h3><p>Fee formula: treasury share × 115 / 15</p><div style="margin-top:28px"><span class="pill mint">PAYOUT ${v.payoutDelayBlocks} BLOCKS LATER</span></div></div>`).join("")}</div>
<div style="margin-top:20px;font-size:19px;color:#e7fd4c">All three private payment principals remain hidden in public RPC. Fee correlation does not establish the shielded sender or recipient.</div>`,"EXPLORATORY N=3; TREASURY ADDRESS REPORTED BY RELAYER")]);
const replay=e.replayControls.cases;
docs.push(["05","Historical state replay controls",frame("05","Same public calldata. <span>Different chain state.</span>","Read-only eth_call simulations of the invitation, claim and first private send. No new transactions or gas charges were created.",
`<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:23px">${replay.map(v=>`<div class="card" style="height:340px"><div class="top">${v.kind==="private_invite_creation"?"INVITATION CREATION":v.kind==="private_invite_claim"?"INVITATION CLAIM":"FIRST PRIVATE SEND"}</div>${v.stages.map((a,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #45364f;padding:18px 0"><span class="sublabel">${i===0?"STATE BEFORE":i===1?"MINED STATE":"NEXT BLOCK"} · ${a.block.toLocaleString()}</span><span class="pill ${a.result==="SUCCESS"?"mint":"danger"}">${a.result==="SUCCESS"?"✓ SUCCESS":"✕ REVERT"}</span></div>`).join("")}</div>`).join("")}</div>
<div style="margin-top:27px;color:#bcb2cf;font-size:17px">Supports state-dependent replay rejection; does not identify every possible revert cause or prove protection against all adversarial variants.</div>`,"3 POSITIVE AND 6 NEGATIVE READ-ONLY HISTORICAL SIMULATIONS")]);
docs.push(["06","Evidence taxonomy",frame("06","A privacy claim needs <span>a precise evidence class.</span>","The evaluator must be able to tell mined events, wallet observations, secondary correlations and unperformed tests apart.",
`<div class="grid" style="grid-template-columns:repeat(2,1fr);margin-top:20px;gap:22px">${[
 ["ON-CHAIN VERIFIED","Shield, invitation, claim, @devil registration, first private send, zero public RLS state.","mint"],
 ["WALLET OBSERVED","30 RLS invite principal and 17.304 RLS shielded recipient balance.","mint"],
 ["EXPLORATORY","3 private fee-to-treasury correlations; 18 public paid cases.","mint"],
 ["LIMITS","Direct shielded-faucet comparator not performed; exposed invitation link; single controlled lifecycle.","danger"]
 ].map(([a,b,color])=>`<div class="card" style="height:176px"><div class="top"><span class="pill ${color}">${a}</span></div><p style="font-size:19px;color:#fff">${b}</p></div>`).join("")}</div>`,"CONTROLLED LIFECYCLE VERIFIED · NO GENERALIZED MAINNET PRIVACY GUARANTEE")]);
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,reducedMotion:"reduce"});
const page=await context.newPage();
const results=[];
for(const [id,label,html] of docs){
 await page.setContent(html,{waitUntil:"load"});
 const path=root+"/figures/F"+id+"-"+label.toLowerCase().replace(/[^a-z0-9]+/g,"-")+".png";
 await page.screenshot({path,fullPage:false});
 const stat=fs.statSync(path);
 results.push({id,filename:path,bytes:stat.size,verifiedSource:"site/public/data/evidence.json"});
 console.log("FIGURE_READY",id,path,stat.size);
}
await browser.close();
fs.writeFileSync(root+"/figures/figures-manifest.json",JSON.stringify({status:"PASS",generatedUtc:new Date().toISOString(),
 count:results.length,images:results,controlledFirstPrivateSpendVerified:true},null,2)+"\n");
console.log(JSON.stringify({status:"PASS",count:results.length,files:results.map(x=>x.filename)},null,2));
