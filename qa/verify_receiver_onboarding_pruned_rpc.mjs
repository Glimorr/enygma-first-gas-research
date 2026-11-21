/**
 * Final no-archive-RPC verifier of the actual @devil private claim and public
 * registration receipts. It checks current zero public funds and all scoped
 * ERC20 RLS/USDr transfers since the original preclaim block, without relying
 * on pruned historical eth_call balances. The original fixed-state snapshots
 * remain independently preserved as a distinct original-time evidence class.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,zeroPadValue}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const ABI={
 registry:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8"))),
 vault:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8"))),
 fw:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json","utf8"))),
 token:new Interface(["function balanceOf(address who) view returns(uint256)","event Transfer(address indexed from,address indexed to,uint256 value)"])
};
const receiver="0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C";
const claimTx="0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec";
const regTx="0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b";
const vault=inv.contract_inventory.SharedVault.address,registry=inv.contract_inventory.UserRegistry.address;
const fw=inv.relayer_report.active_forwarder,relayer=inv.relayer_report.relayer_address;
const same=(a,b)=>String(a??"").toLowerCase()===String(b??"").toLowerCase();
const assert=(ok,what)=>{if(!ok)throw Error("PRUNED_RECIPIENT_RECONSTRUCTION_FAILED "+what)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function rpc(method,params=[]){
 let err;
 for(let i=0;i<3;i++){
  try{
   const r=await fetch("https://testnet-rpc.rayls.com/",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(26000)});
   if(!r.ok)throw Error(method+" HTTP "+r.status);
   const j=await r.json();
   if(j.error)throw Error(method+" "+JSON.stringify(j.error));
   return j.result;
  }catch(e){err=e;if(i<2)await sleep(450*(i+1))}
 }
 throw err;
}
assert(Number(BigInt(await rpc("eth_chainId")))===7295799,"chain");
const read=async(hash,blockNumber)=>{
 const [tx,receipt]=await Promise.all([
  rpc("eth_getTransactionByHash",[hash]),rpc("eth_getTransactionReceipt",[hash])]);
 assert(tx&&receipt&&receipt.status==="0x1"&&Number(BigInt(receipt.blockNumber))===blockNumber,
  "receipt status/height "+hash);
 const head=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
 assert(head&&same(head.hash,receipt.blockHash)&&same(tx.blockHash,receipt.blockHash)
  &&head.transactions.some(x=>same(x.hash,hash)),"block proof "+hash);
 const logs=await rpc("eth_getLogs",[{fromBlock:receipt.blockNumber,toBlock:receipt.blockNumber,
  address:[vault,registry,fw]}]);
 const sameTx=logs.filter(x=>same(x.transactionHash,hash));
 assert(sameTx.length===receipt.logs.length,"separate eth_getLogs "+hash);
 for(const l of receipt.logs)assert(sameTx.some(x=>x.logIndex===l.logIndex&&same(x.data,l.data)
  &&JSON.stringify(x.topics.map(String))===JSON.stringify(l.topics.map(String))),"log mismatch");
 return {tx,receipt,headerHash:head.hash};
};
const [claim,reg]=await Promise.all([read(claimTx,24747924),read(regTx,24748136)]);
assert(same(claim.tx.from,relayer)&&same(claim.tx.to,vault),"claim source");
const method=ABI.vault.parseTransaction({data:claim.tx.input});
assert(method?.name==="transferV2","private claim method");
const count={Nullifier:0,Commitment:0,EncryptedNote:0},commits=new Set(),notes=[];
for(const l of claim.receipt.logs){
 assert(same(l.address,vault),"claim log contract");
 const e=ABI.vault.parseLog(l);
 assert(e&&e.name in count,"claim unrecognized log");
 count[e.name]++;
 if(e.name==="Commitment")commits.add(String(e.args.commitment));
 if(e.name==="EncryptedNote")notes.push({commitment:String(e.args.commitment),i:(e.args.ciphertextI.length-2)/2,ii:(e.args.ciphertextII.length-2)/2});
}
assert(count.Nullifier===1&&count.Commitment===3&&count.EncryptedNote===3&&
  notes.every(n=>commits.has(n.commitment)&&n.i===1088&&n.ii===92),"claim note topology");
assert(same(reg.tx.from,relayer)&&same(reg.tx.to,fw),"reg source forwarder");
const events={};
for(const l of reg.receipt.logs){
 const abi=same(l.address,registry)?ABI.registry:same(l.address,fw)?ABI.fw:null;
 assert(abi,"reg log contract");const parsed=abi.parseLog(l);
 assert(parsed,"reg event undecoded");events[parsed.name]=parsed.args;
}
assert(Object.keys(events).length===3&&events.UserRegistered&&events.UsernameSet&&events.Relayed,"reg event count");
assert(same(events.UserRegistered.user,receiver)&&same(events.UsernameSet.user,receiver)
  &&events.UsernameSet.username==="devil","registered account");
assert(same(events.Relayed.from,receiver)&&same(events.Relayed.to,registry)
  &&events.Relayed.fee===0n,"public registration fee/source");
const headNumber=Number(BigInt(await rpc("eth_blockNumber")));
const stateBlock="0x"+headNumber.toString(16);
const tokenBalance=async(token)=>{
 const result=await rpc("eth_call",[{to:token,data:ABI.token.encodeFunctionData("balanceOf",[receiver])},stateBlock]);
 return ABI.token.decodeFunctionResult("balanceOf",result)[0];
};
const [rls,usdr,native,nonce,registered]=await Promise.all([
 tokenBalance(inv.contract_inventory.RLS.address),
 tokenBalance(inv.contract_inventory.USDr.address),
 rpc("eth_getBalance",[receiver,stateBlock]),
 rpc("eth_getTransactionCount",[receiver,stateBlock]),
 rpc("eth_call",[{to:registry,data:ABI.registry.encodeFunctionData("isRegistered",[receiver])},stateBlock])
]);
assert(rls===0n&&usdr===0n&&BigInt(native)===0n&&BigInt(nonce)===0n,"public account funds or nonce");
assert(ABI.registry.decodeFunctionResult("isRegistered",registered)[0]===true,"not registered latest");
const topic=zeroPadValue(receiver,32),trans=ABI.token.getEvent("Transfer").topicHash;
const scans=[];let transferCount=0;
for(let start=24747863;start<=headNumber;start+=480){
 const end=Math.min(start+479,headNumber);
 const tasks=[];
 for(const token of [inv.contract_inventory.RLS.address,inv.contract_inventory.USDr.address])
  for(const t of [[trans,topic],[trans,null,topic]]){
   tasks.push(rpc("eth_getLogs",[{address:token,fromBlock:"0x"+start.toString(16),
     toBlock:"0x"+end.toString(16),topics:t}]));
  }
 const responses=await Promise.all(tasks);
 transferCount+=responses.reduce((n,logs)=>n+logs.length,0);
 scans.push({start,end,matched:responses.reduce((n,logs)=>n+logs.length,0)});
}
assert(transferCount===0,"unexpected public token funding");
const eTxn=await fetch("https://testnet-explorer.rayls.com/api/v2/addresses/"+receiver+"/transactions").then(r=>r.json());
const eTransfers=await fetch("https://testnet-explorer.rayls.com/api/v2/addresses/"+receiver+"/token-transfers").then(r=>r.json());
assert((eTxn.items??[]).length===0&&(eTransfers.items??[]).length===0&&!eTxn.next_page_params&&!eTransfers.next_page_params,
 "explorer account public transaction history unexpectedly nonempty");
const summary={status:"PASS",
 evidence_class:"LIVE_PUBLIC_REGISTRATION_CLAIM_RECEIPTS_PLUS_CURRENT_ZERO_PUBLIC_FUNDS_AND_COMPLETE_EVENT_SCAN",
 completedUtc:new Date().toISOString(),correctReceiver:receiver,claimTx,claimBlock:24747924,
 registryTx:regTx,registryBlock:24748136,claimNoteTopology:count,
 currentHead:headNumber,currentPublicRlsWei:rls.toString(),currentPublicUsdrWei:usdr.toString(),
 currentNativeWei:String(BigInt(native)),currentAccountNonce:Number(BigInt(nonce)),
 currentRegistryRegistered:true,publicRlsUsdrTransfersSinceOriginalPreclaim:transferCount,
 scopedScanWindows:scans.length,independentPublicExplorerHistoryEmpty:true,
 historicalFixedBlockStateFreshlyQueried:false,
 historicalFixedBlockStateSource:"Original-time authenticated snapshots in receiver-private-claim-and-registration-verified.json; historical eth_call may now be pruned."};
fs.writeFileSync(root+"/qa/receiver-pruned-state-receipt-check.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({...summary,scopedScanWindows:scans.length},null,2));
