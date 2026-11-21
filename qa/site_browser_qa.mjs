/**
 * Local-only static research preview browser QA.
 * Tests data integrity, responsive overflow, interactions and public assets.
 * No wallet connection, no passkey, no transaction, no invitation secret.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {chromium}=require("playwright");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const label=process.env.W3_QA_LABEL||"development";
const out=root+"/recording/site-previews/"+label;
fs.mkdirSync(out,{recursive:true});
const base=process.env.W3_SITE_URL||"http://127.0.0.1:4173/";
const cases=[
 {name:"desktop",width:1440,height:900},
 {name:"tablet",width:900,height:1050},
 {name:"mobile",width:390,height:844}
];
const report={evidence_class:"LOCAL_WEBSITE_CHECKPOINT_BROWSER_QA_NOT_FINAL_RELEASE",
 runUtc:new Date().toISOString(),passed:true,tests:[],screenshots:[],
 pendingContentIntentional:true};
const record=(name,ok,details="")=>{
 report.tests.push({name,pass:Boolean(ok),details:String(details).slice(0,350)});
 if(!ok)report.passed=false;
 console.log(ok?"PASS ":"FAIL ",name,details);
};
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader"]});
 for(const device of cases){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
    deviceScaleFactor:1,reducedMotion:"reduce"});
  const page=await context.newPage();
  const errors=[],consoleErrors=[],requestErrors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text())});
  page.on("requestfailed",r=>{if(r.url().startsWith(base))requestErrors.push(r.url()+": "+r.failure()?.errorText)});
  try{
   const response=await page.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
   record(device.name+".htmlStatus",response?.status()===200,String(response?.status()));
   await page.waitForSelector(".status-line p strong",{timeout:15000});
   await page.waitForTimeout(1300);
   const title=await page.title();
   record(device.name+".title",title.includes("First-Gas"),title);
   const status=await page.locator(".status-line p").innerText();
   record(device.name+".statusAccurate",
    status.toLowerCase().includes("first private spend")&&status.toLowerCase().includes("verified"),
    status.slice(0,160));
   record(device.name+".proofTabs",await page.locator(".tab[data-proof]").count()===5);
   await page.locator(".tab[data-proof=claim]").click();
   record(device.name+".claimTabContent",(
     await page.locator("#proof-readout").innerText()).includes("17.304"));
   await page.locator(".tab[data-proof=register]").click();
   record(device.name+".registrationTabContent",(
     await page.locator("#proof-readout").innerText()).includes("@devil"));
   await page.locator(".tab[data-proof=spend]").click();
   record(device.name+".firstPrivateSendTabContent",(
     await page.locator("#proof-readout").innerText()).includes("@rq3dev26") &&
     (await page.locator("#proof-readout").innerText()).includes("3 RLS"));
   await page.locator(".tab[data-proof=invite]").click();
   record(device.name+".inviteTabContent",(
     await page.locator("#proof-readout").innerText()).includes("30 RLS"));
   const bars=await page.locator("#payout-chart .bar-wrap").count();
   record(device.name+".feeChartBars",bars===7,"bars="+bars);
   record(device.name+".privateFeeRows",await page.locator("#private-fee-notes .private-fee-row").count()===3);
   record(device.name+".replayRows",await page.locator("#replay-cases .replay-row").count()===3);
   const rows=await page.locator("#verification-register .verification-row").count();
   record(device.name+".evidenceRows",rows>=16,"rows="+rows);
   await page.locator(".route-card[data-route=shielded]").click();
   record(device.name+".routeControl",(
     await page.locator("#route-detail").innerText()).includes("ZERO") ||
     (await page.locator("#route-detail").innerText()).includes("zero public funds"));
   const metrics=await page.evaluate(()=>{
    const max=document.documentElement.scrollWidth,windowW=window.innerWidth;
    return {max,windowW,hasHorizontalOverflow:max>windowW+2,hasH1:!!document.querySelector("h1")};
   });
   record(device.name+".noHorizontalOverflow",!metrics.hasHorizontalOverflow,JSON.stringify(metrics));
   const assets=await page.evaluate(()=>[
    ...[...document.querySelectorAll("img")].map(x=>x.currentSrc),
    document.querySelector('link[rel="icon"]')?.href,
    document.querySelector(".archive-downloads a")?.href
   ].filter(Boolean));
   for(const [i,asset] of assets.entries()){
    if(!asset.startsWith(base))continue;
    const assetResponse=await page.request.get(asset,{timeout:12000});
    record(device.name+".asset"+i,assetResponse.status()===200,
      asset.split("/").slice(-1)[0]+" "+assetResponse.status());
   }
   // Two sections plus full-page screenshot for user recording/website QA.
   const filename=out+"/"+device.name+"-checkpoint.png";
   await page.screenshot({path:filename,fullPage:true,animations:"disabled"});
   report.screenshots.push(filename);
   record(device.name+".screenshot",fs.existsSync(filename),filename);
   record(device.name+".noPageError",errors.length===0,JSON.stringify(errors).slice(0,270));
   record(device.name+".noInternalRequestError",requestErrors.length===0,JSON.stringify(requestErrors).slice(0,250));
   record(device.name+".noConsoleErrors",consoleErrors.length===0,JSON.stringify(consoleErrors).slice(0,400));
  }catch(e){
   record(device.name+".testException",false,String(e).slice(0,800));
  }finally{
   await context.close();
  }
 }
}catch(e){record("browserLaunch",false,String(e).slice(0,800))}
finally{await browser?.close()}
const path=root+"/qa/site-"+label+"-browser-qa-report.json";
fs.writeFileSync(path,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({status:report.passed?"PASS":"FAIL",passed:report.tests.filter(x=>x.pass).length,
 total:report.tests.length,screenshots:report.screenshots,report:path},null,2));
if(!report.passed)process.exitCode=1;
