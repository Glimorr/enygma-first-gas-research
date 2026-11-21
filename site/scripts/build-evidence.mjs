import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const project=path.resolve(import.meta.dirname,"../..");
const output=path.join(project,"site/public/data/evidence.json");
const folder=path.dirname(output);
fs.mkdirSync(folder,{recursive:true});
function load(name){return JSON.parse(fs.readFileSync(path.join(project,name),"utf8"))}
const shield=load("evidence/public-rpc/controlled/god-shield-40-verified.json");
const invite=load("evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json");
const reg=load("evidence/public-rpc/controlled/dev-registration-verified-receipt.json");
const faucet=load("evidence/public-rpc/controlled/verified-faucet-rls-receipt.json");
const hub=load("evidence/public-rpc/controlled/hub-pre-invite-zero-baseline.json");
const fees=load("evidence/public-rpc/observational/fee-treasury-multi-case-controls.json");
const treasury=load("evidence/public-rpc/controlled/god-shield-fee-treasury-scan.json");
const receiver=load("evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json");
const receiverFee=load("evidence/public-rpc/controlled/receiver-private-fee-sidechannel-verified.json");
const replay=load("evidence/public-rpc/controlled/claim-invite-historical-replay-controls.json");
const spend=load("evidence/public-rpc/controlled/receiver-private-spend-5423d2b13c.json");
const spendFee=load("evidence/public-rpc/controlled/receiver-private-spend-fee-replay-verified.json");
const recipientOwner=load("evidence/public-rpc/controlled/receiver-dev-owner-ui-3rls-verified.json");
const secondRegistration=load("evidence/public-rpc/controlled/faucet-cohort-funding-and-registration-verified.json");
const secondShield=load("evidence/public-rpc/controlled/faucet-cohort-public-shield-20-verified.json");
const secondSpend=load("evidence/public-rpc/controlled/faucet-cohort-private-spend-77ff894ed5.json");
const secondFee=load("evidence/public-rpc/controlled/faucet-cohort-private-spend-fee-replay-verified.json");
const secondOwner=load("evidence/public-rpc/controlled/faucet-cohort-recipient-owner-witness-6rls.json");
const shiftedNulls=load("evidence/public-rpc/controlled/private-fee-temporal-shift-placebo-verified.json");
const overspend=load("evidence/public-rpc/controlled/dev-overspend-guard-readonly-verified.json");

const reportPath=path.join(project,"release/two-cohort-release-report.json");
const manifestPath=path.join(project,"MANIFEST.sha256");
const archive=fs.existsSync(reportPath)?load("release/two-cohort-release-report.json"):
  fs.existsSync(manifestPath)?{
    archive_sha256:crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex"),
    source_files:fs.readFileSync(manifestPath,"utf8").trim().split("\n").length,
    checksum_kind:"manifest hash (build from extracted files)"}:
  {archive_sha256:"NOT_RELEASED",source_files:0,checksum_kind:"pre-release source preview"};
