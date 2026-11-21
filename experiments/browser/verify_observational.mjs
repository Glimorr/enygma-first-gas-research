import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { Interface } from "ethers";
const root=new URL("../..",import.meta.url).pathname.replace(/\/$/,"");
const loc={
 baseline:root+"/evidence/public-rpc/baseline.json",
 inventory:root+"/evidence/public-rpc/contract-inventory.json",
 scan:root+"/evidence/public-rpc/observational/window-24670000-24690000.json",
 fees:root+"/evidence/public-rpc/observational/forwarder-fees.json",
 bundle:root+"/research/live-app-bundle.js"
};
export function load(){
 return Object.fromEntries(Object.entries(loc).filter(([k])=>k!=="bundle")
  .map(([k,v])=>[k,JSON.parse(fs.readFileSync(v,"utf8"))]));
}
function sorted(v){
 if(Array.isArray(v))return v.map(sorted);
 if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])]));
 return v;
}
function hash(v){return crypto.createHash("sha256").update(v).digest("hex");}
function hex(h,n){return typeof h==="string"&&new RegExp("^0x[0-9a-fA-F]{"+n+"}$").test(h)}
export function checkOffline({baseline,inventory,scan,fees}){
 const errors=[];
 const assert=(test,message)=>{if(!test)errors.push(message)};
 assert(baseline.chain_id===7295799,"baseline.chainId");
 assert(inventory.chain_id===7295799,"inventory.chainId");
 assert(scan.chainId===7295799,"scan.chainId");
 const baseCopy=structuredClone(baseline);
 const expected=baseCopy.snapshot_sha256_without_this_field;
 delete baseCopy.snapshot_sha256_without_this_field;
 assert(hash(JSON.stringify(sorted(baseCopy)))===expected,"baseline.snapshotHash");
 assert(baseline.blocks.length===6,"baseline.sixBlocks");
 for(let i=0;i<baseline.blocks.length;i++){
  const block=baseline.blocks[i];
  assert(hex(block.hash,64)&&hex(block.parentHash,64),"baseline.blockHash");
  if(i>0){
    assert(block.number===baseline.blocks[i-1].number+1,"baseline.contiguous");
    assert(block.parentHash.toLowerCase()===baseline.blocks[i-1].hash.toLowerCase(),"baseline.parentLink");
  }
 }
 assert(inventory.bundle_forwarder_matches_relayers_live_forwarder===true,"inventory.forwarderMapping");
 assert(inventory.contract_inventory.RLS?.code_hex_bytes>0,"inventory.RLSCode");
 for(const name of ["UserRegistry","SharedVault"]){
  assert(inventory.contract_inventory[name]?.code_hex_bytes>0,"inventory."+name+"Code");
  assert(inventory.contract_inventory[name]?.eip1967_implementation_code_bytes>0,
    "inventory."+name+"Implementation");
 }
 assert(scan.fromBlock===24670000&&scan.toBlock===24690000,"scan.windowScope");
 assert(scan.errors.length===0,"scan.errors");
 assert(scan.totalLogs===scan.events.length,"scan.totalLogs");
 assert(scan.distinctTxs===new Set(scan.events.map(e=>e.txHash)).size,"scan.uniqueTxCount");
 const eventCounts={},eventIds=new Set();
 for(const e of scan.events){
  assert(e.blockNumber>=scan.fromBlock&&e.blockNumber<=scan.toBlock,"scan.eventOutsideWindow");
  assert(hex(e.txHash,64),"scan.txHashInvalid");
  const eventId=e.txHash.toLowerCase()+"/"+e.logIndex;
  assert(!eventIds.has(eventId),"scan.duplicateLogIndex");
  eventIds.add(eventId);
  const key=e.name+"."+e.event;
  eventCounts[key]=(eventCounts[key]||0)+1;
 }
 assert(JSON.stringify(sorted(eventCounts))===JSON.stringify(sorted(scan.decodedEventCounts)),
    "scan.eventCountsMismatch");
 const relayed=scan.events.filter(e=>e.event==="Relayed");
 assert(fees.rows.length===relayed.length,"fees.rowCount");
 assert(fees.errors.length===0,"fees.sourceErrors");
 assert(new Set(fees.rows.map(r=>r.txHash.toLowerCase())).size===fees.rows.length,
    "fees.duplicateTransaction");
 for(const row of fees.rows){
  const event=relayed.find(x=>x.txHash.toLowerCase()===row.txHash.toLowerCase());
  assert(!!event,"fees.missingSourceEvent");
  if(!event)continue;
  const scope=row.txHash.slice(0,12);
  assert(row.blockNumber===event.blockNumber,"fees.blockMismatch."+scope);
  assert(row.feeEventWei===event.fields.fee,"fees.feeMismatch."+scope);
  assert(row.reportedForwarderFromEvent.toLowerCase()===event.fields.from.toLowerCase(),
    "fees.senderMismatch."+scope);
  assert(row.eventRelayer.toLowerCase()===event.fields.relayer.toLowerCase(),
    "fees.relayerMismatch."+scope);
  assert(row.txStatus===1,"fees.receiptStatus."+scope);
  assert(Number(row.gasUsed)>0,"fees.gasUsed."+scope);
  assert(hex(row.blockHash,64),"fees.blockHash."+scope);
  assert(row.blockHeaderMatchesReceipt===true,"fees.blockHeader."+scope);
  let matching=0n,treasury=0n;
  for(const tr of row.rlsTransferLogs){
   const value=BigInt(tr.amountWei);
   assert(value>=0n,"fees.negativeTransfer."+scope);
   if(tr.from.toLowerCase()===row.reportedForwarderFromEvent.toLowerCase()&&
      tr.to.toLowerCase()===row.eventRelayer.toLowerCase())matching+=value;
   if(tr.to.toLowerCase()===fees.treasury.toLowerCase())treasury+=value;
  }
  assert(matching===BigInt(row.feeEventWei),"fees.transferMismatch."+scope);
  assert(treasury===BigInt(row.treasuryTransferWei),"fees.treasurySum."+scope);
  if(BigInt(row.feeEventWei)>0n){
   assert(row.toActiveForwarder===true,"fees.positiveFeeNotForwarder."+scope);
  }
 }
 return errors;
}
async function rpc(method,params=[]){
 const response=await fetch("https://testnet-rpc.rayls.com/",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
 if(!response.ok)throw Error(method+" HTTP "+response.status);
 const r=await response.json();
 if(r.error)throw Error(method+" "+JSON.stringify(r.error).slice(0,300));
 return r.result;
}
async function checkLive({inventory,fees}){
 const errors=[];
 const assert=(v,label)=>{if(!v)errors.push(label)};
 const cid=Number(BigInt(await rpc("eth_chainId")));
 assert(cid===7295799,"live.chain");
 const code=await rpc("eth_getCode",[inventory.relayer_report.active_forwarder,"latest"]);
 assert(hash(Buffer.from(code.slice(2),"hex"))===inventory.contract_inventory.next.code_sha256,
    "live.forwarderCodeDrift");
 const relayedAbi=JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json"));
 const iface=new Interface(relayedAbi);
 const tokenIface=new Interface(["event Transfer(address indexed from,address indexed to,uint256 value)"]);
 let verified=0;
 for(const row of fees.rows){
  const rec=await rpc("eth_getTransactionReceipt",[row.txHash]);
  if(!rec){errors.push("live.receiptUnavailable."+row.txHash);continue}
  const block=await rpc("eth_getBlockByNumber",[rec.blockNumber,false]);
  assert(block?.hash.toLowerCase()===row.blockHash.toLowerCase(),"live.blockHash."+row.txHash);
  assert(Number(BigInt(rec.status))===row.txStatus,"live.status."+row.txHash);
  assert(Number(BigInt(rec.gasUsed)).toString()===row.gasUsed,"live.gasUsed."+row.txHash);
  assert(rec.logs.length===row.countOfReceiptLogs,"live.logCount."+row.txHash);
  const relayedEvents=[];
  const amounts=[];
  for(const log of rec.logs){
   const address=log.address.toLowerCase();
   if(address===fees.forwarder.toLowerCase()){
    try{const e=iface.parseLog(log);if(e?.name==="Relayed")relayedEvents.push(e)}catch{}
   }
   if(address===fees.tokenAddress.toLowerCase()){
    try{const e=tokenIface.parseLog(log);if(e?.name==="Transfer")amounts.push(e)}catch{}
   }
  }
  assert(relayedEvents.length===1,"live.relayCount."+row.txHash);
  if(relayedEvents.length){
   const ev=relayedEvents[0];
   assert(ev.args.fee.toString()===row.feeEventWei,"live.feeValue."+row.txHash);
   assert(ev.args.from.toLowerCase()===row.reportedForwarderFromEvent.toLowerCase(),
      "live.from."+row.txHash);
   assert(ev.args.relayer.toLowerCase()===row.eventRelayer.toLowerCase(),
      "live.relayer."+row.txHash);
  }
  let total=0n;
  for(const ev of amounts){
   if(ev.args.from.toLowerCase()===row.reportedForwarderFromEvent.toLowerCase()&&
      ev.args.to.toLowerCase()===row.eventRelayer.toLowerCase())total+=ev.args.value;
  }
  assert(total.toString()===row.feeEventWei,"live.transferValue."+row.txHash);
  verified++;
 }
 return {errors,receiptsRechecked:verified};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const snapshot=load();
 const offline=checkOffline(snapshot);
 const runLive=process.argv.includes("--live");
 const live=runLive&&offline.length===0?await checkLive(snapshot):null;
 const result={verifiedAtUtc:new Date().toISOString(),
   evidence_class:"OBSERVATIONAL_PUBLIC_CHAIN_EVIDENCE",
   offlinePass:offline.length===0,offlineErrors:offline,
   liveCheckRequested:runLive,livePass:live?live.errors.length===0:null,
   liveErrors:live?.errors??[],receiptsRechecked:live?.receiptsRechecked??0,
   status:(offline.length===0&&(!runLive||live?.errors.length===0))?"PASS":"FAIL"};
 const out=root+"/qa/verification-"+(runLive?"live":"offline")+".json";
 fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));
 if(result.status!=="PASS")process.exitCode=1;
}
