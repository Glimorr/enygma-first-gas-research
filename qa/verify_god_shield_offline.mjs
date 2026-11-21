/* Offline consistency checker for a frozen PUBLIC shield receipt. Read-only.
 * Claims about live chain authenticity still require qa/verify_god_shield.mjs.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,formatUnits}=require("ethers");
const ROOT=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const file=ROOT+"/evidence/public-rpc/controlled/god-shield-40-verified.json";
const baseline=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/burner-baseline.json","utf8"));
const inventory=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/contract-inventory.json","utf8"));
const tokenI=new Interface([
 "event Transfer(address indexed from,address indexed to,uint256 value)",
 "event Approval(address indexed owner,address indexed spender,uint256 value)"
]);
const vaultI=new Interface(JSON.parse(fs.readFileSync(ROOT+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const forwardI=new Interface(JSON.parse(fs.readFileSync(ROOT+"/research/verified-abis/next.json","utf8")));
const n=x=>String(x??"").toLowerCase();
const eq=(a,b)=>n(a)===n(b);
export function validate(snapshot){
 const issues=[];const check=(ok,field)=>{if(!ok)issues.push(field)};
 try{
  const tx=snapshot.raw_public_rpc.tx,rec=snapshot.raw_public_rpc.receipt,b=snapshot.raw_public_rpc.block;
  check(snapshot.evidence_class==="RESEARCHER_CONTROLLED_PUBLIC_SHIELD__THREE_SEPARATE_PUBLIC_CHECKS","provenance.class");
  check(snapshot.chain_id===7295799,"chain.id");
  check(eq(snapshot.tx_hash,tx.hash)&&eq(snapshot.tx_hash,rec.transactionHash),"tx.hash");
  check(eq(rec.blockHash,tx.blockHash)&&eq(rec.blockHash,b.hash),"block.consistency");
  check(b.transaction_hashes.some(h=>eq(h,tx.hash)),"block.inclusion");
  check(Number(BigInt(b.number))===snapshot.block_number,"block.height");
  check(Number(BigInt(rec.blockNumber))===snapshot.block_number,"receipt.height");
  check(Number(BigInt(rec.status))===1&&snapshot.status===1,"receipt.success");
  check(rec.logs.length===7&&snapshot.receipt_log_count===7,"receipt.logCount");
  check(eq(tx.to,inventory.relayer_report.active_forwarder)&&
    eq(rec.to,inventory.relayer_report.active_forwarder),"contract.forwarder");
  check(eq(tx.from,inventory.relayer_report.relayer_address),"tx.relayer");
  check(eq(snapshot.controlled_account,baseline.account),"account.baseline");
  const transfers=[],approvals=[],commitments=[],notes=[],relayed=[];
  for(const l of rec.logs){
    check(eq(l.transactionHash,tx.hash),"log.txHash");
    let ev=null;
    try{
      if(eq(l.address,inventory.contract_inventory.RLS.address))ev=tokenI.parseLog(l);
      else if(eq(l.address,inventory.contract_inventory.SharedVault.address))ev=vaultI.parseLog(l);
      else if(eq(l.address,inventory.relayer_report.active_forwarder))ev=forwardI.parseLog(l);
    }catch(e){}
    check(Boolean(ev),"log.decode."+l.logIndex);
    if(!ev)continue;
    if(ev.name==="Transfer")transfers.push({from:ev.args.from,to:ev.args.to,value:ev.args.value});
    else if(ev.name==="Approval")approvals.push(ev);
    else if(ev.name==="Commitment")commitments.push({
      vaultId:ev.args.vaultId.toString(),commitment:ev.args.commitment.toString()});
    else if(ev.name==="EncryptedNote")notes.push({
      vaultId:ev.args.vaultId.toString(),commitment:ev.args.commitment.toString(),
      bytesI:(ev.args.ciphertextI.length-2)/2,bytesII:(ev.args.ciphertextII.length-2)/2});
    else if(ev.name==="Relayed")relayed.push({
      from:ev.args.from,to:ev.args.to,relayer:ev.args.relayer,fee:ev.args.fee});
    else check(false,"log.unexpectedEvent."+ev.name);
  }
  check(transfers.length===2,"events.transfersCount");
  check(approvals.length===2,"events.approvalsCount");
  check(commitments.length===1&&notes.length===1,"events.notesCount");
  check(relayed.length===1,"events.relayCount");
  if(notes[0]&&commitments[0]){
    check(notes[0].vaultId===commitments[0].vaultId&&notes[0].commitment===commitments[0].commitment,
      "events.commitmentConsistency");
    check(notes[0].bytesI>0&&notes[0].bytesII>0,"events.ciphertextPresence");
    check(snapshot.commitments[0].commitment===commitments[0].commitment&&
      snapshot.commitments[0].vaultId===commitments[0].vaultId,"derived.commitment");
    check(snapshot.encrypted_notes[0].ciphertextI_bytes===notes[0].bytesI&&
      snapshot.encrypted_notes[0].ciphertextII_bytes===notes[0].bytesII,"derived.encryptedNoteLengths");
  }
  if(relayed[0]&&transfers.length===2){
    const e=relayed[0];
    check(eq(e.from,snapshot.controlled_account)&&eq(e.to,inventory.contract_inventory.SharedVault.address),
      "relay.forwardTarget");
    check(eq(e.relayer,tx.from),"relay.payee");
    const principal=transfers.filter(t=>eq(t.from,snapshot.controlled_account)&&
     eq(t.to,inventory.contract_inventory.SharedVault.address));
    const paid=transfers.filter(t=>eq(t.from,snapshot.controlled_account)&&eq(t.to,e.relayer));
    check(principal.length===1&&principal[0]?.value===40000000000000000000n,
     "transfers.shieldPrincipal");
    check(paid.length===1&&paid[0]?.value===e.fee,"transfers.feeToRelayer");
    check(e.fee.toString()===snapshot.relayer_fee_wei,"derived.feeWei");
    check(formatUnits(e.fee,18)===snapshot.relayer_fee_RLS,"derived.feeRls");
    check(principal[0]?.value.toString()===snapshot.shield_principal_wei,"derived.principalWei");
    check(principal[0]&&formatUnits(principal[0].value,18)===snapshot.shield_principal_RLS,"derived.principalRls");
    check(snapshot.transfers.length===transfers.length &&
      snapshot.transfers.every(t=>transfers.some(a=>eq(t.from,a.from)&&eq(t.to,a.to)&&t.amountWei===a.value.toString())),
      "derived.transferList");
    check(snapshot.relayed.length===1&&snapshot.relayed[0].feeWei===e.fee.toString()&&
      eq(snapshot.relayed[0].from,e.from)&&eq(snapshot.relayed[0].relayer,e.relayer),
      "derived.relayEvent");
    const before=BigInt(snapshot.public_rls_before_wei);
    const after=BigInt(snapshot.public_rls_after_wei);
    check(before-after===e.fee+40000000000000000000n,"balances.depositPlusFee");
    check(before.toString()===baseline.tokenBalances.RLS.amountWei,"balances.originalBaseline");
    check(after.toString()===snapshot.public_rls_after_wei,"balances.result");
    check((before-after).toString()===snapshot.public_rls_delta_wei,"balances.delta");
    check(BigInt(snapshot.native_usdr_before_wei)===BigInt(snapshot.native_usdr_after_wei),
      "balances.nativeUnchanged");
  }
  const secondary=snapshot.raw_public_rpc.receipt_logs_retrieved_by_separate_eth_getLogs;
  check(secondary.length===rec.logs.length,"logs.secondaryQueryLength");
  for(const log of rec.logs){
    const matching=secondary.find(x=>eq(x.logIndex,log.logIndex)&&eq(x.address,log.address)&&
      eq(x.data,log.data)&&JSON.stringify(x.topics.map(n))===JSON.stringify(log.topics.map(n)));
    check(Boolean(matching),"logs.secondaryQueryMismatch."+log.logIndex);
  }
  const c=snapshot.checks;
  check(c.receipt_status_success&&c.commitment_matches_encrypted_note&&
    c.public_rls_balance_delta_matches_shield_plus_fee&&
    c.relay_event_fee_matches_erc20_transfer&&
    c.receipt_logs_match_separate_eth_getLogs_query,"reported.checkFlags");
  check(Object.values(c.code_hashes_match_original_snapshot).every(Boolean),"deployment.codeHashes");
  const codePairs=[["RLS","RLS"],["SharedVault","SharedVault"],["Forwarder","next"]];
  for(const [label,key] of codePairs)check(snapshot.contract_code_snapshots[label].sha256===
    inventory.contract_inventory[key].code_sha256,"deployment."+label+"Sha256");
  if(c.explorer)check(c.explorer.hashMatches&&c.explorer.blockMatches&&c.explorer.status==="ok",
    "explorer.corroboration");
  if(c.indexer_transfers)check(c.indexer_transfers.allReceiptTransfersIndexed,
    "explorer.tokenTransfers");
 }catch(error){issues.push("exception."+String(error).slice(0,180));}
 return issues;
}
if(process.argv[1]?.endsWith("/verify_god_shield_offline.mjs")){
 const saved=JSON.parse(fs.readFileSync(file,"utf8"));
 const errors=validate(saved);
 const result={evidence_class:"OFFLINE_CONSISTENCY_NOT_FRESH_RPC",
   status:errors.length?"FAIL":"PASS",checks:"FROZEN_BLOCK_RECEIPT_TOKEN_EVENTS_NOTE_FEE_BALANCES",
   errors,validated_at_utc:new Date().toISOString(),
   crucial_caveat:"An internally consistent saved receipt is not proof it still matches live public chain; run verify_god_shield.mjs."};
 const out=ROOT+"/qa/god-shield-offline-check.json";
 fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));
 if(errors.length)process.exitCode=1;
}
