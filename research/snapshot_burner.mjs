import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require=createRequire(new URL("../experiments/browser/package.json",import.meta.url));
const { Interface, formatUnits, getAddress } = require("ethers");

const root = new URL("..",import.meta.url).pathname.replace(/\/$/,"");
const RPC = "https://testnet-rpc.rayls.com/";
const EXPLORER = "https://testnet-explorer.rayls.com/api/v2";
const ACCOUNT = getAddress("0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2");
const tokenAbi = new Interface(["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"]);
const addrs = {
  RLS: getAddress("0x07e17E17e17E17e17e17E17E17E17E17E17e17EA".toLowerCase()),
  USDr: getAddress("0x0000000000000000000000000000000000000400")
};
async function rpc(method, params = []) {
  const response=await fetch(RPC, {method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
  if(!response.ok)throw new Error(method+" HTTP "+response.status);
  const obj=await response.json();
  if(obj.error)throw new Error(method+" "+JSON.stringify(obj.error));
  return obj.result;
}
async function readToken(symbol,address,blockTag){
  const tx={to:address,data:tokenAbi.encodeFunctionData("balanceOf",[ACCOUNT])};
  try {
    const value=await rpc("eth_call",[tx,blockTag]);
    const amount=tokenAbi.decodeFunctionResult("balanceOf",value)[0];
    const decimals=symbol==="RLS"?18:18;
    return {address,amountWei:amount.toString(),formatted:formatUnits(amount,decimals),
      decimals,source:"LIVE_RPC_ETH_CALL_AT_FIXED_BLOCK",success:true};
  }catch(e){
    return {address,error:String(e).slice(0,320),success:false};
  }
}
async function getExplorer(path){
  try {
    const r=await fetch(EXPLORER+path,{headers:{"User-Agent":"RaylsQuest3PublicReadOnly/1.0"}});
    if(!r.ok)throw new Error("HTTP "+r.status);
    return {ok:true,data:await r.json()};
  } catch(e){return {ok:false,error:String(e).slice(0,200)}}
}
const idChain=parseInt(await rpc("eth_chainId"),16);
if(idChain!==7295799)throw new Error("Chain identity mismatch");
const block=await rpc("eth_getBlockByNumber",["latest",false]);
if(!block?.hash)throw new Error("Block absent");
const tag=block.number;
const nativeBalance=await rpc("eth_getBalance",[ACCOUNT,tag]);
const nonce=await rpc("eth_getTransactionCount",[ACCOUNT,tag]);
const tokens={};
for(const [s,a] of Object.entries(addrs))tokens[s]=await readToken(s,a,tag);
const [explorerAccount,explorerTokenBalances,explorerTxs]=await Promise.all([
 getExplorer("/addresses/"+ACCOUNT),
 getExplorer("/addresses/"+ACCOUNT+"/token-balances"),
 getExplorer("/addresses/"+ACCOUNT+"/transactions?filter=to%7Cfrom")
]);
const liteExplorerTxs=explorerTxs.ok?{
  nextPageParams:explorerTxs.data.next_page_params,
  recent:(explorerTxs.data.items||[]).slice(0,30).map(t=>({
    hash:t.hash,blockNumber:t.block_number,timestamp:t.timestamp,
    status:t.status,from:t.from?.hash,to:t.to?.hash,
    value:t.value,gasUsed:t.gas_used,fee:t.fee
  }))
}:{error:explorerTxs.error};
const data={
  evidence_class:"RESEARCHER_PROVIDED_PREEXISTING_BURNER__PUBLIC_CHAIN_BASELINE",
  capturedAtUtc:new Date().toISOString(),account:ACCOUNT,
  chainId:idChain,block:{number:Number(BigInt(tag)),hash:block.hash,
    timestampUtc:new Date(Number(BigInt(block.timestamp))*1000).toISOString()},
  fixedBlockTag:tag,nativeBalanceWei:BigInt(nativeBalance).toString(),
  transactionCount:BigInt(nonce).toString(),
  tokenBalances:tokens,
  explorer:{
    indexedAccount:explorerAccount.ok?{
      hash:explorerAccount.data.hash,hasTokenTransfers:explorerAccount.data.has_token_transfers,
      hasLogs:explorerAccount.data.has_logs,coinBalance:explorerAccount.data.coin_balance
    }:{error:explorerAccount.error},
    indexedTokenBalances:explorerTokenBalances.ok?(Array.isArray(explorerTokenBalances.data)?
      explorerTokenBalances.data.map(x=>({tokenAddress:x.token?.address_hash,tokenSymbol:x.token?.symbol,
        value:x.value,decimals:x.token?.decimals})):explorerTokenBalances.data)
      :{error:explorerTokenBalances.error},
    recentTransactions:liteExplorerTxs
  },
  conclusionsRestrictedTo:[
    "Public blockchain and explorer data for a user-provided preexisting testnet account",
    "This is not a new account and cannot be the zero-public-funding onboarding treatment",
    "Screenshot UI shielded balances are user-observed and cannot be independently reconstructed from public balance calls",
    "No wallet signing, token transfer, shielding, or invite creation occurred in this script"
  ]
};
const dest=path.join(root,"evidence/public-rpc/burner-baseline.json");
fs.writeFileSync(dest,JSON.stringify(data,null,2)+"\n");
console.log(JSON.stringify({
  status:"PASS",account:ACCOUNT,chainId:idChain,blockNumber:data.block.number,
  nativeBalanceWei:data.nativeBalanceWei,nonce:data.transactionCount,
  tokenBalances:Object.fromEntries(Object.entries(tokens).map(([k,v])=>[k,v.success?v.formatted:"READ_FAILED: "+v.error])),
  explorerRecentTxCount:liteExplorerTxs.recent?.length??null,save:dest
},null,2));
