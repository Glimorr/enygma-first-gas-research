import { load,checkOffline } from "./verify_observational.mjs";
import fs from "node:fs";
const root=new URL("../..",import.meta.url).pathname.replace(/\/$/,"");
const original=load();
const tests=[
 ["wrong-chain-id",s=>s.baseline.chain_id=1,"baseline.chainId"],
 ["baseline-hash-mutation",s=>s.baseline.blocks[0].hash="0x"+"a".repeat(64),"baseline.snapshotHash"],
 ["broken-parent-link",s=>s.baseline.blocks[2].parentHash="0x"+"f".repeat(64),"baseline.parentLink"],
 ["log-count-mutation",s=>s.scan.totalLogs+=1,"scan.totalLogs"],
 ["duplicate-log-index",s=>{
    const a=s.scan.events.find(x=>x.event==="UserRegistered");
    const b=s.scan.events.find(x=>x.txHash===a.txHash&&x.logIndex!==a.logIndex);
    b.logIndex=a.logIndex;
 },"scan.duplicateLogIndex"],
 ["event-outside-window",s=>s.scan.events[0].blockNumber=s.scan.fromBlock-1,"scan.eventOutsideWindow"],
 ["event-summary-count-mutation",s=>s.scan.decodedEventCounts["next.Relayed"]+=1,"scan.eventCountsMismatch"],
 ["fee-event-mutation",s=>s.fees.rows[1].feeEventWei=(BigInt(s.fees.rows[1].feeEventWei)+1n).toString(),"fees.feeMismatch"],
 ["fee-transfer-mutation",s=>s.fees.rows[1].rlsTransferLogs[0].amountWei=(BigInt(s.fees.rows[1].rlsTransferLogs[0].amountWei)+1n).toString(),"fees.transferMismatch"],
 ["duplicated-fee-transaction",s=>s.fees.rows[0].txHash=s.fees.rows[1].txHash,"fees.duplicateTransaction"],
 ["receipt-status-mutation",s=>s.fees.rows[1].txStatus=0,"fees.receiptStatus"],
 ["forwarder-source-mutation",s=>s.inventory.bundle_forwarder_matches_relayers_live_forwarder=false,"inventory.forwarderMapping"],
 ["missing-rls-bytecode",s=>s.inventory.contract_inventory.RLS.code_hex_bytes=0,"inventory.RLSCode"]
];
const passing=checkOffline(original);
if(passing.length)throw Error("Original evidence failed before tamper testing: "+passing.join(","));
const results=[];
for(const [name,mutate,expected] of tests){
 const copy=structuredClone(original);
 mutate(copy);
 const failed=checkOffline(copy);
 results.push({name,detected:failed.some(e=>e.startsWith(expected)),expected,actual:failed});
}
const out={executedAtUtc:new Date().toISOString(),testCount:results.length,
 detectedCount:results.filter(x=>x.detected).length,results,
 note:"All mutations are in memory; original evidence files were not changed."};
fs.writeFileSync(root+"/qa/tamper-tests.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({status:out.detectedCount===out.testCount?"PASS":"FAIL",
 detected:out.detectedCount,total:out.testCount,
 failedTests:results.filter(x=>!x.detected)},null,2));
if(out.detectedCount!==out.testCount)process.exitCode=1;
