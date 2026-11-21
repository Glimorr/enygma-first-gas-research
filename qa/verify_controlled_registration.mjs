import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface, formatUnits}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const saved=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/dev-registration-corrected-live-attempt.json","utf8"));
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const txHash=saved.publicTransactionHash;
const account=saved.account;
const chainId=7295799;
const RPC="https://testnet-rpc.rayls.com/";
const receiptPath=root+"/evidence/public-rpc/controlled/dev-registration-verified-receipt.json";
if(!txHash||!/^0x[a-f0-9]{64}$/i.test(txHash))throw Error("No stored tx hash");
async function rpc(method,params=[]){
 const r=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3ReceiptVerifier/1.0"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
 if(!r.ok)throw Error(method+" HTTP "+r.status);
 const body=await r.json();
 if(body.error)throw Error(method+" "+JSON.stringify(body.error));
 return body.result;
}
const cid=Number(BigInt(await rpc("eth_chainId")));
if(cid!==chainId)throw Error("Wrong chain");
const receipt=await rpc("eth_getTransactionReceipt",[txHash]);
if(!receipt)throw Error("Receipt unavailable");
const tx=await rpc("eth_getTransactionByHash",[txHash]);
const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
if(!tx||!block)throw Error("Transaction/block unavailable");
if(block.hash.toLowerCase()!==receipt.blockHash.toLowerCase()||tx.blockHash.toLowerCase()!==block.hash.toLowerCase())throw Error("Block hash mismatch");
if(!block.transactions.some(t=>t.hash.toLowerCase()===txHash.toLowerCase()))throw Error("Not included in block");
const status=Number(BigInt(receipt.status));
if(status!==1)throw Error("Receipt reverted");
const expectedForwarder=inv.relayer_report.active_forwarder;
if(tx.to.toLowerCase()!==expectedForwarder.toLowerCase())throw Error("Not target active forwarder");
const iface=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8")));
const forwarderIface=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json","utf8")));
const transferIface=new Interface(["event Transfer(address indexed from,address indexed to,uint256 value)"]);
const regAddress=inv.contract_inventory.UserRegistry.address;
const rlsAddress=inv.contract_inventory.RLS.address;
const registrations=[],forwards=[],transfers=[],otherEvents=[];
for(const log of receipt.logs){
 const logAddress=log.address.toLowerCase();
 let p=null,kind=null;
 try{
  if(logAddress===regAddress.toLowerCase()){p=iface.parseLog(log);kind="registry"}
  else if(logAddress===expectedForwarder.toLowerCase()){p=forwarderIface.parseLog(log);kind="forwarder"}
  else if(logAddress===rlsAddress.toLowerCase()){p=transferIface.parseLog(log);kind="rls"}
 }catch{}
 if(!p)continue;
 if(kind==="registry"&&p.name==="UserRegistered"){
  registrations.push({user:p.args.user,pkSpend:p.args.pkSpend.toString(),pkViewBytes:(p.args.pkView.length-2)/2,
   escrowToAuditorBytes:(p.args.mlKemAuditCt.length-2)/2,
   auditCiphertextBytes:(p.args.aesAuditCt.length-2)/2,
   logIndex:Number(BigInt(log.logIndex))});
 }else if(kind==="forwarder"&&p.name==="Relayed"){
  forwards.push({from:p.args.from,to:p.args.to,nonce:p.args.nonce.toString(),
   relayer:p.args.relayer,feeWei:p.args.fee.toString(),
   feeRls:formatUnits(p.args.fee,18),logIndex:Number(BigInt(log.logIndex))});
 }else if(kind==="rls"&&p.name==="Transfer"){
  transfers.push({from:p.args.from,to:p.args.to,amountWei:p.args.value.toString(),
   amountRls:formatUnits(p.args.value,18),logIndex:Number(BigInt(log.logIndex))});
 }else{
  otherEvents.push({name:p.name,address:log.address,logIndex:Number(BigInt(log.logIndex))});
 }
}
if(registrations.length!==1||registrations[0].user.toLowerCase()!==account.toLowerCase())
 throw Error("Expected exactly one account-registration event");
if(forwards.length!==1||forwards[0].from.toLowerCase()!==account.toLowerCase())
 throw Error("Expected exactly one matched forwarder event");
const eventFee=BigInt(forwards[0].feeWei);
const matchingTransfers=transfers.filter(t=>t.from.toLowerCase()===account.toLowerCase()
 &&t.to.toLowerCase()===forwards[0].relayer.toLowerCase());
const paidWei=matchingTransfers.reduce((sum,v)=>sum+BigInt(v.amountWei),0n);
if(eventFee!==paidWei)throw Error("Onchain fee transfer mismatched: event vs logs");
const nonceBefore=await rpc("eth_getTransactionCount",[account,"0x"+(Number(BigInt(receipt.blockNumber))-1).toString(16)]).catch(e=>({error:String(e)}));
const data={
 evidenceClass:"CONTROLLED_REGISTRATION_LIVE_RPC_RECONSTRUCTED",
 capturedAtUtc:new Date().toISOString(),chainId:cid,
 savedUiAttemptFile:"evidence/public-rpc/controlled/dev-registration-corrected-live-attempt.json",
 account,username:saved.username,txHash,
 blockNumber:Number(BigInt(receipt.blockNumber)),blockHash:receipt.blockHash,
 blockTimestampUtc:new Date(Number(BigInt(block.timestamp))*1000).toISOString(),
 receiptStatus:status,receiptGasUsed:BigInt(receipt.gasUsed).toString(),
 transactionFrom:tx.from,transactionTo:tx.to,transactionIncludedInBlock:true,
 publicRegistryEvents:registrations,relayedEvents:forwards,publicRlsTransferEvents:transfers,
 otherDecodedEvents:otherEvents,exactFeeMatch:eventFee===paidWei,
 recordedRequestedFeeWei:saved.signedFeeWei,
 requestedFeeMatchesMinedEvent:saved.signedFeeWei===eventFee.toString(),
 oldNonceCheck:nonceBefore,
 rawTransaction:tx,rawReceipt:receipt,
 caveats:["Success of a public UserRegistered event does not prove a private payment or invitation claim.",
   "The account-key derivation signature is confidential and is intentionally not preserved.",
   "Public token transfers confirm fee payment in RLS, but private shielded balances require wallet-side verification."
 ]
};
fs.writeFileSync(receiptPath,JSON.stringify(data,null,2)+"\n");
console.log(JSON.stringify({status:"PASS",txHash,account,blockNumber:data.blockNumber,
 receiptStatus:status,registrations:registrations.length,relayedEvents:forwards.length,
 actualFeeRls:formatUnits(eventFee,18),matchedTransferRls:formatUnits(paidWei,18),
 requestedFeeMatchesMinedEvent:data.requestedFeeMatchesMinedEvent,
 otherEvents:otherEvents,save:receiptPath},null,2));
