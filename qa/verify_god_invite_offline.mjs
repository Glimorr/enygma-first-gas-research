/**
 * Offline consistency check for invitation's public transaction envelope.
 * This checks frozen public RPC material for internal consistency; live authentication
 * requires running qa/verify_god_invite.mjs.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const addr=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8")).contract_inventory.SharedVault.address;
const ABI=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const norm=x=>String(x??"").toLowerCase();
export function validate(saved){
 const errors=[],check=(condition,label)=>{if(!condition)errors.push(label)};
 try{
 const {receipt,tx,block,independently_retrieved_logs:second}=saved.raw_public_rpc;
 check(saved.chain_id===7295799,"chainId");
 check(saved.evidence_class==="USER_CONTROLLED_SHIELDED_INVITE_ENVELOPE_PUBLIC_RPC_VERIFIED","provenance");
 check(norm(receipt.transactionHash)===norm(saved.hash)&&norm(tx.hash)===norm(saved.hash),"hash");
 check(norm(receipt.blockHash)===norm(tx.blockHash)&&norm(tx.blockHash)===norm(block.hash),"blockHash");
 check(block.transaction_hashes.some(h=>norm(h)===norm(saved.hash)),"blockInclusion");
 check(Number(BigInt(receipt.blockNumber))===saved.block_height&&
       Number(BigInt(block.number))===saved.block_height,"blockHeight");
 check(Number(BigInt(receipt.status))===1&&saved.status===1,"status");
 check(norm(tx.to)===norm(addr)&&norm(receipt.to)===norm(addr),"vaultTarget");
 const parsed=ABI.parseTransaction({data:tx.input});
 check(parsed?.name==="transferV2"&&saved.method==="transferV2","method");
 check(Number(parsed?.args[0]?.numberOfInputs)===1&&saved.proof_inputs===1,"inputCount");
 check(Number(parsed?.args[0]?.numberOfOutputs)===3&&saved.proof_outputs===3,"outputCount");
 check(parsed?.args[1]?.length===3&&parsed?.args[2]?.length===3,"encryptedOutputArrays");
 const nulls=[],commits=[],notes=[];
 for(const log of receipt.logs){
  check(norm(log.address)===norm(addr),"eventContract");
  check(norm(log.transactionHash)===norm(saved.hash),"eventTxHash");
  const ev=ABI.parseLog(log);
  check(Boolean(ev),"eventDecode");
  if(!ev)continue;
  if(ev.name==="Nullifier")nulls.push({value:ev.args.nullifier.toString(),vaultId:ev.args.vaultId.toString()});
  else if(ev.name==="Commitment")commits.push({value:ev.args.commitment.toString(),vaultId:ev.args.vaultId.toString()});
  else if(ev.name==="EncryptedNote")notes.push({value:ev.args.commitment.toString(),
    vaultId:ev.args.vaultId.toString(),I:(ev.args.ciphertextI.length-2)/2,II:(ev.args.ciphertextII.length-2)/2});
  else check(false,"unexpectedEvent");
 }
 check(receipt.logs.length===7&&nulls.length===1&&commits.length===3&&notes.length===3,"eventTopology");
 check(saved.nullifiers?.length===1&&saved.commitments?.length===3&&saved.encrypted_notes?.length===3,"derivedCounts");
 if(nulls.length===1){
  check(saved.nullifiers[0].nullifier===nulls[0].value,"derivedNullifier");
 }
 for(const c of commits)check(saved.commitments.some(s=>s.commitment===c.value&&s.vaultId===c.vaultId),"derivedCommitments");
 for(const n of notes){
  check(commits.some(c=>c.value===n.value&&c.vaultId===n.vaultId),"commitmentCorrespondence");
  check(n.I===1088&&n.II===92,"ciphertextLength");
  check(saved.encrypted_notes.some(s=>s.commitment===n.value&&s.ciphertextIBytes===n.I&&s.ciphertextIIBytes===n.II),"derivedEncryptedNotes");
 }
 check(second.length===7,"independentEventCount");
 for(const log of receipt.logs){
  check(second.some(e=>e.logIndex===log.logIndex&&norm(e.address)===norm(log.address)&&
    norm(e.data)===norm(log.data)&&
    JSON.stringify(e.topics.map(norm))===JSON.stringify(log.topics.map(norm))),
   "independentEventBytes");
 }
 const b=saved.balances;
 check(BigInt(b.owner_erc20_rls_before_wei)===BigInt(b.owner_erc20_rls_after_wei),"ownerPublicBalance");
 check(BigInt(b.candidate_receiver_erc20_rls_before_wei)===0n&&
       BigInt(b.candidate_receiver_erc20_rls_after_wei)===0n,"receiverZeroPublicRls");
 check(b.owner_nonce_before===b.owner_nonce_after,"ownerNonce");
 check(b.receiver_nonce_before===b.receiver_nonce_after,"receiverNonce");
 check(BigInt(b.owner_native_before_wei)===BigInt(b.owner_native_after_wei),"ownerNativeBalance");
 check(saved.actual_rich_payment_amount_wei_publicly_visible===false,"privacyClaim");
 }catch(e){errors.push("exception."+String(e).slice(0,250));}
 return errors;
}
if(process.argv[1]?.endsWith("/verify_god_invite_offline.mjs")){
 const data=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json","utf8"));
 const errors=validate(data);
 const result={status:errors.length?"FAIL":"PASS",checkedAtUtc:new Date().toISOString(),
  evidence_class:"FROZEN_INVITE_PUBLIC_RECEIPT_CONSISTENCY_NOT_INDEPENDENT_LIVE_AUTHENTICATION",
  errors,invitationLinkUsed:false};
 fs.writeFileSync(root+"/qa/invite-offline-result.json",JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));
 if(errors.length)process.exitCode=1;
}
