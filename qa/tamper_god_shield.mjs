/**
 * In-memory mutation tests for verified user-controlled Enygma Public shield evidence.
 * Never edits the frozen public-chain receipt or public-chain state.
 */
import fs from "node:fs";
import {validate} from "./verify_god_shield_offline.mjs";
const ROOT=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const source=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/controlled/god-shield-40-verified.json","utf8"));
const suites=[
 ["wrong_chain",s=>s.chain_id=1,"chain.id"],
 ["edited_receipt_status",s=>s.raw_public_rpc.receipt.status="0x0","receipt.success"],
 ["wrong_block_hash",s=>s.raw_public_rpc.receipt.blockHash="0x"+"0".repeat(64),"block.consistency"],
 ["broken_tx_hash",s=>s.tx_hash="0x"+"f".repeat(64),"tx.hash"],
 ["removed_block_inclusion",s=>s.raw_public_rpc.block.transaction_hashes=s.raw_public_rpc.block.transaction_hashes.filter(x=>x.toLowerCase()!==s.tx_hash.toLowerCase()),"block.inclusion"],
 ["wrong_forwarder_target",s=>s.raw_public_rpc.tx.to="0x"+"1".repeat(40),"contract.forwarder"],
 ["zero_transfer_log",s=>s.raw_public_rpc.receipt.logs.splice(1,1),"receipt.logCount"],
 ["added_transfer_log",s=>s.raw_public_rpc.receipt.logs.push({...s.raw_public_rpc.receipt.logs[1]}),"receipt.logCount"],
 ["edited_principal_field",s=>s.shield_principal_wei="41000000000000000000","derived.principalWei"],
 ["edited_principal_RLS",s=>s.shield_principal_RLS="45.0","derived.principalRls"],
 ["edited_fee_field",s=>s.relayer_fee_wei="2500000000000000000","derived.feeWei"],
 ["edited_public_balance",s=>s.public_rls_after_wei="200000000000000000000","balances.depositPlusFee"],
 ["edited_baseline",s=>s.public_rls_before_wei="400000000000000000000","balances.depositPlusFee"],
 ["edited_public_native",s=>s.native_usdr_after_wei="1","balances.nativeUnchanged"],
 ["edited_commitment",s=>s.commitments[0].commitment="31337","derived.commitment"],
 ["edited_ciphertext_len",s=>s.encrypted_notes[0].ciphertextI_bytes=0,"derived.encryptedNoteLengths"],
 ["edited_indexed_logs",s=>s.raw_public_rpc.receipt_logs_retrieved_by_separate_eth_getLogs[0].data="0x"+"f".repeat(64),"logs.secondaryQueryMismatch"],
 ["reported_bad_explorer_status",s=>s.checks.explorer.status="error","explorer.corroboration"],
 ["reported_unverified_deployment",s=>s.checks.code_hashes_match_original_snapshot.RLS=false,"deployment.codeHashes"],
 ["modified_deployment_code_hash",s=>s.contract_code_snapshots.RLS.sha256="f".repeat(64),"deployment.RLSSha256"],
 ["tampered_derived_transfer",s=>s.transfers[0].amountWei="1","derived.transferList"],
 ["false_positive_check_flags",s=>s.checks.receipt_status_success=false,"reported.checkFlags"]
];
const intact=validate(source);
if(intact.length)throw Error("Original frozen evidence did not validate: "+intact.join(","));
const result=suites.map(([name,change,expected])=>{
 const changed=structuredClone(source);
 change(changed);
 const issues=validate(changed);
 return {name,detected:issues.some(x=>x.startsWith(expected)),expected,issues};
});
const failures=result.filter(x=>!x.detected);
const summary={evidence_class:"IN_MEMORY_TAMPER_DETECTION_ON_FROZEN_SHIELD_RECEIPT",
 run_utc:new Date().toISOString(),status:failures.length?"FAIL":"PASS",
 test_count:result.length,rejected_count:result.length-failures.length,
 read_only:true,original_files_modified:false,
 results:result};
const file=ROOT+"/qa/god-shield-tamper-tests.json";
fs.writeFileSync(file,JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({status:summary.status,tests:summary.test_count,
 rejected:summary.rejected_count,failed_tests:failures,
 saved:file},null,2));
if(failures.length)process.exitCode=1;