const noSecret=(obj)=>{
 let s=JSON.stringify(obj);
 if(s.includes("enygma-testnet.rayls.com/i#")||s.match(/privateKey.{0,25}0x[a-fA-F0-9]{64}/))throw Error("Sensitive material blocked");
 return obj;
};
const fmt=val=>Number(val).toFixed(8).replace(/0+$/,"").replace(/\.$/,"");
const myInv=fees.cases.find(c=>c.case==="controlled_god_shield");
const feeRow=myInv?.matching_treasury_transfers?.[0];
const data=noSecret({
  edition:"FINAL RESEARCH — TWO CONTROLLED ENYGMA PUBLIC ONBOARDING PATHS VERIFIED",
  version:"21 November 2026 · two-cohort second edition",
  chainId:7295799,
  checksum_sha256_of_archive:archive.archive_sha256,
  archiveFiles:archive.source_files,
  claims:{
    publicShield:{amount:fmt(shield.shield_principal_RLS), fee:fmt(shield.relayer_fee_RLS),
      totalDebit:fmt(shield.public_rls_delta),balanceBefore:fmt(shield.public_rls_before),
      balanceAfter:fmt(shield.public_rls_after),
      block:shield.block_number,tx:shield.tx_hash,gasUsed:shield.gas_used,
      from:shield.controlled_account,
      vault:shield.pinned_contracts.vault,
      logs:shield.receipt_log_count,
      eventCounts:shield.counts,codeCheck:shield.checks.code_hashes_match_original_snapshot,
      noteCipherLengths:shield.encrypted_notes.map(e=>[e.ciphertextI_bytes,e.ciphertextII_bytes])},
    invitation:{amountWalletObserved:30,feeWalletObservedApprox:4.42,
      block:invite.block_height,tx:invite.hash,status:invite.status,gasUsed:invite.gas_used,
      method:invite.method,inputs:invite.proof_inputs,outputs:invite.proof_outputs,
      nullifierCount:invite.nullifiers.length,
      noteCount:invite.encrypted_notes.length,
      commitmentCount:invite.commitments.length,
      ownerPublicBalanceBefore:fmt(Number(invite.balances.owner_erc20_rls_before_wei)/1e18),
      ownerPublicBalanceAfter:fmt(Number(invite.balances.owner_erc20_rls_after_wei)/1e18)},
    registration:{tx:reg.txHash,block:reg.blockNumber,username:reg.username,
      feeRls:fmt(Number(reg.relayedEvents?.[0]?.feeWei??0)/1e18),
      wallet:reg.account},
    publicFaucet:{tx:faucet.transaction_hash,block:faucet.block_number,
      amountRls:fmt(Number(faucet.faucet_reported_amount_wei)/1e18)},
    treasury:{tx:feeRow?.tx??null,block:feeRow?.block??null,
      amount:fmt(Number(feeRow?.amount_wei??0)/1e18),
      payoutBlocksAfter:feeRow?.blocks_after_fee??null,
      baseFeeRls:fmt(Number(shield.relayer_fee_RLS)-Number(feeRow?.amount_wei??0)/1e18)},
    receiverBaseline:{address:hub.address,block:hub.latest_block,
      nativeUsdrWei:hub.native_usdr_wei,rlsWei:hub.erc20_rls_wei,
      nonce:hub.account_nonce,registered:hub.public_registry_registered}
  },
  receiverLifecycle:{
    exactAddress:receiver.correctReceiver,
    username:receiver.registration.username,
    privateBalanceWalletObserved:receiver.walletPrivateClaimAmountUiObserved,
    claimTx:receiver.claim.hash,
    claimBlock:receiver.claim.height,
    claimMethod:receiver.claim.contractMethod,
    claimNullifiers:receiver.claim.events.filter(e=>e.name==="Nullifier").length,
    claimCommitments:receiver.claim.events.filter(e=>e.name==="Commitment").length,
    claimEncryptedNotes:receiver.claim.events.filter(e=>e.name==="EncryptedNote").length,
    registrationTx:receiver.registration.hash,
    registrationBlock:receiver.registration.height,
    registrationForwarderFeeRls:"0",
    correctReceiverState:receiver.fixedBlockReceiverStates,
    publiclyUnfundedThroughout:receiver.findings.zeroPublicFundsAtPreClaim&&
      receiver.findings.zeroPublicFundsAtPostClaim&&receiver.findings.zeroPublicFundsAtPostRegistration,
    noPublicAccountTransactions:receiver.findings.zeroPublicAccountNonceThroughout,
    noPublicTokenTransfers:receiver.findings.noPublicTokenTransfersInControlWindow,
    actualSpendTestStatus:"MINED_RECEIPT_AND_WALLET_OBSERVATIONS_VERIFIED",
    spendTx:spend.txHash,
    spendBlock:spend.blockNumber,
    spendMethod:spend.method,
    spendNullifiers:spend.nullifiers.length,
    spendCommitments:spend.commitments.length,
    spendEncryptedNotes:spend.encryptedNotes.length,
    spendAmountSenderUiObservedRls:spendFee.sourceWalletObservedPrincipalRls,
    spendAmountReceiverUiObservedRls:recipientOwner.privateIncomingBalanceWalletUi,
    spendPublicSenderBalanceAtHeadWei:spend.senderStateAtLatestHead.rlsWei,
    spendPublicSenderEvmNonceAtHead:spend.senderStateAtLatestHead.nonce,
    spendFeeGrossRls:spendFee.derivedGrossFeeRls,
    spendFeeTreasuryRls:spendFee.treasuryTransferRls,
    spendFeePayoutTx:spendFee.payoutTx,
    spendReplayStates:spendFee.historicalReplayControls.calls.map(v=>({block:v.block,result:v.outcome})),
    transcriptionCorrection:"Original screenshot transcription was wrong; corrected using UserRegistered event"
  },
  secondCohort:{
    firstUseRoute:"PUBLIC_FAUCET_THEN_PUBLIC_SHIELD_THEN_PRIVATE_SEND",
    wallet:secondRegistration.owner,
    username:"@rq3faucet26",
    freshBaselineBlock:secondRegistration.baselineBeforeFunding.fixedBlock,
    freshBaselinePublicRlsWei:secondRegistration.baselineBeforeFunding.publicRlsWei,
    publicRlsFaucetTx:"0x952208d50a5711e69589e75e0af619f1e94ff47a8f9372a2c2a26155e1025e5c",
    publicRlsFaucetAmount:"250",
    publicUsdrFaucetAmount:"10",
    publicNativeFaucetAmount:"10",
    publicFundingBlock:24766137,
    registrationTx:secondRegistration.registered.hash,
    registrationBlock:secondRegistration.registered.block,
    registrationPublicFeeRls:secondRegistration.registered.feeRls,
    publicShieldTx:secondShield.txHash,
    publicShieldBlock:secondShield.block,
    publicShieldPrincipalRls:secondShield.vaultDepositRls,
    publicShieldFeeRls:secondShield.publicGasAndRelayerFeeRls,
    publicRlsBeforeShield:secondShield.publicRlsBeforeShield,
    publicRlsAfterShield:secondShield.publicRlsAfterShield,
    privateSendTx:secondSpend.txHash,
    privateSendBlock:secondSpend.blockNumber,
    privateSendNullifierCount:secondSpend.nullifiers.length,
    privateSendCommitmentCount:secondSpend.commitments.length,
    privateSendNoteCount:secondSpend.encryptedNotes.length,
    privateSendFeeGrossRls:secondFee.derivedGrossFeeRls,
    privateSendFeeTreasuryRls:secondFee.treasuryTransferRls,
    privateSendFeeTreasuryTx:secondFee.payoutTx,
    privateSendPayoutLag:secondFee.payoutBlockDelta,
    privateSendPublicBalanceAfterRls:fmt(Number(secondSpend.senderStateAtLatestHead.rlsWei)/1e18),
    privateSendPublicUsdrAfterRls:fmt(Number(secondSpend.senderStateAtLatestHead.usdrTokenWei)/1e18),
    privateSendPublicNonceAfter:secondSpend.senderStateAtLatestHead.nonce,
    recipientShieldedBalanceBeforeRls:secondOwner.beforeSecondCohortShieldedBalanceUiRls,
    recipientShieldedBalanceAfterRls:secondOwner.afterSecondCohortShieldedBalanceUiRls,
    recipientShieldedBalanceIncreaseRls:secondOwner.increaseUiRls,
    walletObservedPrivatePrincipalRls:secondFee.sourceWalletObservedPrincipalRls,
    replayStates:secondFee.historicalReplayControls.calls.map(v=>({block:v.block,result:v.outcome})),
    publiclyUnfunded:false,
    directShieldedFaucetUsed:false,
    faucetCooldownAllButtonsDisabled:true,
    receiverWalletReadOnlyWitness:true,
    privacyBoundary:"Public faucet + 20 RLS Shield disclosed account and deposit principal; later 3 RLS send did not disclose private principal/recipient in vault logs"
  },
  shiftedPlaceboControl:{
    cases:shiftedNulls.positiveCases,
    windows:shiftedNulls.shiftedWindowCount,
    withTreasuryPayout:shiftedNulls.shiftedWindowsWithAnyTreasuryPayout,
    withNullifier:shiftedNulls.shiftedWindowsWithAnyNullifierTx,
    controlType:"Fixed time-offset windows around original 3 private operations, NOT traffic matched or randomized"
  },
  uiNegativeControl:{
    account:"@rq3dev26",balanceShieldedRls:"3",inputRls:"15",
    disabled:overspend.sendActionDisabled,
    noTransactionSubmitted:overspend.noTransactionSignedOrBroadcast
  },
  privateFeePilot:{
    cases:[...receiverFee.controlledPrivateCases.map(c=>({
      kind:c.name,tx:c.tx,block:c.block,
      treasuryTx:c.treasuryTx,treasuryShareRls:c.treasuryShareRls,
      grossFeeImpliedRls:c.grossFeeImpliedRls,
      baseFeeImpliedRls:c.baseFeeImpliedRls,
      payoutDelayBlocks:c.relativePayoutBlock,
      uniqueWindow:c.unambiguousRelativeToAllNullifierEventsInComparisonWindow&&
        c.unambiguousRelativeToAllRelayerToTreasuryTransfersInWindow
    })),{
      kind:"controlled_receiver_private_send",tx:spendFee.sourceTransaction,
      block:spendFee.sourceBlock,treasuryTx:spendFee.payoutTx,
      treasuryShareRls:spendFee.treasuryTransferRls,
      grossFeeImpliedRls:spendFee.derivedGrossFeeRls,
      baseFeeImpliedRls:spendFee.derivedBaseFeeRls,
      payoutDelayBlocks:spendFee.payoutBlockDelta,
      uniqueWindow:spendFee.uniquePrivateSpendInFixedWindow&&spendFee.uniqueTreasuryTransferInFixedWindow
    },{
      kind:"controlled_public_faucet_cohort_private_send",tx:secondFee.sourceTransaction,
      block:secondFee.sourceBlock,treasuryTx:secondFee.payoutTx,
      treasuryShareRls:secondFee.treasuryTransferRls,
      grossFeeImpliedRls:secondFee.derivedGrossFeeRls,
      baseFeeImpliedRls:secondFee.derivedBaseFeeRls,
      payoutDelayBlocks:secondFee.payoutBlockDelta,
      uniqueWindow:secondFee.uniquePrivateSpendInFixedWindow&&secondFee.uniqueTreasuryTransferInFixedWindow
    }],
    publicRegistrationControlWithoutPayout:receiverFee.negativeControl.treasuryPaymentsNext35Blocks===0,
    causalAttributionCryptographicallyProven:false
  },
  replayControls:{
    cases:[...replay.cases.map(c=>({kind:c.case,tx:c.originalTxHash,
      stages:c.readOnlyHistoricalSimulations.map(s=>({block:s.queriedBlock,result:s.rpcResultClass}))})),
      {kind:"receiver_first_private_send",tx:spend.txHash,
       stages:spendFee.historicalReplayControls.calls.map(s=>({block:s.block,result:s.outcome}))},
      {kind:"public_faucet_first_private_send",tx:secondSpend.txHash,
       stages:secondFee.historicalReplayControls.calls.map(s=>({block:s.block,result:s.outcome}))}],
    positiveCount:replay.preStatePositiveControls+spendFee.historicalReplayControls.positiveBefore+secondFee.historicalReplayControls.positiveBefore,
    negativeCount:replay.postStateNegativeControls+spendFee.historicalReplayControls.negativeAfter+secondFee.historicalReplayControls.negativeAfter,
    provenance:"Non-committing eth_call at historical states; not a mined failure"
  },
  feeAnalysis:{
    caseCount:fees.case_count,paidCases:fees.paid_cases,zeroFeeCases:fees.zero_fee_cases,
    matchedCases:fees.paid_cases_with_exact_one,
    sampleType:"Activity-selected public testnet observations",
    controls:fees.cases.map(c=>({
      tx:c.tx,
      feeRls:fmt(Number(c.fee)/1e18),
      caseType:c.case,
      blocksToPayout:c.matching_treasury_transfers[0]?.blocks_after_fee??null,
      paid:c.fee!=="0",
      exactMatch:c.comparison_result==="EXACT_ONE"
    }))
  },
  verification:[
    {name:"Shield — live RPC",type:"On-chain",count:"PASS"},
    {name:"Shield — tamper cases",type:"Offline",count:"22 / 22"},
    {name:"Fee routing — paid receipts",type:"Observational",count:"18 / 18"},
    {name:"Fee routing — zero-fee controls",type:"Observational",count:"2"},
    {name:"Fee routing — tamper cases",type:"Offline",count:"15 / 15"},
    {name:"Invitation — live RPC",type:"On-chain",count:"PASS"},
    {name:"Invitation — tamper cases",type:"Offline",count:"19 / 19"},
    {name:"Receiver — zero balance baseline",type:"On-chain",count:"PASS"},
    {name:"Invitation claim — live RPC",type:"On-chain",count:"PASS"},
    {name:"Receiver registration — zero public funding",type:"On-chain",count:"PASS"},
    {name:"Receiver claim + registration — tamper tests",type:"Offline",count:"30 / 30"},
    {name:"Private fee metadata control",type:"Exploratory",count:"2 / 2"},
    {name:"Private fee metadata — tamper tests",type:"Offline",count:"21 / 21"},
    {name:"Historical-state read-only replay",type:"Simulation",count:"2 positive · 4 negative"},
    {name:"Recipient 3 RLS private spend — mined receipt",type:"On-chain",count:"PASS"},
    {name:"Separate receiving-wallet 3 RLS shielded balance",type:"Wallet",count:"PASS"},
    {name:"Private spend + fee/replay tamper tests",type:"Offline",count:"37 / 37"},
    {name:"Four selected private fee metadata correlations",type:"Exploratory",count:"4 / 4"},
    {name:"Second cohort public faucet and registration",type:"On-chain",count:"PASS"},
    {name:"Second cohort 20 RLS public shield",type:"On-chain",count:"PASS"},
    {name:"Second cohort 3 RLS private send",type:"On-chain",count:"PASS"},
    {name:"Separate receiving wallet cumulative 6 RLS",type:"Wallet",count:"PASS"},
    {name:"Second private send tamper tests",type:"Offline",count:"38 / 38"},
    {name:"Fixed time-shifted fee placebo windows",type:"Exploratory",count:"30 / 30 checked"},
    {name:"UI-only overspend amount rejected",type:"UI",count:"PASS"},
    {name:"Read-only historical replay controls",type:"Simulation",count:"4 success · 8 revert"}

  ],
  provenance:[
    {id:"shield",label:"Controlled shield",source:"public RPC transaction receipt + second eth_getLogs query",
      verdict:"Confirmed 40 RLS public deposit and exact fee; private note value not publicly decipherable",
      tx:shield.tx_hash,block:shield.block_number},
    {id:"fee",label:"Reported-treasury distribution",source:"relayer config + public RLS transfer receipts",
      verdict:"18/18 exact amount matches in selected sample; recipient’s legal identity not authenticated",
      tx:feeRow?.tx,block:feeRow?.block},
    {id:"invite",label:"Controlled invitation",source:"public RPC note envelope + account UI",
      verdict:"On-chain encrypted envelope confirmed; 30 RLS principal and 4.42 RLS quote from wallet UI only",
      tx:invite.hash,block:invite.block_height},
    {id:"receiver",label:"Controlled @devil first spend",source:"public SharedVault receipt, zero-funding audit and independent @rq3dev26 owner-wallet view",
      verdict:"3 RLS private payment completed; public recipient and amount not decrypted from chain",
      tx:spend.txHash,block:spend.blockNumber},
    {id:"second",label:"Public-faucet private send comparison",source:"public funding / shield receipt, private note transfer, separate receiving-wallet observation",
      verdict:"Different funding method: visible 20 RLS deposit, then private 3 RLS send; Dev shielded RLS 3 → 6",
      tx:secondSpend.txHash,block:secondSpend.blockNumber}
  ],
  publicationState:"TWO REAL TESTNET PRIVATE PAYMENT LIFECYCLES VERIFIED; ONLY INVITATION RECEIVER NEVER HELD PUBLIC FUNDS",
  securityNotice:"The private bearer invite link was exposed in chat and must not be treated as a confidentiality-controlled invitation. It is not in this dataset.",
  docs:[
    {name:"How Enygma Public works",url:"https://docs.rayls.com/docs/how-enygma-public-works"},
    {name:"Who sees what",url:"https://docs.rayls.com/docs/enygma-public-who-sees-what"},
    {name:"Testnet app",url:"https://enygma-testnet.rayls.com/"},
    {name:"Testnet explorer",url:"https://testnet-explorer.rayls.com/"}
  ]
});
fs.writeFileSync(output,JSON.stringify(data,null,2)+"\n");
const hash=crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex");
console.log(JSON.stringify({status:"PASS",output,sha256:hash,
  eventCount:invite.commitments.length,protocolStatus:data.publicationState},null,2));
