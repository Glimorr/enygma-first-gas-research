/**
 * 24 deliberate corruptions of frozen recipient claim+registration evidence.
 * Mutation entirely in-memory; no original files edited.
 */
import fs from "node:fs";
import {validate} from "./verify_receiver_onboarding_offline.mjs";
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const src=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json","utf8"));
const mut=[
 ["wrong_chain",s=>s.chainId=1,"chainId"],
 ["wrong_receiver",s=>s.correctReceiver="0x"+"1".repeat(40),"receiver.address"],
 ["wrong_claim_hash",s=>s.claim.hash="0x"+"1".repeat(64),"claim.originalHash"],
 ["wrong_registration_hash",s=>s.registration.hash="0x"+"1".repeat(64),"registration.originalHash"],
 ["reverted_claim",s=>s.claim.receipt.status="0x0","tx.status.claim"],
 ["reverted_registration",s=>s.registration.receipt.status="0x0","tx.status.registration"],
 ["claim_block_hash",s=>s.claim.header.hash="0x"+"0".repeat(64),"tx.blockHash.claim"],
 ["registry_block_hash",s=>s.registration.header.hash="0x"+"0".repeat(64),"tx.blockHash.registration"],
 ["claim_block_inclusion",s=>s.claim.header.transaction_hashes=s.claim.header.transaction_hashes.filter(h=>h.toLowerCase()!==s.claim.hash.toLowerCase()),"tx.inclusion.claim"],
 ["registration_block_inclusion",s=>s.registration.header.transaction_hashes=s.registration.header.transaction_hashes.filter(h=>h.toLowerCase()!==s.registration.hash.toLowerCase()),"tx.inclusion.registration"],
 ["changed_vault_target",s=>s.claim.tx.to="0x"+"e".repeat(40),"claim.vault"],
 ["changed_forwarder_target",s=>s.registration.tx.to="0x"+"f".repeat(40),"registration.forwarder"],
 ["deleted_claim_note",s=>s.claim.receipt.logs.pop(),"tx.separateLogsCount.claim"],
 ["deleted_registry_log",s=>s.registration.receipt.logs.pop(),"tx.separateLogsCount.registration"],
 ["modified_secondary_claim_log",s=>s.claim.logs_from_independent_query[0].data="0x1234","events.separateLogsMismatch.claim"],
 ["modified_secondary_reg_log",s=>s.registration.logs_from_independent_query[1].data="0x1234","events.separateLogsMismatch.registration"],
 ["forged_nullifier_field",s=>s.claim.events.find(e=>e.name==="Nullifier").nullifier="1","claim.derivedNullifier"],
 ["forged_commitment_field",s=>s.claim.events.find(e=>e.name==="Commitment").commitment="1","claim.derivedCommitment"],
 ["bad_note_ciphertext_len",s=>s.claim.events.find(e=>e.name==="EncryptedNote").ciphertextIBytes=45,"claim.derivedEncryptedNotes"],
 ["wrong_registered_username",s=>s.registration.events.find(e=>e.name==="UsernameSet").username="notdevil","registration.derivedUsername"],
 ["falsified_registry_fee",s=>s.registration.forwarderFeeWei="1000000000000000000","registration.publicFeeZero"],
 ["falsified_preclaim_public_rls",s=>s.fixedBlockReceiverStates.pre_claim.rlsWei="1000000000000000000","states.zeroPublicBalancesAndNonces"],
 ["falsified_postclaim_nonce",s=>s.fixedBlockReceiverStates.claim_after.accountNonce=1,"states.zeroPublicBalancesAndNonces"],
 ["falsified_preclaim_registration",s=>s.fixedBlockReceiverStates.pre_claim.registered=true,"states.registrationHistory"],
 ["falsified_postreg_registration",s=>s.fixedBlockReceiverStates.registration_after.registered=false,"states.registrationHistory"],
 ["fake_public_token_transfer",s=>s.publicTokenTransfersInFullControlWindow.push({tx:"0x1"}),"states.publicTransfers"],
 ["fake_explorer_history",s=>s.explorerHistory.transactions.count=1,"states.explorerHistory"],
 ["wrong_ui_balance",s=>s.walletPrivateClaimAmountUiObserved="30 RLS","wallet.uiNotChain"],
 ["wrong_privacy_boundary",s=>s.amountsVisibleOnPublicClaimReceipt=true,"claim.privacyBoundary"],
 ["wrong_secret_handling",s=>s.invitationLinkUsed=true,"security.noInviteSecret"]
];
const pristine=validate(src);
if(pristine.length)throw Error("Unmutated evidence fails: "+JSON.stringify(pristine));
const results=[];
for(const [name,change,label] of mut){
 const changed=structuredClone(src);change(changed);
 const errs=validate(changed);
 results.push({case:name,expectedError:label,detected:errs.some(x=>x.startsWith(label)),errors:errs});
}
const failed=results.filter(r=>!r.detected);
const summary={evidence_class:"IN_MEMORY_RECEIVER_ONBOARDING_TAMPER_CONTROLS",
 runAtUtc:new Date().toISOString(),tests:mut.length,rejected:mut.length-failed.length,
 status:failed.length?"FAIL":"PASS",originalEvidenceModified:false,failures:failed,results};
const file=root+"/qa/receiver-onboarding-tamper-tests.json";
fs.writeFileSync(file,JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({status:summary.status,tests:summary.tests,rejected:summary.rejected,
 failures:failed,saved:file},null,2));
if(failed.length)process.exitCode=1;
