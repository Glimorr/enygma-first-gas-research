/** Mutation controls: 30 in-memory corruptions of the last controlled private spend evidence. */
import fs from "node:fs";
import {validate} from "./verify_faucet_cohort_private_spend_offline.mjs";
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const originalSpend=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-private-spend-77ff894ed5.json","utf8"));
const originalFee=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-private-spend-fee-replay-verified.json","utf8"));
const tests=[
 ["wrong_chain",([s,f])=>s.chainId=1,"chain"],
 ["wrong_fee_chain",([s,f])=>f.chainId=1,"chain"],
 ["wrong_owner",([s,f])=>s.originalControlledSender="0x"+"f".repeat(40),"spend.senderOwner"],
 ["wrong_recipient_control",([s,f])=>s.expectedControlledRecipient="0x"+"f".repeat(40),"spend.expectedRecipient"],
 ["wrong_hash",([s,f])=>s.txHash="0x"+"f".repeat(64),"spend.hash"],
 ["wrong_receipt_hash",([s,f])=>s.rawPublicReceipt.transactionHash="0x"+"f".repeat(64),"spend.rawTxHash"],
 ["wrong_block_hash",([s,f])=>s.rawPublicReceipt.blockHash="0x"+"f".repeat(64),"spend.blockHash"],
 ["missing_block_inclusion",([s,f])=>s.blockHeader.txHashes=s.blockHeader.txHashes.filter(h=>h.toLowerCase()!==s.txHash.toLowerCase()),"spend.blockInclusion"],
 ["wrong_height",([s,f])=>s.blockNumber=4,"spend.blockHeight"],
 ["reverted_spend",([s,f])=>s.rawPublicReceipt.status="0x0","spend.receiptStatus"],
 ["wrong_vault",([s,f])=>s.rawPublicTx.to="0x"+"f".repeat(40),"spend.vaultTarget"],
 ["wrong_relayer",([s,f])=>s.rawPublicTx.from="0x"+"f".repeat(40),"spend.relayer"],
 ["wrong_method",([s,f])=>s.method="withdrawPublic","spend.method"],
 ["deleted_note_log",([s,f])=>s.rawPublicReceipt.logs.pop(),"spend.logTopology"],
 ["wrong_nullifier",([s,f])=>s.nullifiers[0].nullifier="1","spend.savedNullifiers"],
 ["wrong_commitment",([s,f])=>s.commitments[0].commitment="1","spend.savedCommitments"],
 ["wrong_note_bytes",([s,f])=>s.encryptedNotes[0].ctIBytes=44,"spend.savedNotes"],
 ["wrong_separate_log",([s,f])=>s.separateEthGetLogs[0].data="0xdeadbeef","spend.secondLogBytes"],
 ["changed_sender_balance",([s,f])=>s.senderStateAtLatestHead.rlsWei="1","spend.publicFundingContinuity"],
 ["sender_nonce_changed",([s,f])=>s.senderStateAtLatestHead.nonce=1,"spend.publicFundingContinuity"],
 ["false_zero_public_funding_claim",([s,f])=>s.sourcePublicFundingVerified=false,"spend.preSourceFundingTruth"],
 ["fake_transparent_transfer",([s,f])=>s.transparentRlsUsdrTransfersInControlledSenderWindow.push({tx:"0x1"}),"spend.publicTransfers"],
 ["fake_public_amount",([s,f])=>s.privatePrincipalPubliclyRevealedByReceipt=true,"spend.privateVisibility"],
 ["payout_wrong_hash",([s,f])=>f.payoutTx="0x"+"f".repeat(64),"fee.txHash"],
 ["payout_reverted",([s,f])=>f.rawPublicEvidence.payoutReceipt.status="0x0","fee.receiptBlock"],
 ["wrong_payout_block",([s,f])=>f.payoutBlock=100,"fee.payoutBlock"],
 ["wrong_token_contract",([s,f])=>f.rawPublicEvidence.payoutTransferLog.address="0x"+"f".repeat(40),"fee.tokenTransfer"],
 ["wrong_relayer_topic",([s,f])=>f.rawPublicEvidence.payoutTransferLog.topics[1]="0x"+"f".repeat(64),"fee.fromRelayer"],
 ["wrong_treasury_topic",([s,f])=>f.rawPublicEvidence.payoutTransferLog.topics[2]="0x"+"f".repeat(64),"fee.toTreasury"],
 ["wrong_receipt_transfer_data",([s,f])=>f.rawPublicEvidence.payoutTransferLog.data="0x1","fee.receiptLogInclusion"],
 ["wrong_reported_share",([s,f])=>f.treasuryTransferWei="123","fee.amount"],
 ["wrong_gross_fee",([s,f])=>f.derivedGrossFeeWei="100","fee.exactFormula"],
 ["wrong_window",([s,f])=>f.window.startBlock=10,"fee.window"],
 ["fake_second_payout",([s,f])=>f.window.matchingTreasuryTransfers.push({hash:"0x1"}),"fee.uniqueCandidates"],
 ["bad_private_ui",([s,f])=>f.sourceWalletObservedPrincipalRls="500","fee.walletUi"],
 ["bad_replay_before",([s,f])=>f.historicalReplayControls.calls[0].outcome="REVERT","replay.beforeAfter"],
 ["bad_replay_after",([s,f])=>f.historicalReplayControls.calls[2].outcome="SUCCESS","replay.beforeAfter"],
 ["signed_replay_claim",([s,f])=>f.historicalReplayControls.transactionBroadcasts=1,"replay.counts"]
];
if(validate(originalSpend,originalFee).length)throw Error("Second cohort private spend verifier failed");
const outcomes=[];
for(const [name,mutate,expected] of tests){
 const s=structuredClone(originalSpend),f=structuredClone(originalFee);
 mutate([s,f]);
 const errors=validate(s,f);
 outcomes.push({test:name,expected,detected:errors.some(e=>e.startsWith(expected)),errors:errors.slice(0,6)});
}
const fails=outcomes.filter(x=>!x.detected);
const result={status:fails.length?"FAIL":"PASS",
 evidence_class:"IN_MEMORY_PUBLIC_FUNDED_SECOND_COHORT_PRIVATE_SPEND_FEE_REPLAY_AND_BALANCE_MUTATION_CONTROLS",
 testedAtUtc:new Date().toISOString(),mutations:tests.length,rejected:tests.length-fails.length,
 untouchedOriginalSourceFiles:true,failed:fails,results:outcomes};
const dest=root+"/qa/faucet-cohort-private-spend-tamper-tests.json";
fs.writeFileSync(dest,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:result.status,mutations:result.mutations,rejected:result.rejected,
 missed:fails,output:dest},null,2));
if(fails.length)process.exitCode=1;
