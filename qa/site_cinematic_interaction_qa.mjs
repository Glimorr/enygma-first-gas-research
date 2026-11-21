/**
 * High-motion and accessible reduced-motion QA of the actual new experience.
 * No wallet signing; never loads invitation links or credentials.
 * Tests interactions behind the aesthetics rather than counting ornaments.
 */
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {chromium}=require("playwright");
const BASE=process.env.W3_SITE_URL||"http://127.0.0.1:4180/rayls-wq3/";
const LABEL=process.env.W3_QA_LABEL||"cinematic-interaction";
const root="/mnt/e/Rayls-Nov-Week3";
const dir=path.join(root,"recording/site-previews",LABEL);
fs.mkdirSync(dir,{recursive:true});
const tests=[],screens=[];
const check=(label,pass,details="")=>{
 const item={label,pass:!!pass,details:String(details).slice(0,500)};
 tests.push(item);console.log((pass?"PASS ":"FAIL ")+label+(details?" "+item.details:""));
};
const cases=[
 {name:"desktop-motion",width:1440,height:900,mode:"no-preference"},
 {name:"mobile-motion",width:390,height:844,mode:"no-preference"},
 {name:"tablet-reduced",width:900,height:1050,mode:"reduce"},
 {name:"desktop-reduced",width:1440,height:900,mode:"reduce"}
];
const b=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader"]});
for(const device of cases){
 const context=await b.newContext({viewport:{width:device.width,height:device.height},
  deviceScaleFactor:1,reducedMotion:device.mode});
 const p=await context.newPage(),errors=[];
 p.on("pageerror",err=>errors.push("PAGE "+err.message));
 p.on("console",msg=>{if(msg.type()==="error")errors.push("CONSOLE "+msg.text())});
 p.setDefaultTimeout(20000);
 const save=async name=>{
  const target=path.join(dir,device.name+"-"+name+".png");
  await p.screenshot({path:target,animations:"disabled"});
  screens.push(target);
 };
 try{
  const response=await p.goto(BASE,{waitUntil:"domcontentloaded",timeout:50000});
  check(device.name+".html200",response?.status()===200);
  await p.locator("#cohort-compare .cohort-card").first().waitFor({timeout:25000});
  await p.waitForTimeout(device.name==="desktop-motion"?1100:420);
  check(device.name+".noEvidenceError",await p.locator(".evidence-error").count()===0);
  const state=await p.evaluate(()=>{
   const $=s=>document.querySelector(s);
   return {
    nav:getComputedStyle($(".nav-wrap")).position,
    guide:getComputedStyle($("#research-guide")).position,
    mobileOverflow:document.documentElement.scrollWidth>innerWidth+2,
    titleWhite:getComputedStyle($(".hero-head .hero-line:last-child .char-mask")).color,
    heroLime:getComputedStyle($(".hero-head .bright .char-mask")).color,
    sourceRecordCount:document.querySelectorAll("#verification-register .verification-row").length,
    storyActCount:document.querySelectorAll(".journey-scene").length
   };
  });
  check(device.name+".fixedNavAndGuide",state.nav==="fixed"&&state.guide==="fixed",JSON.stringify(state));
  check(device.name+".whiteAndLimeHero",
    state.titleWhite==="rgb(249, 246, 255)"&&state.heroLime==="rgb(231, 253, 76)");
  check(device.name+".noHorizontalOverflow",!state.mobileOverflow);
  check(device.name+".sourceRegisterAnd4ActStory",state.sourceRecordCount>=22&&state.storyActCount===4);
  await save("hero");
  // Animated hero and scroll story are responsive and do not block copy.
  if(device.width>950&&device.mode==="no-preference"){
   await p.evaluate(()=>{
    const el=document.getElementById("journey");
    scrollTo({top:el.offsetTop+(el.offsetHeight-innerHeight)*.68,behavior:"instant"});
   });
   await p.waitForTimeout(620);
   const story=await p.evaluate(()=>({
    active:[...document.querySelectorAll(".journey-scene.active")].map(x=>x.dataset.step),
    index:document.getElementById("journey-index").textContent.trim(),
    fraction:document.getElementById("journey-pct").textContent.trim()
   }));
   check(device.name+".interactiveScrollChangesAct",story.index==="03"&&story.active.includes("2"),JSON.stringify(story));
  }else{
   const scene=await p.evaluate(()=>[...document.querySelectorAll(".journey-scene")]
     .every(x=>getComputedStyle(x).visibility==="visible"&&getComputedStyle(x).opacity==="1"));
   check(device.name+".allStoriesReadableWithoutScrollPin",scene);
  }
  await p.locator("#journey").scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);await save("journey");
  // The guide is a genuine control, not a fake chatbot.
  const guide=p.locator("#guide-toggle");
  await guide.click();
  check(device.name+".guideOpens",await p.locator("#guide-panel").isVisible());
  check(device.name+".guideHonesty",(
    await p.locator(".guide-disclaimer").innerText()).includes("not a Rayls assistant"));
  await save("guide");
  await p.locator("#guide-close").click();
  check(device.name+".guideCloses",!(await p.locator("#guide-panel").isVisible()));
  // Interactive public and wallet evidence lens.
  await p.locator("#visibility-lens").scrollIntoViewIfNeeded();
  await p.locator("#lens-range").evaluate(el=>{
   el.value="80";el.dispatchEvent(new Event("input",{bubbles:true}));
  });
  check(device.name+".lensReactsToInput",
    await p.locator(".lens-window").evaluate(x=>x.classList.contains("focus-wallet"))&&
    (await p.locator(".lens-focus-caption").innerText()).includes("3 → 6 RLS"));
  await save("evidence-lens");
  // Select verified private gross fee source; do not synthesize quotes.
  await p.locator("#fee-laboratory").scrollIntoViewIfNeeded();
  await p.locator(".fee-switch [data-fee-case=private]").click();
  await p.waitForTimeout(device.mode==="reduce"?80:750);
  const fee=await p.evaluate(()=>({
   gross:document.querySelector("#lab-gross").textContent,
   base:document.querySelector("#lab-base").textContent,
   foundation:document.querySelector("#lab-foundation").textContent,
   href:document.querySelector("#fee-case-link").href,
   pressed:document.querySelector(".fee-switch [data-fee-case=private]").getAttribute("aria-pressed")
  }));
  check(device.name+".actualPrivateFeeSelectable",fee.gross==="4.41600000"&&
    fee.base==="3.84000000 RLS"&&fee.foundation==="0.57600000 RLS"&&
    fee.href.endsWith("0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb")
    &&fee.pressed==="true",JSON.stringify(fee));
  await save("fee-lab");
  await p.locator(".fee-switch [data-fee-case=shield]").click();
  await p.waitForTimeout(device.mode==="reduce"?80:680);
  check(device.name+".actualPublicShieldFeeSelectable",
    (await p.locator("#lab-gross").innerText())==="3.52580064");
  // Original six tabs and route cards still use real receipts.
  await p.locator(".tab[data-proof=second]").click();
  check(device.name+".secondPrivateReceiptTabAccurate",
    (await p.locator("#proof-readout").innerText()).includes("6 RLS") &&
    (await p.locator("#proof-tx-link").getAttribute("href")).endsWith("0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb"));
  await p.locator(".route-card[data-route=faucet]").click();
  check(device.name+".routeStudySourceAccurate",
    (await p.locator("#route-detail").innerText()).includes("@rq3faucet26") &&
    (await p.locator("#route-detail a").getAttribute("href")).endsWith("0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb"));
  await save("proof");
  // Animate on supported devices; controls must still obey manual pause.
  if(device.mode==="no-preference"){
   await p.locator("#motion-toggle").click();
   check(device.name+".motionPauseWorks",await p.locator("html.motion-paused").count()===1);
   await p.locator("#motion-toggle").click();
   check(device.name+".motionResumeWorks",await p.locator("html.motion-paused").count()===0);
  }else{
   check(device.name+".reducedMotionIsHonored",await p.locator("html.motion-paused").count()===1);
  }
  check(device.name+".noRuntimeErrors",errors.length===0,JSON.stringify(errors));
 }catch(err){
  check(device.name+".testException",false,String(err).slice(0,900));
  check(device.name+".runtimeErrors",errors.length===0,JSON.stringify(errors));
 }finally{await context.close()}
}
await b.close();
const summary={evidenceClass:"DESIGN_REBUILD_INTERACTIVE_ANIMATION_ACCESSIBILITY_AND_PROVENANCE_QA",
 testedUrl:BASE,checkedAtUtc:new Date().toISOString(),
 passed:tests.every(t=>t.pass),passCount:tests.filter(t=>t.pass).length,testCount:tests.length,
 tests,screenshots:screens};
const out=path.join(root,"qa/site-"+LABEL+"-interaction-qa-report.json");
fs.writeFileSync(out,JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({status:summary.passed?"PASS":"FAIL",passed:summary.passCount,
 total:summary.testCount,report:out,screenshots:screens.length},null,2));
if(!summary.passed)process.exitCode=1;
