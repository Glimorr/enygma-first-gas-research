/**
 * OFFLINE immutable-snapshot consistency validation for a new passkey account:
 * encrypted invitation claim, public registration, and no public funding.
 * THIS DOES NOT RE-AUTHENTICATE THE FROZEN DATA AGAINST LIVE RPC.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const ABI={
 vault:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8"))),
 registry:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8"))),
 forwarder:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json","utf8")))
};
const norm=s=>String(s??"").toLowerCase();
const canonAddr="0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C";
const canonClaim="0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec";
const canonReg="0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b";
export function validate(s){
 const errors=[],check=(c,label)=>{if(!c)errors.push(label)};
 try{
  check(s.evidence_class==="USER_CONTROLLED_PRIVATE_INVITE_CLAIM_AND_FUNDS_FREE_REGISTRATION_VERIFIED","provenance");
  check(s.chainId===7295799,"chainId");
  check(norm(s.correctReceiver)===norm(canonAddr),"receiver.address");
  check(norm(s.claim.hash)===norm(canonClaim),"claim.originalHash");
  check(norm(s.registration.hash)===norm(canonReg),"registration.originalHash");
  for(const stage of ["claim","registration"]){
   const {receipt,tx,header,logs_from_independent_query:logs}=s[stage],id=s[stage].hash;
   check(norm(receipt.transactionHash)===norm(id)&&norm(tx.hash)===norm(id),"tx.hash."+stage);
   check(norm(receipt.blockHash)===norm(header.hash)&&norm(tx.blockHash)===norm(header.hash),
     "tx.blockHash."+stage);
   check(Number(BigInt(receipt.status))===1,"tx.status."+stage);
   check(Number(BigInt(receipt.blockNumber))===s[stage].height&&Number(BigInt(header.number))===s[stage].height,
     "tx.height."+stage);
   check(header.transaction_hashes.some(h=>norm(h)===norm(id)),"tx.inclusion."+stage);
   check(logs.length===receipt.logs.length,"tx.separateLogsCount."+stage);
   for(const l of receipt.logs){
    check(norm(l.transactionHash)===norm(id),"events.txHash."+stage);
    check(logs.some(x=>x.logIndex===l.logIndex&&norm(x.data)===norm(l.data)&&
      norm(x.address)===norm(l.address)&&
      JSON.stringify(x.topics.map(norm))===JSON.stringify(l.topics.map(norm))),
      "events.separateLogsMismatch."+stage);
   }
  }
  const claimed=s.claim;
  check(claimed.height===24747924&&
    norm(claimed.tx.to)===norm(inv.contract_inventory.SharedVault.address),"claim.vault");
  check(norm(claimed.tx.from)===norm(inv.relayer_report.relayer_address),"claim.relayer");
  const proof=ABI.vault.parseTransaction({data:claimed.tx.input});
  check(proof.name==="transferV2"&&claimed.contractMethod==="transferV2","claim.method");
  check(Number(proof.args[0].numberOfInputs)===1&&Number(proof.args[0].numberOfOutputs)===3,
    "claim.proofTopology");
  const fromLog={Nullifier:[],Commitment:[],EncryptedNote:[]};
  for(const l of claimed.receipt.logs){
   check(norm(l.address)===norm(inv.contract_inventory.SharedVault.address),"claim.eventAddress");
   const e=ABI.vault.parseLog(l);
   if(!(e.name in fromLog))check(false,"claim.unknownEvent");
   else fromLog[e.name].push({
     value:String(e.args.nullifier??e.args.commitment),vaultId:String(e.args.vaultId),
     I:e.name==="EncryptedNote"?(e.args.ciphertextI.length-2)/2:null,
     II:e.name==="EncryptedNote"?(e.args.ciphertextII.length-2)/2:null
   });
  }
  check(fromLog.Nullifier.length===1&&fromLog.Commitment.length===3&&
    fromLog.EncryptedNote.length===3,"claim.logTopology");
  const commits=new Set(fromLog.Commitment.map(c=>c.value));
  check(fromLog.EncryptedNote.every(e=>commits.has(e.value)&&e.I===1088&&e.II===92),
    "claim.encryptedNoteMatch");
  check(claimed.events.filter(e=>e.name==="Nullifier").every(e=>
    fromLog.Nullifier.some(x=>x.value===e.nullifier)),"claim.derivedNullifier");
  check(claimed.events.filter(e=>e.name==="Commitment").every(e=>
    fromLog.Commitment.some(x=>x.value===e.commitment)),"claim.derivedCommitment");
  check(claimed.events.filter(e=>e.name==="EncryptedNote").every(e=>
    fromLog.EncryptedNote.some(x=>x.value===e.commitment&&x.I===e.ciphertextIBytes&&
      x.II===e.ciphertextIIBytes)),"claim.derivedEncryptedNotes");
  const registered=s.registration;
  check(registered.height===24748136,"registration.block");
  check(norm(registered.tx.to)===norm(inv.relayer_report.active_forwarder),"registration.forwarder");
  check(norm(registered.tx.from)===norm(inv.relayer_report.relayer_address),"registration.relayer");
  const decoded=[];
  for(const l of registered.receipt.logs){
    const addr=norm(l.address);
    const abi=addr===norm(inv.contract_inventory.UserRegistry.address)?ABI.registry:
      addr===norm(inv.relayer_report.active_forwarder)?ABI.forwarder:null;
    check(!!abi,"registration.unknownEventAddress");
    const e=abi?.parseLog(l);
    check(!!e,"registration.unknownEvent");
    if(e?.name==="UserRegistered")decoded.push({kind:e.name,from:e.args.user,
      spendPublic:e.args.pkSpend.toString(),viewBytes:(e.args.pkView.length-2)/2});
    if(e?.name==="UsernameSet")decoded.push({kind:e.name,from:e.args.user,username:e.args.username});
    if(e?.name==="Relayed")decoded.push({kind:e.name,from:e.args.from,to:e.args.to,
      nonce:String(e.args.nonce),fee:String(e.args.fee),relayer:e.args.relayer});
  }
  check(registered.receipt.logs.length===3&&decoded.length===3,"registration.eventCount");
  const user=decoded.find(e=>e.kind==="UserRegistered"),name=decoded.find(e=>e.kind==="UsernameSet"),
        relay=decoded.find(e=>e.kind==="Relayed");
  check(norm(user?.from)===norm(canonAddr),"registration.userAddress");
  check(norm(name?.from)===norm(canonAddr)&&name?.username==="devil","registration.username");
  check(norm(relay?.from)===norm(canonAddr)&&norm(relay?.to)===
     norm(inv.contract_inventory.UserRegistry.address),"registration.forwardFrom");
  check(relay?.fee==="0"&&registered.forwarderFeeWei==="0","registration.publicFeeZero");
  check(norm(relay?.relayer)===norm(inv.relayer_report.relayer_address),"registration.relayerMatch");
  check(registered.events.find(e=>e.name==="UsernameSet")?.username===name.username,
    "registration.derivedUsername");
  check(registered.events.find(e=>e.name==="UserRegistered")?.user===user.from,
    "registration.derivedUser");
  const state=s.fixedBlockReceiverStates;
  check(state.pre_claim.block===24747863&&state.claim_before.block===24747923&&
    state.claim_after.block===24747924&&state.registration_before.block===24748135&&
    state.registration_after.block===24748136,"states.checkpointBlocks");
  check(Object.values(state).every(v=>v.rlsWei==="0"&&v.usdrTokenWei==="0"&&
    v.nativeWei==="0"&&v.accountNonce===0),"states.zeroPublicBalancesAndNonces");
  check(!state.pre_claim.registered&&!state.claim_before.registered&&!state.claim_after.registered&&
    !state.registration_before.registered&&state.registration_after.registered&&state.latest.registered,
    "states.registrationHistory");
  check(s.publicTokenTransfersInFullControlWindow?.length===0,"states.publicTransfers");
  check(s.explorerHistory?.transactions?.count===0&&s.explorerHistory?.["token-transfers"]?.count===0,
    "states.explorerHistory");
  check(s.walletPrivateClaimAmountUiObserved==="17.304 RLS","wallet.uiNotChain");
  check(s.amountsVisibleOnPublicClaimReceipt===false,"claim.privacyBoundary");
  check(s.invitationLinkUsed===false,"security.noInviteSecret");
  check(norm(s.correctedFromScreenshotTranscription)!==norm(canonAddr),"address.transcriptionCorrection");
 }catch(e){errors.push("exception."+String(e).slice(0,180));}
 return errors;
}
if(process.argv[1]?.endsWith("/verify_receiver_onboarding_offline.mjs")){
 const original=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json","utf8"));
 const errors=validate(original),result={status:errors.length?"FAIL":"PASS",
  evidence_class:"OFFLINE_RECEIVER_ONBOARDING_CONSISTENCY_NOT_LIVE_CHAIN",
  checkedUtc:new Date().toISOString(),errors};
 fs.writeFileSync(root+"/qa/receiver-onboarding-offline-result.json",JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));
 if(errors.length)process.exitCode=1;
}
