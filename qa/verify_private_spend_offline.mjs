/**
 * Frozen evidence validator for the actual Rayls Quest 3 receiver-originated
 * private spend, associated selected public fee payout, and historical replay.
 * Offline consistency only, not fresh RPC. No wallet keys/signing/bearer links.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const ABI=new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8")));
const transfer="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const norm=x=>String(x??"").toLowerCase();
const pad=x=>"0x"+x.slice(2).toLowerCase().padStart(64,"0");
const txHash="0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8";
const payoutHash="0xd639df4cd7d62ea031a313ec5b3b9f6b46241aebe599b29867bf7a3e7302bb32";
const sender="0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C";
export function validate(spend,fee){
 const errors=[],check=(value,label)=>{if(!value)errors.push(label)};
 try{
 check(spend.chainId===7295799&&fee.chainId===7295799,"chain");
 check(norm(spend.txHash)===norm(txHash)&&norm(fee.sourceTransaction)===norm(txHash),"spend.hash");
 check(norm(spend.originalControlledSender)===norm(sender),"spend.senderOwner");
 check(norm(spend.expectedControlledRecipient)===norm("0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6"),"spend.expectedRecipient");
 const tx=spend.rawPublicTx, rec=spend.rawPublicReceipt, hdr=spend.blockHeader;
 check(norm(tx.hash)===norm(txHash)&&norm(rec.transactionHash)===norm(txHash),"spend.rawTxHash");
 check(norm(rec.blockHash)===norm(hdr.hash)&&norm(tx.blockHash)===norm(hdr.hash)
   &&norm(spend.blockHash)===norm(hdr.hash),"spend.blockHash");
 check(hdr.txHashes.includes(txHash),"spend.blockInclusion");
 check(Number(BigInt(rec.blockNumber))===24760126&&spend.blockNumber===24760126,"spend.blockHeight");
 check(Number(BigInt(rec.status))===1&&spend.receiptStatus===1,"spend.receiptStatus");
 check(norm(tx.to)===norm(inv.contract_inventory.SharedVault.address)
    &&norm(spend.contract)===norm(tx.to),"spend.vaultTarget");
 check(norm(tx.from)===norm(inv.relayer_report.relayer_address),"spend.relayer");
 const method=ABI.parseTransaction({data:tx.input});
 check(method.name==="transferV2"&&spend.method==="transferV2","spend.method");
 check(Number(method.args[0].numberOfInputs)===1&&Number(method.args[0].numberOfOutputs)===3,"spend.proofTopology");
 const notes=[],commits=[],nulls=[];
 for(const l of rec.logs){
  const p=ABI.parseLog(l);
  check(norm(l.address)===norm(spend.contract)&&norm(l.transactionHash)===norm(txHash),"spend.eventAddress");
  if(p.name==="Nullifier")nulls.push({index:Number(BigInt(l.logIndex)),v:p.args.nullifier.toString()});
  else if(p.name==="Commitment")commits.push({index:Number(BigInt(l.logIndex)),v:p.args.commitment.toString(),
    vault:p.args.vaultId.toString()});
  else if(p.name==="EncryptedNote")notes.push({index:Number(BigInt(l.logIndex)),v:p.args.commitment.toString(),
    vault:p.args.vaultId.toString(),I:(p.args.ciphertextI.length-2)/2,II:(p.args.ciphertextII.length-2)/2});
  else check(false,"spend.unexpectedEvent");
 }
 check(nulls.length===1&&commits.length===3&&notes.length===3&&rec.logs.length===7,"spend.logTopology");
 check(notes.every(n=>commits.some(c=>n.v===c.v&&n.vault===c.vault)&&n.I===1088&&n.II===92),"spend.noteMatch");
 check(spend.nullifiers?.length===1&&spend.commitments?.length===3&&spend.encryptedNotes?.length===3,"spend.savedCounts");
 check(nulls.every(n=>spend.nullifiers.some(v=>v.index===n.index&&v.nullifier===n.v)),"spend.savedNullifiers");
 check(commits.every(c=>spend.commitments.some(v=>v.index===c.index&&v.commitment===c.v)),"spend.savedCommitments");
 check(notes.every(n=>spend.encryptedNotes.some(v=>v.index===n.index&&v.commitment===n.v&&
   v.ctIBytes===n.I&&v.ctIIBytes===n.II)),"spend.savedNotes");
 check(spend.separateEthGetLogs?.length===rec.logs.length,"spend.secondLogCount");
 for(const l of rec.logs)check(spend.separateEthGetLogs.some(m=>m.logIndex===l.logIndex&&
  norm(m.data)===norm(l.data)&&norm(m.address)===norm(l.address)&&
  JSON.stringify(m.topics.map(norm))===JSON.stringify(l.topics.map(norm))),"spend.secondLogBytes");
 for(const value of [spend.senderStateAtLatestHead,spend.senderStateBeforeSpend,spend.senderStateAfterSpend]){
  if(!value)continue;
  check(value.rlsWei==="0"&&value.usdrTokenWei==="0"&&value.nativeWei==="0"&&value.nonce===0,
    "spend.publicFunding");
 }
 check(spend.transparentRlsUsdrTransfersInControlledSenderWindow?.length===0,"spend.publicTransfers");
 check(spend.recipientIdentityPubliclyRevealedByReceipt===false&&
   spend.privatePrincipalPubliclyRevealedByReceipt===false,"spend.privateVisibility");
 // Public selected payout metadata against separately authenticated transaction bytes.
 const pr=fee.rawPublicEvidence.payoutReceipt,pt=fee.rawPublicEvidence.payoutTx,
  ph=fee.rawPublicEvidence.payoutHeader,pl=fee.rawPublicEvidence.payoutTransferLog;
 check(norm(fee.payoutTx)===norm(payoutHash)&&norm(pr.transactionHash)===norm(payoutHash)
   &&norm(pt.hash)===norm(payoutHash),"fee.txHash");
 check(pr.status==="0x1"&&norm(pr.blockHash)===norm(ph.hash)
   &&norm(pt.blockHash)===norm(ph.hash),"fee.receiptBlock");
 check(Number(BigInt(pr.blockNumber))===24760130&&fee.payoutBlock===24760130
   &&fee.payoutBlockDelta===4,"fee.payoutBlock");
 check(norm(pl.address)===norm(inv.contract_inventory.RLS.address)
    &&pl.topics.length===3&&norm(pl.topics[0])===transfer,"fee.tokenTransfer");
 check(norm(pl.topics[1])===norm(pad(inv.relayer_report.relayer_address)),"fee.fromRelayer");
 check(norm(pl.topics[2])===norm(pad(inv.relayer_report.treasury)),"fee.toTreasury");
 check(norm(pl.transactionHash)===norm(payoutHash)&&
   pr.logs.some(l=>l.logIndex===pl.logIndex&&norm(l.data)===norm(pl.data)&&
   JSON.stringify(l.topics.map(norm))===JSON.stringify(pl.topics.map(norm))),"fee.receiptLogInclusion");
 const amount=BigInt(pl.data);
 check(amount===576000000000000000n&&fee.treasuryTransferWei===String(amount),"fee.amount");
 const gross=amount*115n/15n;
 check(amount*115n%15n===0n&&gross===4416000000000000000n &&
   fee.derivedGrossFeeWei===String(gross)&&fee.derivedBaseFeeWei===String(gross-amount),"fee.exactFormula");
 check(fee.reported15PercentFeeShareFormulaExact===true,"fee.shareClaim");
 check(fee.window.startBlock===24760114&&fee.window.endBlock===24760151,"fee.window");
 check(fee.window.nullifierTransactions.length===1&&
  norm(fee.window.nullifierTransactions[0].hash)===norm(txHash) &&
  fee.window.matchingTreasuryTransfers.length===1&&
  norm(fee.window.matchingTreasuryTransfers[0].hash)===norm(payoutHash),"fee.uniqueCandidates");
 check(fee.uniquePrivateSpendInFixedWindow&&fee.uniqueTreasuryTransferInFixedWindow,"fee.uniquenessClaim");
 check(fee.sourceWalletObservedPrincipalRls==="3"&&fee.sourceWalletDisplayedFeeRlsApprox==="4.42","fee.walletUi");
 check(fee.actualPrivatePrincipalVisibleInPublicRpc===false,"fee.privatePrincipal");
 const h=fee.historicalReplayControls;
 check(h.transactionBroadcasts===0&&h.positiveBefore===1&&h.negativeAfter===2&&h.calls?.length===3,
   "replay.counts");
 check(h.calls?.[0].block===24760125&&h.calls[0].outcome==="SUCCESS"&&
   h.calls?.[1].block===24760126&&h.calls[1].outcome==="REVERT"&&
   h.calls?.[2].block===24760127&&h.calls[2].outcome==="REVERT","replay.beforeAfter");
 }catch(e){errors.push("exception."+String(e).slice(0,230))}
 return errors;
}
if(process.argv[1]?.endsWith("/verify_private_spend_offline.mjs")){
 const s=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/receiver-private-spend-5423d2b13c.json","utf8"));
 const f=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/receiver-private-spend-fee-replay-verified.json","utf8"));
 const errors=validate(s,f),result={status:errors.length?"FAIL":"PASS",
  evidence_class:"FROZEN_PRIVATE_SPEND_ENVELOPE_AND_FEE_CONSISTENCY_NOT_LIVE_RPC",
  checkedUtc:new Date().toISOString(),errors};
 fs.writeFileSync(root+"/qa/private-spend-offline-result.json",JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
}
