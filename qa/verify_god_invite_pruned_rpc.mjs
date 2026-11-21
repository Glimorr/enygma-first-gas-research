/**
 * Reauthenticate the PRIVATE INVITATION public envelope when archived eth_call
 * state is pruned. This never reuses stale balance snapshots as live data.
 * Fresh JSON RPC independently supplies tx, receipt, block, and log events.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inventory=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const vault=inventory.contract_inventory.SharedVault.address;
const relayer=inventory.relayer_report.relayer_address;
const hash="0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab";
const ABI=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const same=(a,b)=>String(a??"").toLowerCase()===String(b??"").toLowerCase();
const expect=(ok,msg)=>{if(!ok)throw Error("LIVE_INVITE_ENVELOPE_FAIL "+msg)};
async function rpc(method,params=[]){
 const r=await fetch("https://testnet-rpc.rayls.com/",{method:"POST",
  headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method,params,id:1}),
  signal:AbortSignal.timeout(26000)});
 if(!r.ok)throw Error(method+" HTTP "+r.status);
 const result=await r.json();if(result.error)throw Error(method+" "+JSON.stringify(result.error));
 return result.result;
}
expect(Number(BigInt(await rpc("eth_chainId")))===7295799,"wrong chain");
const [tx,receipt]=await Promise.all([rpc("eth_getTransactionByHash",[hash]),rpc("eth_getTransactionReceipt",[hash])]);
expect(!!tx&&!!receipt&&receipt.status==="0x1","missing or failed receipt");
const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
expect(block&&same(tx.blockHash,receipt.blockHash)&&same(block.hash,receipt.blockHash),"block consistency");
expect(block.transactions.some(x=>same(x.hash,hash)),"not included in mined block");
expect(Number(BigInt(receipt.blockNumber))===24744028,"unexpected height");
expect(same(tx.from,relayer)&&same(tx.to,vault),"unexpected submitter/vault");
const parsed=ABI.parseTransaction({data:tx.input});
expect(parsed?.name==="transferV2","not private transfer");
expect(Number(parsed.args[0].numberOfInputs)===1&&Number(parsed.args[0].numberOfOutputs)===3,"unexpected input/output");
const noteCount={Nullifier:0,Commitment:0,EncryptedNote:0},commitments=new Set(),encrypted=[];
for(const log of receipt.logs){
 expect(same(log.transactionHash,hash)&&same(log.address,vault),"unexpected event contract/tx");
 const e=ABI.parseLog(log);
 expect(e&&e.name in noteCount,"undecoded event");
 noteCount[e.name]++;
 if(e.name==="Commitment")commitments.add(String(e.args.commitment));
 if(e.name==="EncryptedNote")encrypted.push({commitment:String(e.args.commitment),
  ctI:(e.args.ciphertextI.length-2)/2,ctII:(e.args.ciphertextII.length-2)/2});
}
expect(receipt.logs.length===7&&noteCount.Nullifier===1&&noteCount.Commitment===3&&noteCount.EncryptedNote===3,"event topology");
expect(encrypted.every(x=>commitments.has(x.commitment)&&x.ctI===1088&&x.ctII===92),"note correspondence");
const second=await rpc("eth_getLogs",[{address:vault,fromBlock:receipt.blockNumber,toBlock:receipt.blockNumber}]);
const matching=second.filter(x=>same(x.transactionHash,hash));
expect(matching.length===receipt.logs.length,"second logs length");
for(const l of receipt.logs)expect(matching.some(x=>x.logIndex===l.logIndex&&same(x.data,l.data)&&
  JSON.stringify(x.topics.map(String))===JSON.stringify(l.topics.map(String))),"second logs bytes");
const summary={
 status:"PASS",evidence_class:"FRESH_PUBLIC_RPC_INVITATION_RECEIPT_AND_LOGS__NOT_ARCHIVED_BALANCES",
 validatedUtc:new Date().toISOString(),txHash:hash,block:24744028,receiptStatus:1,
 nullifiers:noteCount.Nullifier,commitments:noteCount.Commitment,encryptedNotes:noteCount.EncryptedNote,
 independentlyQueriedLogsVerified:true,
 note:"Historical account balance eth_call was NOT used: the endpoint has pruned old state. Use recorded original fixed-block captures and separate event-reconstruction scripts for state claims."
};
fs.writeFileSync(root+"/qa/invite-pruned-state-receipt-check.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
