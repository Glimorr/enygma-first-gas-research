/**
 * Rayls Quest 3: independently reconstruct a user-controlled 40 RLS Enygma Public shield.
 * READ-ONLY. No credentials, no signing and no writes to the network.
 * This is a public-chain check; owner-wallet shielded note state is NOT derived from these logs.
 *
 * Run: node qa/verify_god_shield.mjs [--live-only]
 * Provenance: live JSON-RPC; corroborating Blockscout indexer; public deploy ABIs pinned in research/.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface, formatUnits}=require("ethers");

const ROOT=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const INVENTORY=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/contract-inventory.json","utf8"));
const BASE=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/burner-baseline.json","utf8"));
const RPC="https://testnet-rpc.rayls.com/";
const EXPLORER="https://testnet-explorer.rayls.com/api/v2";
const TX_HASH="0x98bcb6f47b12400cb89284c215cc52373d38f8af30f855b9a0394c2923fa653a";
const ACCOUNT="0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2";
const TOKEN=INVENTORY.contract_inventory.RLS.address;
const VAULT=INVENTORY.contract_inventory.SharedVault.address;
const FORWARDER=INVENTORY.relayer_report.active_forwarder;
const TOKEN_I=new Interface([
 "event Transfer(address indexed from,address indexed to,uint256 value)",
 "event Approval(address indexed owner,address indexed spender,uint256 value)",
 "function balanceOf(address owner) view returns (uint256)"
]);
const VAULT_I=new Interface(JSON.parse(fs.readFileSync(ROOT+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const FORWARD_I=new Interface(JSON.parse(fs.readFileSync(ROOT+"/research/verified-abis/next.json","utf8")));
const norm=a=>a?.toLowerCase();
const fail=(message)=>{throw Error("VALIDATION_FAILURE: "+message)};
const assert=(ok,message)=>{if(!ok)fail(message)};
const sha256=v=>crypto.createHash("sha256").update(v).digest("hex");
const asNumber=h=>Number(BigInt(h));

async function rpc(method,params=[]){
 let res=null, lastError;
 for(let attempt=0;attempt<3;attempt++){
   try {
     res=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3ShieldResearch/1.0"},
       body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(20000)});
     break;
   }catch(error){
     lastError=error;
     if(attempt<2)await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
   }
 }
 if(!res)throw Error(method+" network unavailable after 3 attempts: "+String(lastError));
 if(!res.ok)throw Error(method+" HTTP "+res.status);
 const obj=await res.json();
 if(obj.error)throw Error(method+" error "+JSON.stringify(obj.error));
 assert("result" in obj,method+" no result");
 return obj.result;
}
async function explorer(url){
 try {
  const res=await fetch(url,{headers:{"User-Agent":"RaylsQuest3ShieldResearch/1.0"}});
  if(!res.ok)throw Error("HTTP "+res.status);
  return {available:true,data:await res.json()};
 }catch(error){return {available:false,error:String(error).slice(0,250)}}
}
async function balance(account,tag){
 const data=TOKEN_I.encodeFunctionData("balanceOf",[account]);
 const result=await rpc("eth_call",[{to:TOKEN,data},tag]);
 return TOKEN_I.decodeFunctionResult("balanceOf",result)[0];
}
async function codeHash(addr){
 const bytecode=await rpc("eth_getCode",[addr,"latest"]);
 assert(bytecode?.startsWith("0x")&&bytecode!=="0x","contract has no bytecode: "+addr);
 return {contract:addr,byteLength:(bytecode.length-2)/2,sha256:sha256(Buffer.from(bytecode.slice(2),"hex"))};
}
const smallRecord=(ev,log)=>({name:ev.name,contract:log.address,logIndex:asNumber(log.logIndex)});

const cid=asNumber(await rpc("eth_chainId"));
assert(cid===7295799,"unexpected chain ID");
assert(norm(BASE.account)===norm(ACCOUNT),"wrong baseline account");
assert(BASE.chainId===cid,"baseline chain differs");
assert(INVENTORY.chain_id===cid,"inventory chain differs");
const receipt=await rpc("eth_getTransactionReceipt",[TX_HASH]);
const tx=await rpc("eth_getTransactionByHash",[TX_HASH]);
assert(receipt&&tx,"transaction or receipt unavailable");
const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
assert(block,"block unavailable");
assert(norm(receipt.blockHash)===norm(block.hash),"receipt block hash mismatched");
assert(norm(tx.blockHash)===norm(block.hash),"transaction block hash mismatched");
assert(block.transactions.some(x=>norm(x.hash)===norm(TX_HASH)),"tx not included in block");
assert(asNumber(receipt.status)===1,"transaction failed");
assert(norm(receipt.to)===norm(FORWARDER)&&norm(tx.to)===norm(FORWARDER),"unexpected forwarder");
assert(norm(tx.from)===norm(INVENTORY.relayer_report.relayer_address),"not the reported relayer");
const height=asNumber(receipt.blockNumber);
assert(height>BASE.block.number,"transaction not after baseline");
const beforeTag="0x"+(height-1).toString(16);
const afterTag=receipt.blockNumber;
const rlsBefore=await balance(ACCOUNT,beforeTag);
const rlsAfter=await balance(ACCOUNT,afterTag);
const nativeBefore=await rpc("eth_getBalance",[ACCOUNT,beforeTag]);
const nativeAfter=await rpc("eth_getBalance",[ACCOUNT,afterTag]);
const tokenCode=await codeHash(TOKEN);
const vaultCode=await codeHash(VAULT);
const forwarderCode=await codeHash(FORWARDER);
assert(rlsBefore.toString()===BASE.tokenBalances.RLS.amountWei,"pre-tx RLS balance drift relative to baseline");
const approvals=[],transfers=[],commitments=[],encryptedNotes=[],relayed=[],otherLogs=[];
for(const log of receipt.logs){
 assert(norm(log.transactionHash)===norm(TX_HASH),"receipt includes unrelated log");
 const addr=norm(log.address);
 let ev=null;
 try {
  if(addr===norm(TOKEN))ev=TOKEN_I.parseLog(log);
  else if(addr===norm(VAULT))ev=VAULT_I.parseLog(log);
  else if(addr===norm(FORWARDER))ev=FORWARD_I.parseLog(log);
 }catch(e){ev=null}
 assert(ev!==null,"unexpected or undecodable log index "+asNumber(log.logIndex));
 const base=smallRecord(ev,log);
 if(addr===norm(TOKEN)&&ev.name==="Approval"){
  approvals.push({...base,owner:ev.args.owner,spender:ev.args.spender,valueWei:ev.args.value.toString()});
 }else if(addr===norm(TOKEN)&&ev.name==="Transfer"){
  transfers.push({...base,from:ev.args.from,to:ev.args.to,
   amountWei:ev.args.value.toString(),amountRls:formatUnits(ev.args.value,18)});
 }else if(addr===norm(VAULT)&&ev.name==="Commitment"){
  commitments.push({...base,vaultId:ev.args.vaultId.toString(),commitment:ev.args.commitment.toString()});
 }else if(addr===norm(VAULT)&&ev.name==="EncryptedNote"){
  encryptedNotes.push({...base,vaultId:ev.args.vaultId.toString(),commitment:ev.args.commitment.toString(),
   ciphertextI_bytes:(ev.args.ciphertextI.length-2)/2,
   ciphertextII_bytes:(ev.args.ciphertextII.length-2)/2});
 }else if(addr===norm(FORWARDER)&&ev.name==="Relayed"){
  relayed.push({...base,from:ev.args.from,to:ev.args.to,relayer:ev.args.relayer,
   nonce:ev.args.nonce.toString(),feeWei:ev.args.fee.toString(),
   feeRls:formatUnits(ev.args.fee,18)});
 }else otherLogs.push(base);
}
assert(approvals.length===2,"expect two allowance approvals");
assert(transfers.length===2,"expect two RLS Transfer events");
assert(commitments.length===1&&encryptedNotes.length===1,"expected commitment and encrypted note");
assert(relayed.length===1,"expected exactly one Relayed");
assert(otherLogs.length===0,"unexpected decoded events");
const deposit=transfers.filter(t=>norm(t.from)===norm(ACCOUNT)&&norm(t.to)===norm(VAULT));
assert(deposit.length===1,"expected exactly one account->SharedVault deposit");
assert(BigInt(deposit[0].amountWei)===40000000000000000000n,"amount is not exactly 40 RLS");
const forward=relayed[0];
assert(norm(forward.from)===norm(ACCOUNT),"relayed forwarded from wrong user");
assert(norm(forward.to)===norm(VAULT),"relayed to wrong vault");
assert(norm(forward.relayer)===norm(tx.from),"unexpected relayer payee");
const gasTransfer=transfers.filter(t=>norm(t.from)===norm(ACCOUNT)&&norm(t.to)===norm(forward.relayer));
assert(gasTransfer.length===1,"expected exactly one relayer fee Transfer");
assert(gasTransfer[0].amountWei===forward.feeWei,"relayer event fee vs token transfer mismatch");
const actualFee=BigInt(forward.feeWei);
const withdrawn=rlsBefore-rlsAfter;
assert(withdrawn===40000000000000000000n+actualFee,"account balance delta differs from deposit + fee");
assert(nativeAfter===nativeBefore,"native USDr balance unexpectedly changed");
assert(commitments[0].vaultId===encryptedNotes[0].vaultId&&
       commitments[0].commitment===encryptedNotes[0].commitment,
       "note and commitment do not match");
assert(encryptedNotes[0].ciphertextI_bytes>0&&encryptedNotes[0].ciphertextII_bytes>0,
       "ciphertext missing");
const [rpcLogs,blockscoutTx,blockscoutTransfers]=await Promise.all([
 rpc("eth_getLogs",[{fromBlock:afterTag,toBlock:afterTag,
    address:[TOKEN,VAULT,FORWARDER]}]),
 explorer(EXPLORER+"/transactions/"+TX_HASH),
 explorer(EXPLORER+"/addresses/"+ACCOUNT+"/token-transfers")
]);
const sameTxLogs=rpcLogs.filter(x=>norm(x.transactionHash)===norm(TX_HASH));
assert(sameTxLogs.length===receipt.logs.length,"independent eth_getLogs length differs");
for(const rlog of receipt.logs) {
 const found=sameTxLogs.find(l=>l.logIndex===rlog.logIndex&&
    norm(l.address)===norm(rlog.address)&&norm(l.data)===norm(rlog.data)&&
    JSON.stringify(l.topics.map(norm))===JSON.stringify(rlog.topics.map(norm)));
 assert(Boolean(found),"receipt log not reproduced by eth_getLogs");
}
let explorerMatch=null;
if(blockscoutTx.available){
 explorerMatch={
   blockMatches:Number(blockscoutTx.data.block_number)===height,
   status: blockscoutTx.data.status,
   hashMatches:norm(blockscoutTx.data.hash)===norm(TX_HASH)
 };
 assert(explorerMatch.hashMatches&&explorerMatch.blockMatches,"explorer hash/block mismatch");
}
let explorerTransfersMatch=null;
if(blockscoutTransfers.available){
 const indexed=(blockscoutTransfers.data.items??[]).filter(t=>norm(t.transaction_hash)===norm(TX_HASH));
 const pairs=indexed.map(x=>({
  from:norm(x.from?.hash),to:norm(x.to?.hash),amountWei:String(x.total?.value??"")
 }));
 explorerTransfersMatch={
  indexerTransferCount:pairs.length,
  allReceiptTransfersIndexed:transfers.every(t=>pairs.some(p=>
    p.from===norm(t.from)&&p.to===norm(t.to)&&p.amountWei===t.amountWei))
 };
 assert(explorerTransfersMatch.allReceiptTransfersIndexed,"explorer indexed transfers do not match RPC receipt");
}
const inventoryCodeChecks={
 RLS:tokenCode.sha256===INVENTORY.contract_inventory.RLS.code_sha256,
 SharedVault:vaultCode.sha256===INVENTORY.contract_inventory.SharedVault.code_sha256,
 RlsGasForwarder:forwarderCode.sha256===INVENTORY.contract_inventory.next.code_sha256
};
assert(Object.values(inventoryCodeChecks).every(Boolean),"live contract code hash differs from original pinned deployment snapshot");
const derived={
 evidence_class:"RESEARCHER_CONTROLLED_PUBLIC_SHIELD__THREE_SEPARATE_PUBLIC_CHECKS",
 captured_at_utc:new Date().toISOString(),chain_id:cid,
 tx_hash:TX_HASH,explorer_url:"https://testnet-explorer.rayls.com/tx/"+TX_HASH,
 controlled_account:ACCOUNT,
 block_number:height,block_hash:block.hash,
 timestamp_utc:new Date(asNumber(block.timestamp)*1000).toISOString(),
 status:asNumber(receipt.status),gas_used:asNumber(receipt.gasUsed),
 gas_price_wei:receipt.effectiveGasPrice?BigInt(receipt.effectiveGasPrice).toString():null,
 tx_from:tx.from,tx_to:tx.to,tx_value_wei:BigInt(tx.value).toString(),
 receipt_log_count:receipt.logs.length,
 public_rls_before_wei:rlsBefore.toString(),
 public_rls_after_wei:rlsAfter.toString(),
 public_rls_delta_wei:(rlsBefore-rlsAfter).toString(),
 public_rls_before:formatUnits(rlsBefore,18),
 public_rls_after:formatUnits(rlsAfter,18),
 public_rls_delta:formatUnits(rlsBefore-rlsAfter,18),
 shield_principal_wei:deposit[0].amountWei,
 shield_principal_RLS:deposit[0].amountRls,
 relayer_fee_wei:forward.feeWei,
 relayer_fee_RLS:forward.feeRls,
 native_usdr_before_wei:BigInt(nativeBefore).toString(),
 native_usdr_after_wei:BigInt(nativeAfter).toString(),
 approvals,transfers,commitments,encrypted_notes:encryptedNotes,relayed,
 counts:{public_transfer_logs:transfers.length,approvals:approvals.length,
  commitments:commitments.length,encrypted_notes:encryptedNotes.length,
  relayed_events:relayed.length},
 checks:{
  transaction_included_in_block:true,
  receipt_block_hash_matched:true,
  receipt_status_success:true,
  relay_event_fee_matches_erc20_transfer:true,
  public_rls_balance_delta_matches_shield_plus_fee:true,
  public_native_usdr_unchanged:true,
  commitment_matches_encrypted_note:true,
  receipt_logs_match_separate_eth_getLogs_query:true,
  code_hashes_match_original_snapshot:inventoryCodeChecks,
  explorer:explorerMatch,
  indexer_transfers:explorerTransfersMatch
 },
 pinned_contracts:{token:TOKEN,vault:VAULT,forwarder:FORWARDER},
 contract_code_snapshots:{RLS:tokenCode,SharedVault:vaultCode,Forwarder:forwarderCode},
 raw_public_rpc:{
  tx,receipt,
  block:{number:block.number,hash:block.hash,parentHash:block.parentHash,
    timestamp:block.timestamp,transaction_hashes:block.transactions.map(t=>t.hash)},
  receipt_logs_retrieved_by_separate_eth_getLogs:sameTxLogs
 },
 limitations:[
  "The public chain proves a 40 RLS deposit and encrypted-note commitment, NOT the private wallet's spendable/decrypted note balance.",
  "The relayer event fee is a public token fee, not native gas paid by the user. The relayer submitted and paid native gas.",
  "The fee shown in the app as ~3.51 RLS is corroborated exactly by the onchain Relayed event; the 15% Foundation distribution is not proven by this receipt.",
  "The shielding amount and source EVM address are deliberately public; no private payment privacy claim follows from the deposit alone.",
  "Code snapshots are sha256 of deployed bytecode; a source-code rebuild was not independently reproduced."
 ]
};
const outputDir=ROOT+"/evidence/public-rpc/controlled";
fs.mkdirSync(outputDir,{recursive:true});
const target=outputDir+"/god-shield-40-verified.json";
fs.writeFileSync(target,JSON.stringify(derived,null,2)+"\n");
console.log(JSON.stringify({status:"PASS",tx_hash:TX_HASH,block:height,
 shield_principal_RLS:derived.shield_principal_RLS,
 public_fee_RLS:derived.relayer_fee_RLS,
 public_balance_before_RLS:derived.public_rls_before,
 public_balance_after_RLS:derived.public_rls_after,
 event_counts:derived.counts,
 ciphertext_lengths:encryptedNotes.map(x=>[x.ciphertextI_bytes,x.ciphertextII_bytes]),
 explorer_corroboration:explorerMatch,
 receipt_logs_separate_query:derived.checks.receipt_logs_match_separate_eth_getLogs_query,
 saved:target},null,2));
