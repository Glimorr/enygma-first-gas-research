import "./style.css";
import gsap from "gsap";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const explorer = hash => "https://testnet-explorer.rayls.com/tx/" + hash;
let evidence = null;
let animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let heroRunning = false;
let stopHero = () => {};
const shorten = (hash,head=12,tail=9) => hash ? hash.slice(0,head)+"…"+hash.slice(-tail) : "Not applicable";
const fmt = (number,dp=2) => Number(number).toLocaleString("en-US",{minimumFractionDigits:dp,maximumFractionDigits:dp});
const text = (tag,className,value) => {const el=document.createElement(tag);el.className=className;el.textContent=String(value);return el};
const urlHash = h => h && /^0x[a-fA-F0-9]{64}$/.test(h) ? explorer(h) : null;
const validData = obj => {
 if(!obj || obj.chainId!==7295799 || !obj.claims?.publicShield?.tx || !obj.receiverLifecycle?.claimTx)throw Error("Research dataset missing required public-chain records");
 if(JSON.stringify(obj).includes("enygma-testnet.rayls.com/i#"))throw Error("A confidential invitation link appeared in the site dataset");
 return obj;
};
function startup(){
 const loader=$("#loading");
 window.setTimeout(()=>loader?.classList.add("hide"),300);
 window.setTimeout(()=>loader?.remove(),1400);
 const motionBtn=$("#motion-toggle");
 if(motionBtn)motionBtn.addEventListener("click",()=>{
  animate=!animate;motionBtn.setAttribute("aria-pressed",String(!animate));
  motionBtn.setAttribute("aria-label",animate?"Pause motion":"Resume motion");
  motionBtn.title=animate?"Pause motion":"Resume motion";
  stopHero(!animate);
 });
 const menu=$("#menu-toggle"),nav=$(".nav-center");
 menu?.addEventListener("click",()=>{
  const open=nav?.classList.toggle("open");
  menu.setAttribute("aria-expanded",String(Boolean(open)));
 });
 $$(".nav-center a").forEach(a=>a.addEventListener("click",()=>{
  nav?.classList.remove("open");menu?.setAttribute("aria-expanded","false");
 }));
}
function renderRoutes(){
 const stories={
  funded:{
   title:"01 / PUBLIC FUNDED CONTROL",
   description:"250 RLS arrived in the Dev wallet through a publicly visible faucet transfer. Registration as @rq3dev26 then charged 7.1930016 RLS as a transparent relayer fee. Both receipts and their transfer events were independently checked.",
   href:explorer(evidence.claims.registration.tx),text:"Open funded registration receipt ↗"
  },
  shielded:{
   title:"02 / PRIVATE INVITATION & CLAIM",
   description:"The @god wallet shielded 40 RLS and created a 30 RLS invitation. The fresh passkey account claimed it, registered as @devil with zero public funds, and successfully sent 3 shielded RLS to the independently checked @rq3dev26 receiving wallet.",
   href:explorer(evidence.receiverLifecycle.registrationTx),text:"Open publicly verified recipient registration ↗"
  },
  faucet:{
   title:"03 / PUBLIC FAUCET + PUBLIC SHIELD COMPARISON",
   description:"A second fresh passkey @rq3faucet26 received public RLS/USDr, paid a public registration fee, shielded 20 RLS publicly, then sent 3 RLS privately. The receiving wallet independently displayed 3 → 6 shielded RLS. The direct shielded faucet was disabled during a shared-looking cooldown.",
   href:explorer(evidence.secondCohort.privateSendTx),text:"Open the second verified private send ↗"
  }
 };
 const container=$("#route-detail"),heading=container.querySelector(".detail-number"),description=container.querySelector(".detail-body"),link=container.querySelector("a");
 const select=key=>{
  $$(".route-card").forEach(c=>{c.classList.toggle("selected",c.dataset.route===key);c.setAttribute("aria-selected",String(c.dataset.route===key))});
  const story=stories[key];heading.textContent=story.title;description.textContent=story.description;link.textContent=story.text;link.setAttribute("href",story.href);
  if(story.href.startsWith("https")){link.target="_blank";link.rel="noopener noreferrer"}else{link.removeAttribute("target");link.removeAttribute("rel")}
 };
 $$(".route-card").forEach(c=>{
  c.addEventListener("click",()=>select(c.dataset.route));
  c.addEventListener("keydown",e=>{if(["Enter"," "].includes(e.key)){e.preventDefault();select(c.dataset.route)}});
 });
 select("funded");
}
function proofData(){
 const e=evidence;
 const sh=e.claims.publicShield,iv=e.claims.invitation,rc=e.receiverLifecycle;
 return {
  shield:{
   block:sh.block,hash:sh.tx,title:"Public shielding",
   method:"depositWithPermit",principal:sh.amount+" RLS publicly transferred",events:sh.logs,
   features:[["Vault deposit",sh.amount+" RLS publicly disclosed"],
     ["Relayer fee",sh.fee+" RLS publicly disclosed"],["Account public debit",sh.totalDebit+" RLS"],
     ["Vault commitments",String(sh.eventCounts.commitments)],
     ["Encrypted notes",String(sh.eventCounts.encrypted_notes)],
     ["Receipt class","Transparent token movements + encrypted commitment"]],
   from:"PUBLIC ACCOUNT",to:"SHARED VAULT"
  },
  invite:{
   block:iv.block,hash:iv.tx,title:"Private invitation creation",method:iv.method,
   principal:"30 RLS · owner-wallet observed",events:iv.noteCount+iv.commitmentCount+iv.nullifierCount,
   features:[["Wallet-observed amount","30 RLS (not public RPC)"],
     ["Public source token transfer","None in receipt"],["Nullifiers",String(iv.nullifierCount)],
     ["New commitments",String(iv.commitmentCount)],["Encrypted notes",String(iv.noteCount)],
     ["Public balance change","Zero for @god"]],
   from:"PRIVATE NOTE",to:"ENCRYPTED NOTES"
  },
  claim:{
   block:rc.claimBlock,hash:rc.claimTx,title:"Private invitation claim",method:rc.claimMethod,
   principal:"17.304 RLS · wallet after claim",events:rc.claimNullifiers+rc.claimCommitments+rc.claimEncryptedNotes,
   features:[["Wallet-observed RLS after claim","17.304 RLS (private)"],
     ["Public RLS received by recipient","0 RLS"],["Nullifiers",String(rc.claimNullifiers)],
     ["Commitments",String(rc.claimCommitments)],["Encrypted notes",String(rc.claimEncryptedNotes)],
     ["Public account nonce","0"]],
   from:"INVITATION NOTE",to:"NEW PRIVATE NOTES"
  },
  register:{
   block:rc.registrationBlock,hash:rc.registrationTx,title:"Invitation-funded registration",method:"UserRegistry",
   principal:"Public registry event @devil",events:3,
   features:[["Registered username","@devil"],
     ["Registration event","UserRegistered"],
     ["Username event","UsernameSet"],
     ["Public Forwarder fee","0 RLS"],["Public EVM nonce","0"],
     ["Public RLS after registration","0 RLS"]],
   from:"RELAYER",to:"REGISTRY"
  },
  spend:{
   block:rc.spendBlock,hash:rc.spendTx,title:"First shielded send from a publicly unfunded account",method:rc.spendMethod,
   principal:"3 RLS · separately seen by both wallet owners",
   events:rc.spendNullifiers+rc.spendCommitments+rc.spendEncryptedNotes,
   features:[["Sender wallet observation","3 RLS to @rq3dev26"],
    ["Receiver's own wallet observation","3 shielded RLS"],
    ["Sender public RLS balance","0 RLS"],
    ["Sender EVM nonce",String(rc.spendPublicSenderEvmNonceAtHead)],
    ["Vault nullifiers",String(rc.spendNullifiers)],
    ["Commitments / encrypted notes",rc.spendCommitments+" / "+rc.spendEncryptedNotes],
    ["Inferred gross relayer fee",rc.spendFeeGrossRls+" RLS"]],
   from:"PRIVATE NOTE",to:"PRIVATE RECIPIENT"
  },
  second:{
    block:e.secondCohort.privateSendBlock,hash:e.secondCohort.privateSendTx,
    title:"Second 3 RLS private send after public faucet and Shield",method:"transferV2",
    principal:"3 RLS · separate sender and receiver wallets",
    events:e.secondCohort.privateSendNullifierCount+e.secondCohort.privateSendCommitmentCount+e.secondCohort.privateSendNoteCount,
    features:[["Sender's source onboarding","250 RLS + 10 USDr PUBLIC faucet"],
      ["Public Shield before send","20 RLS visibly transferred"],
      ["Sender @rq3faucet26 publicly held after send",e.secondCohort.privateSendPublicBalanceAfterRls+" RLS"],
      ["Owner-wallet private send","3 RLS to @rq3dev26"],
      ["Recipient shielded wallet balance","3 → "+e.secondCohort.recipientShieldedBalanceAfterRls+" RLS"],
      ["Vault nullifiers",String(e.secondCohort.privateSendNullifierCount)],
      ["New encrypted notes",String(e.secondCohort.privateSendNoteCount)],
      ["Implied gross private fee",e.secondCohort.privateSendFeeGrossRls+" RLS"]],
    from:"SHIELDED NOTE",to:"SHIELDED RECIPIENT"
  }
 };
}
function renderProof(){
 const data=proofData(),keys=Object.keys(data);
 const meta=$("#proof-meta"),read=$("#proof-readout"),graphic=$("#proof-graphic"),link=$("#proof-tx-link");
 const tabs=$$(".tab[data-proof]");
 const select=key=>{
  const r=data[key];if(!r)return;
  tabs.forEach(t=>{const is=t.dataset.proof===key;t.classList.toggle("active",is);t.setAttribute("aria-selected",String(is));t.tabIndex=is?0:-1});
  meta.replaceChildren();
  const cells=[["CHAIN BLOCK",r.block.toLocaleString("en-US")],["TRANSACTION",shorten(r.hash,9,7)],
    ["OPERATION",r.title],["RECEIPT EVENTS",r.events]];
  for(const [k,v] of cells){const card=text("div","meta-card","");card.append(text("span","k",k),text("div","v"+(String(v).length>14?" small":""),v));meta.append(card)}
  read.replaceChildren(...r.features.map(([key,val])=>{
   const row=text("div","readout-item","");row.append(text("span","k",key),text("span","v",val));return row
  }));
  const nodes=graphic.querySelectorAll(".diagram-node");
  if(nodes.length===2){nodes[0].textContent=r.from;nodes[1].textContent=r.to}
  link.href=explorer(r.hash);
  graphic.setAttribute("aria-label",r.title+": "+r.from+" to "+r.to+". Illustrative topology only.");
 };
 tabs.forEach((tab,i)=>{
  tab.addEventListener("click",()=>select(tab.dataset.proof));
  tab.addEventListener("keydown",evt=>{
   if(!["ArrowRight","ArrowLeft","Home","End"].includes(evt.key))return;
   evt.preventDefault();let index=evt.key==="Home"?0:evt.key==="End"?keys.length-1:(i+(evt.key==="ArrowRight"?1:-1)+keys.length)%keys.length;
   tabs[index].focus();select(tabs[index].dataset.proof);
  });
 });
 select("shield");
}
function renderFees(){
 const sh=evidence.claims.publicShield,tr=evidence.claims.treasury;
 $("#gross-fee").textContent=sh.fee+" RLS";
 $("#base-fee").textContent=tr.baseFeeRls+" RLS";
 $("#treasury-fee").textContent=tr.amount+" RLS";
 const sample=evidence.feeAnalysis.controls.filter(x=>x.paid && x.blocksToPayout!==null);
 const group=new Map();
 for(const item of sample){const k=item.blocksToPayout;group.set(k,(group.get(k)||0)+1)}
 const highest=Math.max(1,...group.values());
 const chart=$("#payout-chart");
 chart.replaceChildren();
 for(let index=3;index<=9;index++){
  const groupEl=text("div","bar-wrap","");
  const num=group.get(index)||0;
  const bar=text("div","bar-column","");
  bar.style.height=(num?20+185*num/highest:4)+"px";
  groupEl.title=num+" of "+sample.length+" paid transactions had a treasury payout "+index+" blocks later";
  groupEl.append(text("span","bar-top",num),bar,text("span","bar-label",index+" blk"));
  chart.append(groupEl);
 }
 const info=$("#private-fee-notes");
 if(info){
  info.replaceChildren();
  const intro=text("p","meta-explainer","FOUR SELECTED PRIVATE OPERATIONS · TWO DIFFERENT FUNDING ROUTES · EXPLORATORY CORRELATION");
  info.append(intro);
  for(const caseData of evidence.privateFeePilot.cases){
   const row=text("div","private-fee-row","");
   row.append(text("span","kind",caseData.kind==="controlled_owner_shielded_invitation"?"Invite creation":caseData.kind==="controlled_receiver_private_claim"?"Invitation claim":caseData.kind==="controlled_public_faucet_cohort_private_send"?"Public-funded second send":"Invitation-funded first send"),
    text("strong","amount",caseData.grossFeeImpliedRls+" RLS"),
    text("span","delay",caseData.payoutDelayBlocks+" BLOCKS TO TREASURY"));
   info.append(row);
  }
  info.append(text("p","private-fee-foot","The private principal remains hidden. These gross fees are inferred from distinct public treasury transfers under the relayer-reported 15% policy, not from private vault calldata."));
 }
}
function renderComparison(){
 const host=$("#cohort-compare");
 if(!host)return;
 const rc=evidence.receiverLifecycle,sc=evidence.secondCohort;
 const rows=[
  {name:"PRIVATE INVITATION",tag:"NO PUBLIC FUNDING",handle:"@devil",publicFunding:"0 public RLS",
   setup:"30 RLS shielded invitation → private claim → fee-sponsored registration",
   publicShield:"No public RLS deposit from receiving account",
   privateTx:rc.spendTx,block:rc.spendBlock,
   receiverNote:"3 RLS shielded after first send",fee:rc.spendFeeGrossRls+" RLS",
   note:"Claiming wallet stayed publicly unfunded throughout. Invitation bearer link exposure is disclosed."},
  {name:"PUBLIC FAUCET & SHIELD",tag:"PUBLIC ENTRY VISIBLE",handle:"@rq3faucet26",
   publicFunding:"250 public RLS + 10 public USDr",
   setup:"Public faucet → public-fee registration → visible 20 RLS shield",
   publicShield:"Source RLS after Shield and private send: "+sc.privateSendPublicBalanceAfterRls,
   privateTx:sc.privateSendTx,block:sc.privateSendBlock,
   receiverNote:"6 RLS shielded after second send",fee:sc.privateSendFeeGrossRls+" RLS",
   note:"A private send does not erase the transparent deposit history. Direct shielded faucet was on cooldown."}
 ];
 host.replaceChildren();
 for(const item of rows){
  const card=text("article","cohort-card","");
  const eyebrow=text("div","cohort-eyebrow",item.name+" · "+item.tag);
  const title=text("h3","cohort-title",item.handle);
  const steps=text("p","cohort-setup",item.setup);
  const publicLine=text("div","cohort-funding","PUBLIC FUNDING · "+item.publicFunding);
  const shield=text("div","cohort-funding",item.publicShield);
  const privateLine=text("div","cohort-private","PRIVATE SEND · 3 RLS · BLOCK "+item.block.toLocaleString("en-US"));
  const balance=text("div","cohort-owner","SEPARATE RECIPIENT WALLET · "+item.receiverNote);
  const fee=text("div","cohort-small","Publicly inferred fee: "+item.fee);
  const limitation=text("p","cohort-caveat",item.note);
  const link=text("a","cohort-link","View authenticated vault receipt ↗");
  link.href=explorer(item.privateTx);link.target="_blank";link.rel="noopener noreferrer";
  card.append(eyebrow,title,steps,publicLine,shield,privateLine,balance,fee,limitation,link);
  host.append(card);
 }
}
function renderRegister(){
 const container=$("#verification-register");
 if(!container)return;
 container.replaceChildren(...evidence.verification.map(r=>{
  const el=text("div","verification-row","");
  el.append(text("span","label",r.name),text("span","value"+(r.type==="Pending"?" pending":""),r.count));
  return el;
 }));
}
function renderReplay(){
 const destination=$("#replay-cases");if(!destination)return;
 destination.replaceChildren(...evidence.replayControls.cases.map(c=>{
  const row=text("div","replay-row","");
  row.append(text("div","replay-title",c.kind==="private_invite_creation"?"Invitation":c.kind==="private_invite_claim"?"Claim":c.kind==="receiver_first_private_send"?"First send · invite":"Second send · public"));
  c.stages.forEach(stage=>{
   row.append(text("span",stage.result==="SUCCESS"?"simulate-ok":"simulate-revert",
     (stage.result==="SUCCESS"?"✓ ":"✕ ")+stage.block.toLocaleString("en-US")));
  });
  return row;
 }));
}
function copyCommands(){
 const b=$("#copy-commands"),code=$("#commands");
 b?.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(code.textContent);b.textContent="COPIED ✓"}
  catch{
   const area=document.createElement("textarea");area.value=code.textContent;document.body.append(area);area.select();
   const ok=document.execCommand("copy");area.remove();b.textContent=ok?"COPIED ✓":"SELECT COMMANDS";
  }
  setTimeout(()=>b.textContent="COPY ↗",1800);
 });
}
function animateReveals(){
 if(!animate || !("IntersectionObserver" in window))return;
 const elements=$$(".reveal");
 for(const element of elements)gsap.set(element,{opacity:0,y:26});
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   gsap.to(entry.target,{opacity:1,y:0,duration:.75,ease:"power3.out",clearProps:"transform"});
   observer.unobserve(entry.target);
  }
 },{threshold:.05});
 elements.forEach(x=>observer.observe(x));
}
async function heroVisual(){
 const canvas=$("#hero-canvas");
 if(!canvas || !animate || window.innerWidth<450 || !("WebGL2RenderingContext" in window))return;
 try{
  const THREE=await import("three");
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,150);
  camera.position.set(0,0,13.5);
  const object=new THREE.Group();object.position.x=3.4;scene.add(object);
  const lime=new THREE.MeshStandardMaterial({color:0xdbf94a,metalness:.4,roughness:.25,emissive:0x2b3300,emissiveIntensity:.4});
  const purple=new THREE.MeshStandardMaterial({color:0x8e6ac9,metalness:.65,roughness:.25,emissive:0x25113a,emissiveIntensity:.8});
  const pale=new THREE.MeshStandardMaterial({color:0xe7caff,metalness:.36,roughness:.24,emissive:0x5b3e75,emissiveIntensity:.45});
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,2),purple);core.rotation.set(.4,.5,.25);object.add(core);
  const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.78,1),
   new THREE.MeshBasicMaterial({color:0xbca3ef,wireframe:true,transparent:true,opacity:.4}));object.add(wire);
  for(let i=0;i<4;i++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6+i*.43,.015,5,140),
    i===1?lime:pale);ring.rotation.set(Math.PI/2-i*.27,i*.4,.13+i*.17);object.add(ring);
  }
  const shards=new THREE.Group();object.add(shards);
  const geometry=new THREE.OctahedronGeometry(.055,0);
  for(let i=0;i<90;i++){
   const phi=Math.acos(2*Math.random()-1),theta=2*Math.PI*Math.random(),r=3.8+Math.random()*2.5;
   const part=new THREE.Mesh(geometry,i%7===0?lime:pale);
   part.position.set(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
   shards.add(part);
  }
  scene.add(new THREE.AmbientLight(0xb7a0ff,2.1));
  const light=new THREE.PointLight(0xf4ebff,30);light.position.set(4,5,8);scene.add(light);
  const glow=new THREE.PointLight(0xd8fd5a,35);glow.position.set(-3,0,4);scene.add(glow);
  let raf=0,paused=false,active=true;
  const size=()=>{
   const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   object.position.x=w>1000?3.6:w>620?2.5:0.8;
   object.scale.setScalar(w>1000?1: w>620?.76:.57);
  };
  size();
  const onResize=()=>size();window.addEventListener("resize",onResize);
  let n=0;
  const draw=()=>{
   if(!active||paused||!animate)return;
   n+=.006;core.rotation.y+=.0024;core.rotation.x+=.0015;
   wire.rotation.y-=.001;shards.rotation.y+=.00055;object.rotation.z=Math.sin(n)*.06;
   renderer.render(scene,camera);raf=requestAnimationFrame(draw);
  };
  const watch=new IntersectionObserver(entries=>{
   active=entries[0]?.isIntersecting??true;
   if(active&&!paused&&animate){cancelAnimationFrame(raf);draw()}
   else cancelAnimationFrame(raf);
  });watch.observe(canvas);
  draw();heroRunning=true;
  stopHero=isPaused=>{paused=isPaused;cancelAnimationFrame(raf);if(!paused&&active)draw()};
  window.addEventListener("pagehide",()=>{cancelAnimationFrame(raf);watch.disconnect();renderer.dispose();window.removeEventListener("resize",onResize)},{once:true});
 }catch(err){console.warn("3D preview unavailable; all research content remains visible.",String(err))}
}
async function main(){
 startup();
 try{
  const root=import.meta.env.BASE_URL;
  const response=await fetch(root+"data/evidence.json",{cache:"no-store"});
  if(!response.ok)throw Error("Evidence JSON not found");
  evidence=validData(await response.json());
  renderRoutes();renderProof();renderFees();renderComparison();renderRegister();renderReplay();copyCommands();animateReveals();heroVisual();
  const message=$(".status-line p");
  if(message)message.innerHTML="Two controlled testnet lifecycles verified: <strong>invitation-funded zero-public-funding onboarding</strong> and <strong>public-faucet onboarding followed by a private 3 RLS send</strong>. Both reached the same independently checked recipient.";
  const boundaries=$("#boundary-list");
  if(boundaries){
   const last=boundaries.querySelector("article:last-child");
   if(last){
    last.querySelector("h3").textContent="Zero-public-funded claim, registration and first private spend";
    last.querySelector("p").textContent="The passkey receiver @devil claimed 17.304 RLS privately, registered, and sent 3 private RLS to @rq3dev26 while retaining zero public RLS/USDr and an EVM nonce of zero. The independent recipient wallet confirmed 3 shielded RLS after that send, then 6 RLS after the separate publicly funded cohort's private payment.";
    last.querySelector(".boundary-mark").textContent="✓";
    last.querySelector(".boundary-mark").classList.remove("pending");
    last.querySelector(".boundary-tag").textContent="LIFECYCLE VERIFIED";
   }
  }
 }catch(error){
  console.error("Research site evidence error",error);
  const app=$("#app");if(app){
   const alert=text("p","evidence-error","Unable to load the current evidence dataset. The site is not asserting unverifiable results.");
   alert.style.cssText="position:fixed;bottom:20px;left:20px;right:20px;z-index:101;padding:15px;color:#fff;background:#521c3b;border:1px solid #e7fd4c;border-radius:12px";
   app.prepend(alert);
  }
 }finally{
  $("#loading")?.classList.add("hide");
  window.setTimeout(()=>$("#loading")?.remove(),750);
 }
}
main();
