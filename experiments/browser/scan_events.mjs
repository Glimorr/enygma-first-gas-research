import { Interface } from "ethers";
import fs from "node:fs";
import path from "node:path";
const root=new URL("../..",import.meta.url).pathname.replace(/\/$/,"");
const outputDir=path.join(root,"evidence","public-rpc","observational");
fs.mkdirSync(outputDir,{recursive:true});
const inventory=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const map={
 UserRegistry:"UserRegistryImplementation",
 SharedVault:"SharedVaultImplementation",
 RlsVault:"RlsVault",UsdrVault:"UsdrVault",next:"next"
};
const providers=new Map();
for(const [name,abiFile] of Object.entries(map)){
 const addr=inventory.contract_inventory[name].address.toLowerCase();
 const abi=JSON.parse(fs.readFileSync(root+"/research/verified-abis/"+abiFile+".json"));
 providers.set(addr,{name,iface:new Interface(abi)});
}
const endpoint="https://testnet-rpc.rayls.com/";
const errors=[];
async function rpc(method,params=[]){
 const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"RaylsQuest3/1.0"},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
 if(!r.ok)throw new Error("HTTP "+r.status+" for "+method);
 const x=await r.json();
 if(x.error)throw new Error(method+": "+JSON.stringify(x.error).slice(0,350));
 return x.result;
}
const chainId=parseInt(await rpc("eth_chainId"),16);
if(chainId!==7295799)throw new Error("Wrong chain "+chainId);
const head=parseInt(await rpc("eth_blockNumber"),16);
const from=Number(process.env.OBS_FROM_BLOCK??(head-2000));
const to=Number(process.env.OBS_TO_BLOCK??head);
if(!(from>=0&&to<=head&&from<=to))throw new Error('Invalid scan range');
const seen=[];
for(let start=from;start<=to;start+=500){
 const end=Math.min(start+499,to);
 const filter={fromBlock:"0x"+start.toString(16),toBlock:"0x"+end.toString(16),
   address:[...providers.keys()]};
 try{
  const logs=await rpc("eth_getLogs",[filter]);
  for(const log of logs){
   const provider=providers.get(log.address.toLowerCase());
   let event, fields={};
   try{
    const parsed=provider.iface.parseLog(log);
    event=parsed?.name||"UNPARSED";
    if(parsed){
     for(let i=0;i<parsed.fragment.inputs.length;i++){
      const spec=parsed.fragment.inputs[i];
      const v=parsed.args[i];
      if(spec.type==="bytes"){fields[spec.name+"Bytes"]=(v.length-2)/2;continue}
      if(spec.type.endsWith("[]")){fields[spec.name+"Count"]=v.length;continue}
      fields[spec.name]=typeof v==="bigint"?v.toString():String(v);
     }
    }
   }catch(e){event="DECODE_FAILED";fields={error:String(e).slice(0,120)}}
   seen.push({name:provider.name,event,fields,txHash:log.transactionHash,
     blockNumber:parseInt(log.blockNumber,16),logIndex:parseInt(log.logIndex,16),
     address:log.address});
  }
 }catch(e){errors.push({from:start,to:end,error:String(e).slice(0,500)})}
}
const txs=[...new Set(seen.map(x=>x.txHash))];
const counts={};for(const x of seen){const k=x.name+"."+x.event;counts[k]=(counts[k]||0)+1;}
const target=seen.filter(x=>x.event==="Relayed"||x.event==="UserRegistered");
const sampledTxs=[...new Set(target.map(x=>x.txHash))].slice(0,100);
const receipts=[];
for(const hash of sampledTxs){
 try {
  const r=await rpc("eth_getTransactionReceipt",[hash]);
  if(!r){errors.push({tx:hash,error:"Receipt absent"});continue}
  receipts.push({txHash:hash,blockHash:r.blockHash,
    blockNumber:parseInt(r.blockNumber,16),status:parseInt(r.status,16),
    gasUsed:parseInt(r.gasUsed,16),from:r.from,to:r.to,logsCount:r.logs.length});
 }catch(e){errors.push({tx:hash,error:String(e).slice(0,250)})}
}
const result={evidence_class:"OBSERVATIONAL_PUBLIC_ONCHAIN_ONLY_NOT_USER_CONTROLLED",
 capturedAtUtc:new Date().toISOString(),rpc:endpoint,chainId,fromBlock:from,toBlock:to,
 contractFilters:[...providers].map(([addr,obj])=>({name:obj.name,address:addr})),
 totalLogs:seen.length,distinctTxs:txs.length,decodedEventCounts:counts,
 events:seen,receiptSamples:receipts,errors,
 limitations:["No user-controlled invite claim or account transaction in this dataset.",
 "Event presence alone cannot identify private sender, recipient or amount.",
 "The scoped block interval is observational, not a controlled trial.",
 "Relayer-reported fee policy is not yet reconciled to every wallet's shielded balance."]};
fs.writeFileSync(outputDir+"/window-"+from+"-"+to+".json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:errors.length?"PARTIAL":"PASS",
 chainId,fromBlock:from,toBlock:to,logs:seen.length,transactions:txs.length,
 receiptSamples:receipts.length,eventCounts:counts,errors:errors.slice(0,3)},null,2));
