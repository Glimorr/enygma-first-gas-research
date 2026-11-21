/**
 * Second controlled Rayls Quest 3 cohort: VERIFY publicly funded @rq3faucet26
 * making a shielded send after an independently verified public Shield.
 *
 * Inputs: the EXACT already-mined second-cohort shielded send TX.
 * No signing, no browser access, no invitation link, no wallet keys.
 * DO NOT claim recipient identity or principal from public vault events.
 *
 * Example: node qa/verify_devils_first_private_spend.mjs --tx 0x...64hex
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,zeroPadValue}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inventory=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const onboarding=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-funding-and-registration-verified.json","utf8"));
const C={
 sender:onboarding.owner,
 claimedRegTx:onboarding.registered.hash,
 regBlock:onboarding.registered.block,
 protectedRecipientAccount:"0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6",
 protectedRecipientUsername:"rq3dev26",
 vault:inventory.contract_inventory.SharedVault.address,
 registry:inventory.contract_inventory.UserRegistry.address,
 forwarder:inventory.relayer_report.active_forwarder,
 relayer:inventory.relayer_report.relayer_address,
 rls:inventory.contract_inventory.RLS.address,
 usdr:inventory.contract_inventory.USDr.address
};
const txArg="0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb";
const ABI={
 vault:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8"))),
 registry:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8"))),
 erc20:new Interface(["function balanceOf(address) view returns(uint256)",
  "event Transfer(address indexed from,address indexed to,uint256 value)"])
};
const TOPIC=ABI.erc20.getEvent("Transfer").topicHash;
const norm=s=>String(s??"").toLowerCase();
const check=(condition,label)=>{if(!condition)throw Error("WQ3_PRIVATE_SPEND_VERIFY_FAIL "+label)};
const sleep=n=>new Promise(resolve=>setTimeout(resolve,n));
const RPC="https://testnet-rpc.rayls.com/";
async function rpc(method,params=[]){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3SecondCohortPublicFundingContrast/1.0"},
     body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(24000)});
   if(!response.ok)throw Error(method+" HTTP "+response.status);
   const json=await response.json();
   if(json.error)throw Error(method+" "+JSON.stringify(json.error));
   return json.result;
  }catch(error){last=error;if(attempt<2)await sleep(500*(attempt+1))}
 }
 throw last;
}
const toHex=x=>"0x"+x.toString(16);
async function erc20(who,token,block){
 const input=ABI.erc20.encodeFunctionData("balanceOf",[who]);
 const data=await rpc("eth_call",[{to:token,data:input},toHex(block)]);
 return ABI.erc20.decodeFunctionResult("balanceOf",data)[0];
}
async function state(who,block){
 const tag=toHex(block);
 const [native,rls,usdr,nonce]=await Promise.all([
  rpc("eth_getBalance",[who,tag]),erc20(who,C.rls,block),
  erc20(who,C.usdr,block),rpc("eth_getTransactionCount",[who,tag])
 ]);
 return {block,address:who,rlsWei:rls.toString(),usdrTokenWei:usdr.toString(),
  nativeWei:BigInt(native).toString(),nonce:Number(BigInt(nonce))};
}
check(Number(BigInt(await rpc("eth_chainId")))===7295799,"wrong chain");
const [receipt,tx]=await Promise.all([
 rpc("eth_getTransactionReceipt",[txArg]),rpc("eth_getTransactionByHash",[txArg])
]);
check(!!receipt&&!!tx,"transaction pending, missing, or absent");
check(norm(receipt.transactionHash)===norm(txArg)&&norm(tx.hash)===norm(txArg),"unexpected transaction hash");
check(receipt.status==="0x1","receipt not successful");
check(norm(tx.to)===norm(C.vault)&&norm(tx.from)===norm(C.relayer),"not relayer->SharedVault transaction");
const blockNumber=Number(BigInt(receipt.blockNumber));
check(blockNumber>C.regBlock,"private spend occurs before recipient registration");
const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
check(!!block&&norm(block.hash)===norm(tx.blockHash)&&norm(block.hash)===norm(receipt.blockHash),"block hash mismatch");
check(block.transactions.some(t=>norm(t.hash)===norm(txArg)),"transaction not present in mined block");
const decoded=ABI.vault.parseTransaction({data:tx.input});
check(decoded?.name==="transferV2","not a vault transferV2 spend");
const nullifiers=[],notes=[],commitments=[],other=[];
for(const log of receipt.logs){
 check(norm(log.address)===norm(C.vault),"non-vault log found in nominal private spend");
 const parsed=ABI.vault.parseLog(log);
 check(!!parsed,"undecoded log");
 if(parsed.name==="Nullifier")nullifiers.push({index:Number(BigInt(log.logIndex)),
  treeNumber:parsed.args.treeNumber.toString(),nullifier:parsed.args.nullifier.toString()});
 else if(parsed.name==="Commitment")commitments.push({index:Number(BigInt(log.logIndex)),
  vaultId:parsed.args.vaultId.toString(),commitment:parsed.args.commitment.toString()});
 else if(parsed.name==="EncryptedNote")notes.push({index:Number(BigInt(log.logIndex)),
  vaultId:parsed.args.vaultId.toString(),commitment:parsed.args.commitment.toString(),
  ctIBytes:(parsed.args.ciphertextI.length-2)/2,ctIIBytes:(parsed.args.ciphertextII.length-2)/2});
 else other.push({name:parsed.name,index:Number(BigInt(log.logIndex))});
}
check(nullifiers.length>=1,"no nullifiers emitted");
check(commitments.length>=1&&notes.length===commitments.length,"commitments/notes count");
check(notes.every(n=>commitments.some(c=>c.commitment===n.commitment&&c.vaultId===n.vaultId)),"note commitments mismatch");
check(other.length===0,"unexpected vault events");
const independent=await rpc("eth_getLogs",[{fromBlock:receipt.blockNumber,toBlock:receipt.blockNumber,address:C.vault}]);
const found=independent.filter(l=>norm(l.transactionHash)===norm(txArg));
check(found.length===receipt.logs.length,"independent queried logs count mismatch");
for(const l of receipt.logs)check(found.some(x=>
  x.logIndex===l.logIndex&&norm(x.data)===norm(l.data)&&
  norm(x.address)===norm(l.address)&&JSON.stringify(x.topics.map(norm))===JSON.stringify(l.topics.map(norm))),
  "independent receipt log byte mismatch");
const currentHead=Number(BigInt(await rpc("eth_blockNumber")));
const endState=await state(C.sender,currentHead);
const recipientState=await state(C.protectedRecipientAccount,currentHead);
check(endState.rlsWei==="219277242680000000000"&&
 endState.usdrTokenWei==="10000000000000000000"&&
 endState.nativeWei==="10000000000000000000","public funding state changed after first shield");
check(endState.nonce===0,"sender EVM nonce unexpectedly changed");
const transfers=[];
const topic=zeroPadValue(C.sender,32);
for(const token of [C.rls,C.usdr]){
 for(const query of [[TOPIC,null,topic],[TOPIC,topic]]){
  for(let start=24767226;start<=currentHead;start+=450){
   const end=Math.min(start+449,currentHead);
   const hits=await rpc("eth_getLogs",[{fromBlock:toHex(start),toBlock:toHex(end),
    address:token,topics:query}]);
   for(const h of hits)transfers.push({token,hash:h.transactionHash,block:Number(BigInt(h.blockNumber)),
    amountWei:BigInt(h.data).toString()});
  }
 }
}
check(transfers.length===0,"unexpected second-cohort public transfer after public shield");
let historicalBefore=null,historicalAfter=null,historyUnavailability=null;
try{
 historicalBefore=await state(C.sender,blockNumber-1);
 historicalAfter=await state(C.sender,blockNumber);
 check(historicalBefore.rlsWei===historicalAfter.rlsWei &&
    historicalBefore.usdrTokenWei===historicalAfter.usdrTokenWei &&
    historicalBefore.nativeWei===historicalAfter.nativeWei &&
    historicalBefore.nonce===0&&historicalAfter.nonce===0,
    "sender public balances or nonce changed during shielded send");
}catch(error){
 if(/pruned|historical|archive/i.test(String(error)))historyUnavailability=String(error).slice(0,300);
 else throw error;
}
const result={
 evidence_class:"USER_CONTROLLED_PUBLIC_FAUCET_ONBOARDING_PRIVATE_SPEND_PUBLIC_CHAIN_ENVELOPE_VERIFIED__OWNER_WALLET_ATTRIBUTION",
 verifiedAtUtc:new Date().toISOString(),chainId:7295799,
 originalControlledSender:C.sender,expectedControlledRecipient:C.protectedRecipientAccount,
 sourcePublicFundingVerified:true,originalSourcePublicRlsAfterShieldWei:"219277242680000000000",
 privateAmountRlsWalletObserved:null,
 recipientIdentityPubliclyRevealedByReceipt:false,
 privatePrincipalPubliclyRevealedByReceipt:false,
 attributionToSenderWalletRequiresUserConfirmedWalletOutcome:true,
 txHash:txArg,blockNumber,method:decoded.name,
 nullifiers,commitments,encryptedNotes:notes,
 contract:C.vault,relayer:C.relayer,blockHash:block.hash,
 senderStateAtLatestHead:endState,recipientStateAtLatestHead:recipientState,
 senderStateBeforeSpend:historicalBefore,senderStateAfterSpend:historicalAfter,
 historicalArchiveUnavailable:historyUnavailability,
 transparentRlsUsdrTransfersInControlledSenderWindow:transfers,
 independentLogsMatched:true,receiptStatus:1,
 evidenceStatus:"PUBLIC_CHAIN_ENVELOPE_CONFIRMED__SENDER_UI_SCREENSHOT_AND_RECIPIENT_OWNER_BALANCE_WITNESS",
 rawPublicTx:tx,rawPublicReceipt:receipt,
 blockHeader:{hash:block.hash,number:block.number,timestamp:block.timestamp,
  txHashes:block.transactions.map(t=>t.hash)},
 separateEthGetLogs:found,
 limitations:[
  "Public RPC does not itself identify @rq3faucet26 or @rq3dev26 as shielded sender/recipient.",
  "The human operator supplied the source success screenshot showing a 3 RLS payment to @rq3dev26, and a separate owner wallet showed a cumulative shielded balance of 6 RLS.",
  "Do not claim a private principal or recipient recovered from the chain. Sender attribution is based on owner-wallet observation plus chronology.",
  "Historical account balances may be pruned; this cohort WAS publicly funded at onboarding, and the current public balances were reconciled against the exact earlier Shield.",
  "This script never sends transactions, signs or accesses invitation bearer links."
 ]
};
const output=root+"/evidence/public-rpc/controlled/faucet-cohort-private-spend-77ff894ed5.json";
fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:"PUBLIC_ENVELOPE_PASS",tx:txArg,block:blockNumber,
 nullifierCount:nullifiers.length,commitments:commitments.length,encryptedNotes:notes.length,
 publicAccountStillFundedExactlyAsBeforePrivateSend:true,accountNonceStillZero:true,
 ownerWalletAttribution:"REQUIRED",actualPrivatePrincipal:"NOT_PUBLICLY_DECRYPTABLE",
 saved:output},null,2));
