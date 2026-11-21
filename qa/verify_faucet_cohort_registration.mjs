/**
 * Public-faucet-first comparison cohort, source-driven live RPC verification.
 * Records exact public RLS, USDr and native funding plus registered account.
 * No wallet credentials, passkeys, signing, or RPC transactions submitted.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,zeroPadValue}=require("ethers");
const root=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const info=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const prior=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-fresh-wallet-preaction-baseline.json","utf8"));
const postFaucet=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-after-default-faucet-before-registration.json","utf8"));
const postRegister=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/controlled/faucet-cohort-post-registration-state.json","utf8"));
const OWNER="0xe1136dCF839c4aD2704094241928Fa2896A118c5";
const TXS={
 nativeUsdr:"0x66ddb33fb227849c301ff08f197e16844376de3f37130ebbacf1bfc9dd471604",
 publicRls:"0x952208d50a5711e69589e75e0af619f1e94ff47a8f9372a2c2a26155e1025e5c",
 registration:"0x0c7419d5d3d334dae29f5e87bdde78481ed61b6ae2907429044b4e56903beb0a"
};
const relayer=info.relayer_report.relayer_address;
const forwarder=info.relayer_report.active_forwarder;
const registry=info.contract_inventory.UserRegistry.address;
const RLS=info.contract_inventory.RLS.address;
const USDR=info.contract_inventory.USDr.address;
const abi={
 user:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/UserRegistryImplementation.json","utf8"))),
 fw:new Interface(JSON.parse(fs.readFileSync(root+"/research/verified-abis/next.json","utf8"))),
 token:new Interface(["event Transfer(address indexed from,address indexed to,uint256 value)",
 "event Approval(address indexed owner,address indexed spender,uint256 value)",
 "function balanceOf(address) view returns(uint256)"])
};
const norm=x=>String(x??"").toLowerCase();
const insist=(x,msg)=>{if(!x)throw Error("FAUCET_COHORT_VERIFY_FAILED "+msg)};
async function rpc(method,params=[]){
 const response=await fetch("https://testnet-rpc.rayls.com/",{method:"POST",
  headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3PublicFaucetCohort/1.0"},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(26000)});
 insist(response.ok,method+" transport "+response.status);
 const j=await response.json();if(j.error)throw Error(method+" "+JSON.stringify(j.error));return j.result;
}
insist(Number(BigInt(await rpc("eth_chainId")))===7295799,"chain ID");
insist(norm(prior.address)===norm(OWNER)&&Number(prior.evmNonce)===0,"before baseline owner/nonce");
insist(["nativeWei","publicRlsWei","publicUsdrWei"].every(x=>prior[x]==="0"),"before baseline zero");
const auth={};
for(const [kind,hash] of Object.entries(TXS)){
 const [tx,receipt]=await Promise.all([rpc("eth_getTransactionByHash",[hash]),rpc("eth_getTransactionReceipt",[hash])]);
 insist(tx&&receipt&&receipt.status==="0x1"&&norm(receipt.transactionHash)===norm(hash),kind+" success");
 const block=await rpc("eth_getBlockByNumber",[receipt.blockNumber,true]);
 insist(block&&norm(block.hash)===norm(receipt.blockHash)&&norm(tx.blockHash)===norm(block.hash)
  &&block.transactions.some(x=>norm(x.hash)===norm(hash)),kind+" block inclusion");
 const independent=await rpc("eth_getLogs",[{fromBlock:receipt.blockNumber,toBlock:receipt.blockNumber,
  address:[RLS,USDR,registry,forwarder]}]);
 const separate=independent.filter(x=>norm(x.transactionHash)===norm(hash));
 insist(receipt.logs.every(l=>separate.some(x=>x.logIndex===l.logIndex&&
  norm(x.address)===norm(l.address)&&norm(x.data)===norm(l.data)&&
  JSON.stringify(x.topics.map(norm))===JSON.stringify(l.topics.map(norm)))),kind+" separate logs consistency");
 auth[kind]={hash,blockNumber:Number(BigInt(receipt.blockNumber)),blockHash:block.hash,
  success:true,tx,receipt,independentLogs:separate};
}
insist(auth.nativeUsdr.blockNumber===24766137&&auth.publicRls.blockNumber===24766137,
 "faucet funding block");
insist(auth.registration.blockNumber===24766266,"registration block");
const t=auth.registration.tx;
insist(norm(t.from)===norm(relayer)&&norm(t.to)===norm(forwarder),"registry relayer/forwarder");
const parsedEvents=[];
for(const log of auth.registration.receipt.logs){
 const iface=norm(log.address)===norm(registry)?abi.user:
  norm(log.address)===norm(forwarder)?abi.fw:
  norm(log.address)===norm(RLS)?abi.token:null;
 insist(iface!==null,"registration unexpected emitting contract");
 const e=iface.parseLog(log);insist(e,"registration unsupported event");
 parsedEvents.push({name:e.name,address:log.address,args:[...e.args].map(x=>typeof x==="bigint"?x.toString():String(x)),
  index:Number(BigInt(log.logIndex))});
}
const userEvent=parsedEvents.find(x=>x.name==="UserRegistered");
const nameEvent=parsedEvents.find(x=>x.name==="UsernameSet");
const relayEvent=parsedEvents.find(x=>x.name==="Relayed");
const feeEvent=parsedEvents.find(x=>x.name==="Transfer");
insist(userEvent&&nameEvent&&relayEvent&&feeEvent,"missing registry/forwarder/fee events");
insist(norm(userEvent.args[0])===norm(OWNER),"UserRegistered owner");
insist(norm(nameEvent.args[0])===norm(OWNER)&&nameEvent.args[1]==="rq3faucet26","username");
insist(norm(relayEvent.args[0])===norm(OWNER)&&norm(relayEvent.args[1])===norm(registry),"forwarded registry request");
insist(norm(feeEvent.args[0])===norm(OWNER)&&norm(feeEvent.args[1])===norm(relayer),"RLS fee transfer");
const fee=BigInt(feeEvent.args[2]);insist(fee===7196956680000000000n,"fee amount");
insist(BigInt(relayEvent.args.at(-1))===fee,"fee receipt and relayer event agree");
const movements=[];
for(const [kind,token,expected] of [
 ["publicRls",RLS,250n*10n**18n],["nativeUsdr",USDR,10n*10n**18n]]){
 const rec=auth[kind].receipt;
 const hits=rec.logs.filter(l=>norm(l.address)===norm(token)&&norm(l.topics[0])===norm(abi.token.getEvent("Transfer").topicHash));
 insist(hits.length===1,kind+" expected single token Transfer");
 const decoded=abi.token.parseLog(hits[0]);
 insist(norm(decoded.args.to)===norm(OWNER)&&BigInt(decoded.args.value)===expected,kind+" token credit");
 movements.push({tx:auth[kind].hash,token,from:decoded.args.from,to:decoded.args.to,
  amountWei:String(decoded.args.value),block:auth[kind].blockNumber});
}
const latestNumber=Number(BigInt(await rpc("eth_blockNumber")));
const tag="0x"+latestNumber.toString(16);
const currentToken=async token=>{
 const result=await rpc("eth_call",[{to:token,data:abi.token.encodeFunctionData("balanceOf",[OWNER])},tag]);
 return abi.token.decodeFunctionResult("balanceOf",result)[0];
};
const [rls,usdr,native,nonce]=await Promise.all([
 currentToken(RLS),currentToken(USDR),
 rpc("eth_getBalance",[OWNER,tag]),rpc("eth_getTransactionCount",[OWNER,tag])
]);
insist(BigInt(postFaucet.RLSPublicWei)===250n*10n**18n,"post-faucet RLS capture");
insist(BigInt(postFaucet.USDrPublicWei)===10n*10n**18n,"post-faucet USDr capture");
insist(BigInt(postFaucet.nativeWei)===10n*10n**18n,"post-faucet native capture");
insist(BigInt(postRegister.RLSPublicWei)===250n*10n**18n-fee,"before/after RLS fee accounting");
// The original-time post-registration snapshot is fixed, but the account subsequently
// publicly shielded 20 RLS and paid its relayer fee. NEVER assert that the latest
// chain state equals the pre-shield registration balance.
const expectedPostRegistrationWei=250n*10n**18n-fee;
insist(BigInt(postRegister.RLSPublicWei)===expectedPostRegistrationWei,
  "preserved original-time registration balance");
insist(usdr===10n*10n**18n&&BigInt(native)===10n*10n**18n,"current USDr/native");
insist(BigInt(nonce)===0n,"no owner EVM nonce");
const result={
 status:"PASS",evidenceClass:"INDEPENDENT_PUBLIC_FAUCET_FIRST_COHORT_FUNDED_AND_REGISTERED",
 verifiedAtUtc:new Date().toISOString(),chainId:7295799,owner:OWNER,
 username:"rq3faucet26",baselineBeforeFunding:prior,
 baselineAfterFaucetBeforeRegistry:postFaucet,
 publicFunding:{rlsWei:String(250n*10n**18n),usdrWei:String(10n*10n**18n),
 nativeWei:String(10n*10n**18n),tokenTransfers:movements},
 registered:{hash:TXS.registration,block:auth.registration.blockNumber,
 feeWei:String(fee),feeRls:"7.19695668",eventSummary:parsedEvents},
 currentState:{block:latestNumber,publicRlsWei:String(rls),publicUsdrWei:String(usdr),
 nativeWei:String(BigInt(native)),evmNonce:Number(BigInt(nonce))},
 publicFundingDisclosed:true,
 postRegistrationPublicRlsWeiFromOriginalTimeCapture:String(expectedPostRegistrationWei),
 currentHeadIsNotHistoricalRegistrationBlock:latestNumber>auth.registration.blockNumber,
 shieldedBalanceClaim:"UI_SCREENSHOT_ZERO_UNTIL_SHIELDED_FAUCET_OR_SHIELD",
 rawPublicChainEvidence:auth,
 scientificLimits:[
  "This account received two transparent token transfers and a native credit before registration; it is not evidence of zero-public-funding onboarding.",
  "The existence of a shielded faucet button after registration does not prove that it could have been used before completing public-faucet signup.",
  "Wallet UI shielded balances cannot be reconstructed directly from transparent RLS/USDr account balances.",
  "A complete comparator requires the direct shielded faucet receipt, shielded send receipt and independent receiving-wallet confirmation."
 ]};
const save=root+"/evidence/public-rpc/controlled/faucet-cohort-funding-and-registration-verified.json";
fs.writeFileSync(save,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:result.status,owner:OWNER,username:result.username,
 publicRlsBefore:"250",registrationFeeRls:result.registered.feeRls,
 publicRlsAfterOriginalRegistration:(Number(expectedPostRegistrationWei)/1e18).toString(),
 publicRlsAtCurrentHead:(Number(rls)/1e18).toString(),publicUsdrAfter:(Number(usdr)/1e18).toString(),
 nativeAfter:(Number(BigInt(native))/1e18).toString(),evmNonce:result.currentState.evmNonce,
 faucetRlsTx:TXS.publicRls,faucetUsdrTx:TXS.nativeUsdr,
 registerTx:TXS.registration,receiptEvents:parsedEvents.map(x=>x.name),
 saved:save},null,2));
