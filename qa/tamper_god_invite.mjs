/**
 * Deliberately mutate a COPY of saved invitation public receipt in-memory.
 * Original evidence and public blockchain are never modified.
 */
import fs from "node:fs";
import {validate} from "./verify_god_invite_offline.mjs";
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const source=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json","utf8"));
const tests=[
 ["wrong_chain",x=>x.chain_id=1,"chainId"],
 ["wrong_provenance",x=>x.evidence_class="CONTROLLED_INVITE_CLAIM_COMPLETED","provenance"],
 ["wrong_hash",x=>x.hash="0x"+"f".repeat(64),"hash"],
 ["receipt_status",x=>x.raw_public_rpc.receipt.status="0x0","status"],
 ["block_header_hash",x=>x.raw_public_rpc.block.hash="0x"+"0".repeat(64),"blockHash"],
 ["tx_not_in_block",x=>x.raw_public_rpc.block.transaction_hashes=x.raw_public_rpc.block.transaction_hashes.filter(h=>h.toLowerCase()!==x.hash.toLowerCase()),"blockInclusion"],
 ["wrong_vault",x=>x.raw_public_rpc.tx.to="0x"+"a".repeat(40),"vaultTarget"],
 ["wrong_method",x=>x.method="claimInvite","method"],
 ["fake_more_inputs",x=>x.proof_inputs=5,"inputCount"],
 ["fake_more_outputs",x=>x.proof_outputs=5,"outputCount"],
 ["removed_encrypted_note",x=>x.raw_public_rpc.receipt.logs.pop(),"eventTopology"],
 ["missing_nullifier",x=>x.nullifiers[0].nullifier="1","derivedNullifier"],
 ["changed_commitment",x=>x.commitments[0].commitment="2","derivedCommitments"],
 ["changed_ciphertext_length",x=>x.encrypted_notes[0].ciphertextIBytes=20,"derivedEncryptedNotes"],
 ["changed_secondary_log",x=>x.raw_public_rpc.independently_retrieved_logs[0].data="0xff","independentEventBytes"],
 ["incorrect_public_balance",x=>x.balances.owner_erc20_rls_after_wei="0","ownerPublicBalance"],
 ["fake_funded_receiver",x=>x.balances.candidate_receiver_erc20_rls_after_wei="1","receiverZeroPublicRls"],
 ["fake_nonce",x=>x.balances.owner_nonce_after=99,"ownerNonce"],
 ["bad_privacy_claim",x=>x.actual_rich_payment_amount_wei_publicly_visible=true,"privacyClaim"]
];
const pristine=validate(source);
if(pristine.length)throw Error("Pristine data failed: "+pristine.join(","));
const records=[];
for(const [name,change,expected] of tests){
 const value=structuredClone(source);
 change(value);
 const errors=validate(value);
 records.push({name,expected,detected:errors.some(e=>e.startsWith(expected)),errors});
}
const result={status:records.every(x=>x.detected)?"PASS":"FAIL",
 evidence_class:"IN_MEMORY_SHIELDED_INVITATION_PUBLIC_RECEIPT_MUTATION_TESTS",
 tested_at_utc:new Date().toISOString(),tested_count:records.length,
 detected_count:records.filter(x=>x.detected).length,source_files_modified:false,
 does_not_verify_invitation_secret_or_claim:true,results:records};
const file=root+"/qa/invite-tamper-tests.json";
fs.writeFileSync(file,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:result.status,tests:result.tested_count,detected:result.detected_count,
 failures:records.filter(x=>!x.detected),saved:file},null,2));
if(result.status!=="PASS")process.exitCode=1;
