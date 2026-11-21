/* Read-only prospective baseline for the clean Hub account before any invitation.
 * Confirms no PUBLIC chain balance or account history in declared interval.
 * Does not claim absence of private notes, other networks, or offchain history.
 */
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const {Interface,zeroPadValue}=require("ethers");
const ROOT=new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const base=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/controlled/clean-local-burners-baseline.json","utf8"));
const inv=JSON.parse(fs.readFileSync(ROOT+"/evidence/public-rpc/contract-inventory.json","utf8"));
const HUB=base.accounts.local_hub_unfunded_public_receiver.address;
const RPC="https://testnet-rpc.rayls.com/";
const EXPLORER="https://testnet-explorer.rayls.com/api/v2";
const RLS=inv.contract_inventory.RLS.address;
const REGISTRY=inv.contract_inventory.UserRegistry.address;
const USDR=inv.contract_inventory.USDr.address;
const tokenI=new Interface(["function balanceOf(address owner) view returns(uint256)",
 "event Transfer(address indexed from,address indexed to,uint256 value)"]);
const regI=new Interface(JSON.parse(fs.readFileSync(ROOT+"/research/verified-abis/UserRegistryImplementation.json","utf8")));
async function rpc(method,params=[]){
 let response;
 for(let attempt=0;attempt<3;attempt++){
  try{response=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(20000)});break}
  catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,500*(attempt+1)))}
 }
 if(!response.ok)throw Error(method+" HTTP "+response.status);
 const result=await response.json();
 if(result.error)throw Error(method+" "+JSON.stringify(result.error));
 return result.result;
}
const erc20=async(token,tag)=>BigInt(tokenI.decodeFunctionResult("balanceOf",
 await rpc("eth_call",[{to:token,data:tokenI.encodeFunctionData("balanceOf",[HUB])},tag]))[0]);
const chain=Number(BigInt(await rpc("eth_chainId")));
if(chain!==7295799)throw Error("Wrong chain");
const head=await rpc("eth_getBlockByNumber",["latest",false]);
const height=Number(BigInt(head.number));
const [rls,usdr,native,nonce,isRegisteredData]=await Promise.all([
 erc20(RLS,head.number),erc20(USDR,head.number),
 rpc("eth_getBalance",[HUB,head.number]),
 rpc("eth_getTransactionCount",[HUB,head.number]),
 rpc("eth_call",[{to:REGISTRY,data:regI.encodeFunctionData("isRegistered",[HUB])},head.number])
]);
const registered=regI.decodeFunctionResult("isRegistered",isRegisteredData)[0];
const rlsTransferTopic=tokenI.getEvent("Transfer").topicHash;
const toTopic=zeroPadValue(HUB,32);
const originalBlock=base.fixed_block.number;
const incomingRlsLogs=[],errors=[];
for(let start=originalBlock+1;start<=height;start+=500){
 const end=Math.min(height,start+499);
 try{
  const logs=await rpc("eth_getLogs",[{
   address:RLS,fromBlock:"0x"+start.toString(16),toBlock:"0x"+end.toString(16),
   topics:[rlsTransferTopic,null,toTopic]
  }]);
  for(const log of logs)incomingRlsLogs.push({
    tx_hash:log.transactionHash,block:parseInt(log.blockNumber,16),
    from:"0x"+log.topics[1].slice(-40),to:"0x"+log.topics[2].slice(-40),
    value_wei:BigInt(log.data).toString()
  });
 }catch(e){errors.push({start,end,error:String(e).slice(0,220)})}
}
const explorerTx=await fetch(EXPLORER+"/addresses/"+HUB+"/transactions").then(r=>r.json());
const explorerTransfers=await fetch(EXPLORER+"/addresses/"+HUB+"/token-transfers").then(r=>r.json());
const historyComplete=explorerTx.next_page_params===null&&explorerTransfers.next_page_params===null;
const frozen={
 evidence_class:"PROSPECTIVE_HUB_CONTROL_ZERO_PUBLIC_BALANCE_BEFORE_INVITATION",
 captured_at_utc:new Date().toISOString(),chain_id:chain,address:HUB,
 previous_baseline_block:originalBlock,
 latest_block:height,latest_block_hash:head.hash,
 native_usdr_wei:BigInt(native).toString(),
 erc20_rls_wei:rls.toString(),
 usdr_precompile_balance_wei:usdr.toString(),
 account_nonce:Number(BigInt(nonce)),
 public_registry_registered:Boolean(registered),
 incoming_RLS_logs_since_previous_baseline:incomingRlsLogs,
 rpc_search_errors:errors,
 explorer_transaction_count:(explorerTx.items??[]).length,
 explorer_token_transfer_count:(explorerTransfers.items??[]).length,
 explorer_single_page_complete:historyComplete,
 result:{
  zero_public_funds:rls===0n&&usdr===0n&&BigInt(native)===0n,
  no_public_transactions:Number(BigInt(nonce))===0&&explorerTx.items?.length===0,
  no_incoming_public_rls:incomingRlsLogs.length===0&&explorerTransfers.items?.length===0,
  not_registered:Boolean(registered)===false,
  scans_complete:errors.length===0&&historyComplete
 },
 caveats:[
  "Hub key was used on earlier local research chains, not generated for this experiment.",
  "No public RLS/USDr funds or activity are verified only for Rayls Public testnet; not universally across networks.",
  "Private Enygma notes cannot be excluded by public-address and ERC-20 balance queries.",
  "This is a baseline before an invitation, not evidence that an invitation was claimed."
 ]
};
const file=ROOT+"/evidence/public-rpc/controlled/hub-pre-invite-zero-baseline.json";
fs.writeFileSync(file,JSON.stringify(frozen,null,2)+"\n");
const pass=Object.values(frozen.result).every(Boolean);
console.log(JSON.stringify({status:pass?"PASS":"PARTIAL",
 block:height,address:HUB,result:frozen.result,
 incoming_rls_logs:incomingRlsLogs.length,error_count:errors.length,saved:file},null,2));
if(!pass)process.exitCode=2;
