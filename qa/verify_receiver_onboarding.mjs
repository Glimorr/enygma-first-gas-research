/**
 * Rayls Quest 3 — two-stage invitation claim and private-funded registry onboarding.
 * READ-ONLY. Public RPC, explorer corroboration, no claim link or wallet secret.
 * Also quarantines the initial wrong-address transcription in a correction register.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,formatUnits,zeroPadValue}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const C={
 addr:"0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C",
 incorrectTranscription:"0x665E88A2867Cb53d05C1381D565e19Da0bC3e76C",
 preClaim:24747863,
 claim:"0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec",
 register:"0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b",
 username:"devil",
 RLS:inv.contract_inventory.RLS.address,
 USDR:inv.contract_inventory.USDr.address,
 Vault:inv.contract_inventory.SharedVault.address,
 Registry:inv.contract_inventory.UserRegistry.address,
 Forwarder:inv.relayer_report.active_forwarder,
 Relayer:inv.relayer_report.relayer_address
};
const ABI={
 vault:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/SharedVaultImplementation.json","utf8"))),
 registry:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8"))),
 forwarder:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json","utf8"))),
 erc20:new Interface(["function balanceOf(address) view returns (uint256)","event Transfer(address indexed from,address indexed to,uint256 value)"])
};
const norm=a=>String(a??"").toLowerCase();
const ensure=(v,s)=>{if(!v)throw Error("RECEIVER_VERIFICATION_FAILURE: "+s)};
const retry=async(fn)=>{let err;for(let i=0;i<3;i++)try{return await fn()}catch(e){err=e;await new Promise(r=>setTimeout(r,400*(i+1)))}throw err};
const rpc=async(method,params=[])=>retry(async()=>{
 const r=await fetch("https://testnet-rpc.rayls.com/",{method:"POST",
  headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3Verification/1.1"},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(22000)});
 if(!r.ok)throw Error(method+" HTTP "+r.status);
 const obj=await r.json();
 if(obj.error)throw Error(method+" "+JSON.stringify(obj.error));
 return obj.result;
});
const explorer=async(path)=>retry(async()=>{
 const r=await fetch("https://testnet-explorer.rayls.com/api/v2"+path,{signal:AbortSignal.timeout(22000)});
 if(!r.ok)throw Error(path+" HTTP "+r.status);
 return await r.json();
});
const toHex=n=>"0x"+n.toString(16);
const balance=async(token,block)=>BigInt(ABI.erc20.decodeFunctionResult("balanceOf",
 await rpc("eth_call",[{to:token,data:ABI.erc20.encodeFunctionData("balanceOf",[C.addr])},toHex(block)]))[0]);
const native=async(block)=>BigInt(await rpc("eth_getBalance",[C.addr,toHex(block)]));
const nonce=async(block)=>Number(BigInt(await rpc("eth_getTransactionCount",[C.addr,toHex(block)])));
const registered=async(block)=>Boolean(ABI.registry.decodeFunctionResult("isRegistered",
 await rpc("eth_call",[{to:C.Registry,data:ABI.registry.encodeFunctionData("isRegistered",[C.addr])},toHex(block)]))[0]);
const readTx=async(hash)=>{
 const rec=await rpc("eth_getTransactionReceipt",[hash]),tx=await rpc("eth_getTransactionByHash",[hash]);
 ensure(rec&&tx,"receipt or tx missing "+hash);
 const block=await rpc("eth_getBlockByNumber",[rec.blockNumber,true]);
 ensure(block,"block missing");
 ensure(rec.status==="0x1","receipt status not successful");
 ensure(norm(rec.transactionHash)===norm(hash)&&norm(tx.hash)===norm(hash),"tx hash mismatch");
 ensure(norm(rec.blockHash)===norm(block.hash)&&norm(tx.blockHash)===norm(block.hash),"block hash mismatch");
 ensure(block.transactions.some(t=>norm(t.hash)===norm(hash)),"missing block inclusion");
 const logs=await rpc("eth_getLogs",[{fromBlock:rec.blockNumber,toBlock:rec.blockNumber,
  address:[C.RLS,C.USDR,C.Vault,C.Registry,C.Forwarder]}]);
 const match=logs.filter(l=>norm(l.transactionHash)===norm(hash));
 ensure(match.length===rec.logs.length,"second RPC log count mismatch");
 for(const l of rec.logs)ensure(match.some(m=>m.logIndex===l.logIndex&&norm(m.data)===norm(l.data)&&
   norm(m.address)===norm(l.address)&&JSON.stringify(m.topics.map(norm))===JSON.stringify(l.topics.map(norm))),
   "independent log bytes mismatch");
 return {height:Number(BigInt(rec.blockNumber)),tx,receipt:rec,
   header:{number:block.number,hash:block.hash,timestamp:block.timestamp,parentHash:block.parentHash,
    transaction_hashes:block.transactions.map(t=>t.hash)},
   logs_from_independent_query:match};
};
const claim=await readTx(C.claim),registration=await readTx(C.register);
ensure(claim.height===24747924&&registration.height===24748136,"unrecognized fixed blocks");
ensure(C.preClaim<claim.height&&claim.height<registration.height,"invalid chronology");
ensure(norm(claim.tx.to)===norm(C.Vault),"claim not to vault");
ensure(norm(registration.tx.to)===norm(C.Forwarder),"registration not to active forwarder");
ensure(norm(claim.tx.from)===norm(C.Relayer)&&norm(registration.tx.from)===norm(C.Relayer),"unexpected public relayer");
const method=ABI.vault.parseTransaction({data:claim.tx.input});
ensure(method.name==="transferV2","claim not transferV2");
ensure(Number(method.args[0].numberOfInputs)===1&&Number(method.args[0].numberOfOutputs)===3,
  "unexpected proof 1 input / 3 output pattern");
const events={claim:[],registration:[]};
for(const [name,obj] of [["claim",claim],["registration",registration]]){
 for(const log of obj.receipt.logs){
  const addr=norm(log.address);
  const iface=addr===norm(C.Vault)?ABI.vault:addr===norm(C.Registry)?ABI.registry:
    addr===norm(C.Forwarder)?ABI.forwarder:addr===norm(C.RLS)||addr===norm(C.USDR)?ABI.erc20:null;
  ensure(iface!==null,"unknown log contract "+log.address);
  const parsed=iface.parseLog(log);
  ensure(Boolean(parsed),"undecodable event");
  const e={name:parsed.name,contract:log.address,index:Number(BigInt(log.logIndex))};
  if(parsed.name==="Nullifier"){
    Object.assign(e,{vaultId:parsed.args.vaultId.toString(),treeNumber:parsed.args.treeNumber.toString(),
      nullifier:parsed.args.nullifier.toString()});
  }else if(parsed.name==="Commitment"){
    Object.assign(e,{vaultId:parsed.args.vaultId.toString(),commitment:parsed.args.commitment.toString()});
  }else if(parsed.name==="EncryptedNote"){
    Object.assign(e,{vaultId:parsed.args.vaultId.toString(),commitment:parsed.args.commitment.toString(),
      ciphertextIBytes:(parsed.args.ciphertextI.length-2)/2,
      ciphertextIIBytes:(parsed.args.ciphertextII.length-2)/2});
  }else if(parsed.name==="UserRegistered"){
    Object.assign(e,{user:parsed.args.user,
      publicSpendKey:parsed.args.pkSpend.toString(),
      publicViewKeyBytes:(parsed.args.pkView.length-2)/2,
      mlKemAuditCiphertextBytes:(parsed.args.mlKemAuditCt.length-2)/2,
      aesAuditCiphertextBytes:(parsed.args.aesAuditCt.length-2)/2});
  }else if(parsed.name==="UsernameSet"){
    Object.assign(e,{user:parsed.args.user,username:parsed.args.username});
  }else if(parsed.name==="Relayed"){
    Object.assign(e,{from:parsed.args.from,to:parsed.args.to,relayer:parsed.args.relayer,
      nonce:parsed.args.nonce.toString(),feeWei:parsed.args.fee.toString()});
  }else if(parsed.name==="Transfer"){
    Object.assign(e,{from:parsed.args.from,to:parsed.args.to,amountWei:parsed.args.value.toString()});
  }
  events[name].push(e);
 }
}
const count=(area,n)=>events[area].filter(x=>x.name===n).length;
ensure(events.claim.length===7&&count("claim","Nullifier")===1&&
 count("claim","Commitment")===3&&count("claim","EncryptedNote")===3,"claim event counts");
const matches=new Set(events.claim.filter(x=>x.name==="Commitment").map(x=>x.commitment));
ensure(events.claim.filter(x=>x.name==="EncryptedNote").every(x=>
 matches.has(x.commitment)&&x.ciphertextIBytes===1088&&x.ciphertextIIBytes===92),
 "claim encrypted note matching");
ensure(events.registration.length===3&&count("registration","UserRegistered")===1&&
 count("registration","UsernameSet")===1&&count("registration","Relayed")===1,
 "registration event counts");
const user=events.registration.find(x=>x.name==="UserRegistered"),
 uname=events.registration.find(x=>x.name==="UsernameSet"),
 relay=events.registration.find(x=>x.name==="Relayed");
ensure(norm(user.user)===norm(C.addr)&&norm(uname.user)===norm(C.addr)&&uname.username===C.username,
  "registered username/address mismatch");
ensure(norm(relay.from)===norm(C.addr)&&norm(relay.to)===norm(C.Registry)&&
  norm(relay.relayer)===norm(C.Relayer)&&relay.feeWei==="0",
  "registration forwarded from wrong account or charged public fee");
ensure(!events.claim.some(x=>x.name==="Transfer")&&!events.registration.some(x=>x.name==="Transfer"),
 "unexpected transparent ERC20 transfers in claim/registration");
const points=[
 ["pre_claim",C.preClaim],
 ["claim_before",claim.height-1],["claim_after",claim.height],
 ["registration_before",registration.height-1],["registration_after",registration.height],
 ["latest",Number(BigInt(await rpc("eth_blockNumber")))]
];
const state={};
for(const [name,height] of points){
 const [rls,usdr,nat,nn,reg]=await Promise.all([
   balance(C.RLS,height),balance(C.USDR,height),native(height),nonce(height),registered(height)]);
 state[name]={block:height,rlsWei:rls.toString(),usdrTokenWei:usdr.toString(),
   nativeWei:nat.toString(),accountNonce:nn,registered:reg};
}
for(const key of Object.keys(state)){
 const s=state[key];
 ensure(s.rlsWei==="0"&&s.usdrTokenWei==="0"&&s.nativeWei==="0"&&s.accountNonce===0,
   key+" public account funds/nonce unexpectedly changed");
}
ensure(!state.pre_claim.registered&&!state.claim_before.registered&&!state.claim_after.registered&&
 !state.registration_before.registered&&state.registration_after.registered&&state.latest.registered,
 "registry state chronology does not match claim vs registration");
const transfers=[];
const transferTopic=ABI.erc20.getEvent("Transfer").topicHash;
const accountTopic=zeroPadValue(C.addr,32);
for(const token of [C.RLS,C.USDR]){
 for(const topics of [[transferTopic,null,accountTopic],[transferTopic,accountTopic]]){
  for(let start=C.preClaim;start<=state.latest.block;start+=350){
   const found=await rpc("eth_getLogs",[{address:token,topics,
     fromBlock:toHex(start),toBlock:toHex(Math.min(start+349,state.latest.block))}]);
   for(const l of found)transfers.push({token,tx:l.transactionHash,block:Number(BigInt(l.blockNumber)),
     from:l.topics[1],to:l.topics[2],amountWei:BigInt(l.data).toString()});
  }
 }
}
ensure(transfers.length===0,"transparent token transfers involving claim receiver");
const history={};
for(const route of ["transactions","token-transfers"]){
 const res=await explorer("/addresses/"+C.addr+"/"+route);
 history[route]={count:(res.items??[]).length,paginated:res.next_page_params!==null};
 ensure(history[route].count===0&&!history[route].paginated,route+" nonempty public explorer history");
}
const results={
 evidence_class:"USER_CONTROLLED_PRIVATE_INVITE_CLAIM_AND_FUNDS_FREE_REGISTRATION_VERIFIED",
 capturedAtUtc:new Date().toISOString(),chainId:Number(BigInt(await rpc("eth_chainId"))),
 correctReceiver:C.addr,
 correctedFromScreenshotTranscription:C.incorrectTranscription,
 correction:"Previous pre-claim snapshots used an incorrect 0x665E88... transcription. They do not prove the actual recipient's baseline. This verifier establishes the correct 0x665E08... account at historical block 24747863 before both actual transactions.",
 walletPrivateClaimAmountUiObserved:"17.304 RLS",
 walletPrivateClaimPrincipalUiObserved:"30 RLS",
 amountsVisibleOnPublicClaimReceipt:false,
 invitationLinkUsed:false,
 claim:{hash:C.claim,...claim,events:events.claim,contractMethod:method.name,
  inputCount:Number(method.args[0].numberOfInputs),outputCount:Number(method.args[0].numberOfOutputs)},
 registration:{hash:C.register,...registration,events:events.registration,
  registeredAddress:user.user,username:uname.username,forwarderFeeWei:relay.feeWei},
 fixedBlockReceiverStates:state,publicTokenTransfersInFullControlWindow:transfers,
 explorerHistory:history,
 findings:{
  zeroPublicFundsAtPreClaim:true,
  zeroPublicFundsAtPostClaim:true,
  zeroPublicFundsAtPostRegistration:true,
  zeroPublicAccountNonceThroughout:true,
  noPublicTokenTransfersInControlWindow:true,
  registryFalseBeforeAndTrueAfter:true,
  claimEncryptedNoteEventTopologyVerified:true,
  directPublicFeeZeroInRegistrationForwarderEvent:true,
  privateBalanceObservedViaOfficialWalletOnly:true,
  invitationClaimPublicChainReceiptDoesNotNameRecipient:true
 },
 caveats:[
  "This is the first researcher-controlled invitation claim and registry lifecycle, not yet an outgoing private spend from this recipient.",
  "The exact receiver EVM address is derived from UserRegistered logs, correcting a 0x665E88 vs 0x665E08 transcription error in earlier screenshot-baseline captures.",
  "Public RPC proves a shielded transfer envelope and later public registry registration; attribution of the envelope to recipient/17.304 RLS requires owner wallet observation and chronology, not a cleartext transaction field.",
  "Zero public RLS, USDr, nonce and RLS/USDr transfer history is verified only for this Rayls public testnet/account and specified interval. No claim about other tokens/third-party funding mechanisms or other networks.",
  "The user's one-time invitation claim link was pasted into chat; this is an exposed-link pilot rather than a confidential-delivery trial.",
  "The zero RLS fee in the registration Forwarder event does not imply zero economic cost; shielding fees were funded from the private invitation according to the wallet UI."
 ]
};
ensure(results.chainId===7295799,"chain ID mismatch");
const out=root+"/evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json";
fs.writeFileSync(out,JSON.stringify(results,null,2)+"\n");
const correction={observedAtUtc:new Date().toISOString(),incorrectAddress:C.incorrectTranscription,
 correctAddress:C.addr,source:"On-chain UserRegistered and UsernameSet event",
 originalFilesNotRewritten:[
 "evidence/public-rpc/controlled/receiver-passkey-preclaim-baseline.json",
 "evidence/public-rpc/controlled/receiver-postclaim-preregistration-observed.json"
 ],status:"SUPERSEDED_WRONG_ADDRESS_NOT_VALID_RECEIVER_BASELINES",
 correctedEvidenceFile:"evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json"};
fs.writeFileSync(root+"/evidence/public-rpc/controlled/receiver-address-correction.json",
 JSON.stringify(correction,null,2)+"\n");
console.log(JSON.stringify({status:"PASS",receiver:C.addr,claimTx:C.claim,claimBlock:claim.height,
 registrationTx:C.register,registrationBlock:registration.height,username:uname.username,
 registrationForwarderFeeWei:relay.feeWei,registeredBefore:state.pre_claim.registered,
 registeredAfter:state.registration_after.registered,
 publicFungibleBalancesAlwaysZero:true,
 publicTokenTransfersAcrossInterval:transfers.length,explorerHistory:history,
 allChecks:Object.values(results.findings).length,correctedScreenshotTranscription:true,
 saved:out},null,2));
