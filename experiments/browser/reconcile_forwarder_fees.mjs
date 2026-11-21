import { Interface, formatUnits } from "ethers";
import fs from "node:fs";
import path from "node:path";
const root=new URL("../..",import.meta.url).pathname.replace(/\/$/,"");
const out=root+"/evidence/public-rpc/observational";
const scan=JSON.parse(fs.readFileSync(out+"/window-24670000-24690000.json","utf8"));
const inv=JSON.parse(fs.readFileSync(root+"/evidence/public-rpc/contract-inventory.json","utf8"));
const rls=inv.contract_inventory.RLS.address.toLowerCase();
const forwarder=inv.relayer_report.active_forwarder.toLowerCase();
const treasury=inv.relayer_report.treasury.toLowerCase();
const addressOfRelayer=inv.relayer_report.relayer_address.toLowerCase();
const i=new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
const relayed=scan.events.filter(e=>e.event==="Relayed");
const errorList=[];
async function rpc(method,params=[]){
 const r=await fetch("https://testnet-rpc.rayls.com/",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
 if(!r.ok)throw Error("HTTP "+r.status);
 const obj=await r.json();
 if(obj.error)throw Error(JSON.stringify(obj.error).slice(0,300));
 return obj.result;
}
const rows=[];
const blockCache=new Map();
for(const ev of relayed){
 try{
  const rec=await rpc("eth_getTransactionReceipt",[ev.txHash]);
  if(!rec)throw Error("Receipt absent");
  const blockNumber=Number(BigInt(rec.blockNumber));
  const bn=rec.blockNumber;
  if(!blockCache.has(bn))blockCache.set(bn,await rpc("eth_getBlockByNumber",[bn,false]));
  const block=blockCache.get(bn);
  if(block.hash.toLowerCase()!==rec.blockHash.toLowerCase())throw Error("Header/receipt block hash mismatch");
  const tokenTransfers=[];
  for(const log of rec.logs){
   if(log.address.toLowerCase()!==rls)continue;
   let parsed; try{parsed=i.parseLog(log)}catch{continue}
   if(!parsed||parsed.name!=="Transfer")continue;
   tokenTransfers.push({
    from:parsed.args.from,to:parsed.args.to,
    amountWei:parsed.args.value.toString(),
    amountRls:formatUnits(parsed.args.value,18)
   });
  }
  const incomingToTreasury=tokenTransfers.filter(t=>t.to.toLowerCase()===treasury)
   .reduce((acc,t)=>acc+BigInt(t.amountWei),0n);
  const fee=BigInt(ev.fields.fee);
  const share = fee>0n ? Number(incomingToTreasury*1000000n/fee)/10000 : null;
  const row={
   txHash:ev.txHash,blockNumber,blockHash:rec.blockHash,
   txStatus:parseInt(rec.status,16),txFrom:rec.from,
   txTo:rec.to,reportedForwarderFromEvent:ev.fields.from,
   eventRelayer:ev.fields.relayer,forwardedTarget:ev.fields.to,
   feeEventWei:ev.fields.fee,feeEventRls:formatUnits(fee,18),
   gasUsed:BigInt(rec.gasUsed).toString(),
   effectiveGasPrice:BigInt(rec.effectiveGasPrice||"0x0").toString(),
   grossNativeGasWei:(BigInt(rec.gasUsed)*BigInt(rec.effectiveGasPrice||"0x0")).toString(),
   rlsTransferLogs:tokenTransfers,
   treasuryTransferWei:incomingToTreasury.toString(),
   treasuryRls:formatUnits(incomingToTreasury,18),
   treasuryAsPercentOfFee:share,
   countOfReceiptLogs:rec.logs.length,
   blockHeaderMatchesReceipt:true,
   feeEventIsPositive:fee>0n,
   unexpectedRelayer:ev.fields.relayer.toLowerCase()!==addressOfRelayer,
   toActiveForwarder:rec.to?.toLowerCase()===forwarder
  };
  rows.push(row);
 }catch(e){errorList.push({txHash:ev.txHash,message:String(e).slice(0,250)})}
}
const result={
 evidence_class:"PUBLIC_CHAIN_OBSERVATIONAL_RELAYER_FEE_EVENTS",
 capturedAtUtc:new Date().toISOString(),
 rpc:"https://testnet-rpc.rayls.com/",
 sourceWindow:{from:scan.fromBlock,to:scan.toBlock},
 tokenAddress:inv.contract_inventory.RLS.address,
 forwarder:inv.relayer_report.active_forwarder,
 treasury:inv.relayer_report.treasury,
 contemporaneousRelayerFeePolicy:{
  rlsPerGasWei:inv.relayer_report.rls_per_gas_wei,
  gasSharePercent:inv.relayer_report.gas_share_percent,
  caveat:"Policy was read at a later time than historical transactions; do not assume historical quotes equal this value."
 },
 rows,errors:errorList,
 limitations:[
   "Only public forwarder Relayed events were sampled; shielded private-send fees are not fully public.",
   "Fee events, token transfers and treasury receipts are independently verifiable; fee policy depends on relayer pricing and time.",
   "No account keys, private note values or invitation claims are present.",
   "One relayer event may be from an unrelated permitted relayer; flagged rather than silently dropped."
 ]
};
fs.writeFileSync(out+"/forwarder-fees.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({status:errorList.length?"PARTIAL":"PASS",
 count:rows.length, errors:errorList,
 nonzeroFees:rows.filter(x=>x.feeEventIsPositive).length,
 treasuryTransferCount:rows.filter(x=>BigInt(x.treasuryTransferWei)>0n).length,
 sample:rows.slice(0,4).map(r=>({
  txHash:r.txHash,feeEventRls:r.feeEventRls,treasuryRls:r.treasuryRls,
  sharePct:r.treasuryAsPercentOfFee,gasUsed:r.gasUsed,
  rlsTransferCount:r.rlsTransferLogs.length,toActiveForwarder:r.toActiveForwarder
 }))},null,2));
