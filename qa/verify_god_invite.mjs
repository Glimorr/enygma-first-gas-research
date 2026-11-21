/**
 * User-controlled Rayls Enygma Public invitation:
 * Independently authenticate its onchain envelope only.
 * Bearer invitation link/claim secret deliberately NOT used.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,formatUnits}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const shield=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/god-shield-40-verified.json","utf8"));
const prevReceiver=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/hub-pre-invite-zero-baseline.json","utf8"));
const RPC="https://testnet-rpc.rayls.com/";
const hash="0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab";
const addr=inv.contract_inventory.SharedVault.address;
const ABI=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const tokenABI=new Interface(["function balanceOf(address who) view returns(uint256)"]);
const transferTopic=tokenABI.getFunction("balanceOf").selector;
const owner=shield.controlled_account;
const hub=prevReceiver.address;
const RLS=inv.contract_inventory.RLS.address;
const expectedMethod="transferV2";
const norm=x=>String(x??"").toLowerCase();
const ensure=(cond,msg)=>{if(!cond)throw Error("INVITATION_CHAIN_VERIFICATION_FAILED "+msg)};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function rpc(method,params=[]){
 let error;
 for(let i=0;i<3;i++){
  try{
   const r=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3PublicInviteVerification/1.0"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(24000)});
   if(!r.ok)throw Error(method+" HTTP "+r.status);
   const j=await r.json();
   if(j.error)throw Error(method+" "+JSON.stringify(j.error));
   return j.result;
  }catch(e){error=e;if(i<2)await pause(500*(i+1))}
 }
 throw error;
}
async function balance(address,tag){
 const data=tokenABI.encodeFunctionData("balanceOf",[address]);
 return tokenABI.decodeFunctionResult("balanceOf",await rpc("eth_call",[{to:RLS,data},tag]))[0];
}
const chainId=Number(BigInt(await rpc("eth_chainId")));
ensure(chainId===7295799,"chain id");
const receipt=await rpc("eth_getTransactionReceipt",[hash]);
const tx=await rpc("eth_getTransactionByHash",[hash]);
ensure(tx&&receipt,"missing tx or receipt");
ensure(Number(BigInt(receipt.status))===1,"reverted receipt");
ensure(norm(tx.to)===norm(addr),"wrong vault");
ensure(norm(receipt.to)===norm(addr),"receipt wrong vault");
const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
ensure(block&&norm(block.hash)===norm(receipt.blockHash)&&norm(tx.blockHash)===norm(block.hash),"block hashes");
ensure(block.transactions.some(t=>norm(t.hash)===norm(hash)),"block inclusion");
const decoded=ABI.parseTransaction({data:tx.input});
ensure(decoded?.name===expectedMethod,"unexpected method");
const proofTuple=decoded.args[0];
const inputCount=Number(proofTuple.numberOfInputs);
const outputCount=Number(proofTuple.numberOfOutputs);
ensure(inputCount===1&&outputCount===3,"expected one input, three outputs");
ensure(decoded.args[1].length===3&&decoded.args[2].length===3,"ciphertext array count");
const nullifiers=[],commitments=[],encryptedNotes=[],other=[];
for(const log of receipt.logs){
 ensure(norm(log.address)===norm(addr),"non-vault log unexpectedly present");
 ensure(norm(log.transactionHash)===norm(hash),"log transaction hash mismatch");
 const event=ABI.parseLog(log);
 ensure(Boolean(event),"undecoded event");
 const index=Number(BigInt(log.logIndex));
 if(event.name==="Nullifier"){
  nullifiers.push({logIndex:index,vaultId:event.args.vaultId.toString(),treeNumber:event.args.treeNumber.toString(),
    nullifier:event.args.nullifier.toString()});
 }else if(event.name==="Commitment"){
  commitments.push({logIndex:index,vaultId:event.args.vaultId.toString(),commitment:event.args.commitment.toString()});
 }else if(event.name==="EncryptedNote"){
  encryptedNotes.push({logIndex:index,vaultId:event.args.vaultId.toString(),commitment:event.args.commitment.toString(),
   ciphertextIBytes:(event.args.ciphertextI.length-2)/2,
   ciphertextIIBytes:(event.args.ciphertextII.length-2)/2});
 }else{
  other.push({event:event.name,logIndex:index});
 }
}
ensure(receipt.logs.length===7,"unexpected log count");
ensure(nullifiers.length===1&&commitments.length===3&&encryptedNotes.length===3,"unexpected note topology");
ensure(other.length===0,"unexpected vault event");
const set=new Set(commitments.map(c=>c.commitment));
ensure(set.size===3,"nonunique commitments");
ensure(encryptedNotes.every(e=>set.has(e.commitment)),"missing matching commitment for encrypted note");
ensure(encryptedNotes.every(e=>e.ciphertextIBytes===1088&&e.ciphertextIIBytes===92),"ciphertext lengths");
ensure(inputCount===nullifiers.length&&outputCount===commitments.length,"calldata vs emitted event count");
const blockTagBefore="0x"+(Number(BigInt(receipt.blockNumber))-1).toString(16);
const blockTagAfter=receipt.blockNumber;
const [ownerBefore,ownerAfter,hubBefore,hubAfter,ownerNonceBefore,ownerNonceAfter,
       hubNonceBefore,hubNonceAfter,ownerNativeBefore,ownerNativeAfter]=await Promise.all([
  balance(owner,blockTagBefore),balance(owner,blockTagAfter),
  balance(hub,blockTagBefore),balance(hub,blockTagAfter),
  rpc("eth_getTransactionCount",[owner,blockTagBefore]),rpc("eth_getTransactionCount",[owner,blockTagAfter]),
  rpc("eth_getTransactionCount",[hub,blockTagBefore]),rpc("eth_getTransactionCount",[hub,blockTagAfter]),
  rpc("eth_getBalance",[owner,blockTagBefore]),rpc("eth_getBalance",[owner,blockTagAfter])
]);
ensure(ownerBefore===ownerAfter,"owner public RLS changed during private payment");
ensure(hubBefore===hubAfter,"receiver candidate public RLS changed");
ensure(BigInt(ownerNonceBefore)===BigInt(ownerNonceAfter),"owner tx nonce changed");
ensure(BigInt(hubNonceBefore)===BigInt(hubNonceAfter),"hub tx nonce changed");
ensure(BigInt(ownerNativeBefore)===BigInt(ownerNativeAfter),"owner native balance changed");
const otherLogs=await rpc("eth_getLogs",[{"fromBlock":receipt.blockNumber,"toBlock":receipt.blockNumber,"address":addr}]);
const matchingOther=otherLogs.filter(x=>norm(x.transactionHash)===norm(hash));
ensure(matchingOther.length===receipt.logs.length,"separate RPC log query count");
for(const event of receipt.logs){
 ensure(matchingOther.some(x=>norm(x.transactionHash)===norm(event.transactionHash)&&x.logIndex===event.logIndex&&
  norm(x.data)===norm(event.data)&&norm(x.address)===norm(event.address)&&
  JSON.stringify(x.topics.map(norm))===JSON.stringify(event.topics.map(norm))),"independent log mismatch");
}
const result={
 evidence_class:"USER_CONTROLLED_SHIELDED_INVITE_ENVELOPE_PUBLIC_RPC_VERIFIED",
 verified_at_utc:new Date().toISOString(),
 chain_id:chainId,contract:addr,hash,block_height:Number(BigInt(receipt.blockNumber)),
 block_hash:receipt.blockHash,block_timestamp_utc:new Date(Number(BigInt(block.timestamp))*1000).toISOString(),
 status:Number(BigInt(receipt.status)),gas_used:Number(BigInt(receipt.gasUsed)),
 public_chain_sender:tx.from,public_chain_to:tx.to,method_selector:tx.input.slice(0,10),method:expectedMethod,
 proof_inputs:inputCount,proof_outputs:outputCount,
 actual_rich_payment_amount_wei_publicly_visible:false,
 received_30_rls_confirmed_by_official_wallet_ui_only:true,
 fee_4_42_rls_confirmed_by_official_wallet_ui_only:true,
 nullifiers,commitments,encrypted_notes:encryptedNotes,unexpected_events:other,
 balances:{
  owner_erc20_rls_before_wei:ownerBefore.toString(),owner_erc20_rls_after_wei:ownerAfter.toString(),
  candidate_receiver_erc20_rls_before_wei:hubBefore.toString(),candidate_receiver_erc20_rls_after_wei:hubAfter.toString(),
  owner_nonce_before:Number(BigInt(ownerNonceBefore)),owner_nonce_after:Number(BigInt(ownerNonceAfter)),
  receiver_nonce_before:Number(BigInt(hubNonceBefore)),receiver_nonce_after:Number(BigInt(hubNonceAfter)),
  owner_native_before_wei:BigInt(ownerNativeBefore).toString(),owner_native_after_wei:BigInt(ownerNativeAfter).toString()
 },
 confirmations:{
  receipt_matches_block:true,tx_in_block:true,decoded_vault_method:true,
  ciphertext_and_commitment_pairs:true,eth_getLogs_matches_receipt:true,
  no_public_rls_balance_change_for_owner:true,no_public_rls_balance_change_for_candidate_receiver:true,
  no_nonce_change_for_owner:true,no_nonce_change_for_candidate_receiver:true
 },
 raw_public_rpc:{
   receipt,tx,
   block:{number:block.number,hash:block.hash,parentHash:block.parentHash,timestamp:block.timestamp,
    transaction_hashes:block.transactions.map(v=>v.hash)},
   independently_retrieved_logs:matchingOther
 },
 caveats:[
  "30 RLS private invite principal is visible in owner wallet UI only and cannot be derived from this public contract receipt.",
  "4.42 RLS shielded fee is a UI value, not publicly deposited RLS fee Transfer in the receipt.",
  "No new public registry event or public funding is necessary to create an invitation.",
  "The claim link is a transferable bearer secret; it was exposed to this chat and must not be reproduced or assumed secret.",
  "This proves the encrypted-note invitation envelope was mined, not that it remains unclaimed or that any receiver controlled it.",
  "No linkage between private invite output commitments and a claimed recipient is established without corresponding owner/receiver wallet evidence.",
  "The candidate Hub research account is not proven to be the ultimate claim address; it only remains a clean comparison candidate."
 ]
};
const out=root+"/evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json";
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:"PASS",hash,block:result.block_height,method:expectedMethod,
 inputCount,outputCount,commitments:commitments.length,encryptedNotes:encryptedNotes.length,
 ownerPublicRLSBefore:formatUnits(ownerBefore,18),ownerPublicRLSAfter:formatUnits(ownerAfter,18),
 candidateHubPublicRLSBefore:formatUnits(hubBefore,18),candidateHubPublicRLSAfter:formatUnits(hubAfter,18),
 ownerNonceBefore:result.balances.owner_nonce_before,ownerNonceAfter:result.balances.owner_nonce_after,
 saved:out},null,2));
