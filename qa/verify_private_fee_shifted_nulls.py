#!/usr/bin/env python3
"""Preregistered temporal-shift placebo windows for Rayls WQ3 fee metadata.
Read-only public logs. Scientifically separate known owner-controlled private
operations (3) from 30 shifted equal-length counterfactual windows.
Offsets fixed ex ante: ±128, ±256, ±512, ±768, ±1024. Same 38-block windows
[source-12, source+25]. Do not call them random or independent network samples.
"""
import pathlib,json,datetime,time,requests
from decimal import Decimal
ROOT=pathlib.Path(__file__).resolve().parents[1]
cfg=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
VAULT=cfg["contract_inventory"]["SharedVault"]["address"]
RLS=cfg["contract_inventory"]["RLS"]["address"]
RELAYER=cfg["relayer_report"]["relayer_address"]
TREASURY=cfg["relayer_report"]["treasury"]
NULLIFIER="0x437885c05eacc89ce854c46fbeb8290d4c624ea6b561c7a784d86bb5369b2ea3"
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
subjects=[
 {"stage":"invite","anchor":24744028,"expectedTreasuryWei":"576000000000000000"},
 {"stage":"claim","anchor":24747924,"expectedTreasuryWei":"1656000000000000000"},
 {"stage":"first_send","anchor":24760126,"expectedTreasuryWei":"576000000000000000"}
]
OFFSETS=[-1024,-768,-512,-256,-128,128,256,512,768,1024]
s=requests.Session();s.headers["User-Agent"]="RaylsQuest3PlaceboFeeControl/1.0"
def rpc(method,params=[]):
 for attempt in range(4):
  try:
   result=s.post("https://testnet-rpc.rayls.com/",json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=24)
   result.raise_for_status();j=result.json()
   if "error" in j:raise RuntimeError(method+":"+str(j["error"]))
   return j["result"]
  except requests.RequestException:
   if attempt==3:raise
   time.sleep(.65*(attempt+1))
def pad(x):return "0x"+x[2:].lower().rjust(64,"0")
def asBlock(l):return int(l["blockNumber"],16)
def logs(addr,topics,start,end):
 found=[]
 for b in range(start,end+1,420):
  query={"address":addr,"topics":topics,"fromBlock":hex(b),"toBlock":hex(min(end,b+419))}
  found.extend(rpc("eth_getLogs",[query]))
 return found
assert int(rpc("eth_chainId"),16)==7295799
allWindows=[]
for item in subjects:
 anchor=item["anchor"];low=anchor+min(OFFSETS)-12;high=anchor+max(OFFSETS)+25
 vault=logs(VAULT,[NULLIFIER],low,high)
 fees=logs(RLS,[TRANSFER,pad(RELAYER),pad(TREASURY)],low,high)
 def describe(offset):
  ctr=anchor+offset;begin=ctr-12;end=ctr+25
  v=[l for l in vault if begin<=asBlock(l)<=end]
  f=[l for l in fees if begin<=asBlock(l)<=end]
  uV={l["transactionHash"].lower():asBlock(l) for l in v}
  uF={l["transactionHash"].lower():{"height":asBlock(l),"amountWei":str(int(l["data"],16))} for l in f}
  closePairs=[{"vaultTx":vtx,"vaultHeight":vb,"payoutTx":ftx,"payoutHeight":fv["height"],
               "lag":fv["height"]-vb,"payoutWei":fv["amountWei"]}
   for vtx,vb in uV.items() for ftx,fv in uF.items() if 1<=fv["height"]-vb<=4]
  return {"offset":offset,"windowStart":begin,"windowEnd":end,"vaultNullifierTxCount":len(uV),
   "treasuryTransferTxCount":len(uF),"closeVaultToTreasuryPairs":closePairs,
   "expectedFeePayoutPresent":item["expectedTreasuryWei"] in [x["amountWei"] for x in uF.values()],
   "treasuryAmountsWei":[v["amountWei"] for v in uF.values()]}
 positive=describe(0)
 assert positive["vaultNullifierTxCount"]==1 and positive["treasuryTransferTxCount"]==1
 assert len(positive["closeVaultToTreasuryPairs"])==1
 assert positive["expectedFeePayoutPresent"]
 nulls=[describe(o) for o in OFFSETS]
 allWindows.append({"stage":item["stage"],"anchorBlock":anchor,"expectedTreasuryWei":item["expectedTreasuryWei"],
  "positive":positive,"shiftedControls":nulls,
  "wholeSpan":{"start":low,"end":high,"vaultNullifierLogs":len(vault),
      "treasuryPayoutLogs":len(fees)}})
 print("STAGE",item["stage"],"CONTROLLED_POSITIVE",positive["vaultNullifierTxCount"],positive["treasuryTransferTxCount"],
  "SHIFTED_WITH_TREASURY",sum(v["treasuryTransferTxCount"]>0 for v in nulls),
  "SHIFTED_WITH_CLOSE_PAIR",sum(bool(v["closeVaultToTreasuryPairs"]) for v in nulls),flush=True)
controls=[x for a in allWindows for x in a["shiftedControls"]]
nWithPayout=sum(c["treasuryTransferTxCount"]>=1 for c in controls)
nWithUniquePayout=sum(c["treasuryTransferTxCount"]==1 for c in controls)
nWithVault=sum(c["vaultNullifierTxCount"]>=1 for c in controls)
nWithAnyPair=sum(bool(c["closeVaultToTreasuryPairs"]) for c in controls)
nWithExactFee=sum(c["expectedFeePayoutPresent"] for c in controls)
report={
 "evidence_class":"CONTROLLED_PRIVATE_FEE_TRACES_VS_30_FIXED_TEMPORAL_SHIFT_PLACEBO_WINDOWS",
 "generatedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,"method":{
 "selection":"Three already-mined researcher-controlled private cases",
 "anchorBlocks":[x["anchor"] for x in subjects],
 "fixedOffsets":OFFSETS,"windowRelativeStart":-12,"windowRelativeEnd":25,"windowWidthBlocks":38,
 "nullifierContract":VAULT,"reportedRelayer":RELAYER,"reportedTreasury":TREASURY,
 "erc20Token":RLS,"controlsPreregisteredInThisScriptBeforeLiveLogQueries":True,
 "uniqueTransactionsDeduplicatedByHash":True,
 "timeShiftedNotRandomizedOrTrafficMatched":True},
 "positiveCases":3,"positiveMatched":sum(bool(x["positive"]["closeVaultToTreasuryPairs"]) for x in allWindows),
 "shiftedWindowCount":len(controls),
 "shiftedWindowsWithAnyTreasuryPayout":nWithPayout,
 "shiftedWindowsWithExactlyOneTreasuryPayout":nWithUniquePayout,
 "shiftedWindowsWithAnyNullifierTx":nWithVault,
 "shiftedWindowsWithCloseVaultPayoutPair":nWithAnyPair,
 "shiftedWindowsWithExactOriginalFeeShare":nWithExactFee,
 "windowsByCase":allWindows,
 "interpretationBoundaries":[
 "Fixed shifted windows are a diagnostic for ambient fee transfer frequency, not a random comparison group or causal proof.",
 "The original controlled owner-wallet context provides observed fee quotes; RPC alone does not decrypt private principal, payer or recipient.",
 "The official docs already describe a per-transaction Foundation share: this control quantifies public traceability on the chosen testnet, not a protocol exploit.",
 "Selection is conditional on three successful controlled operations; n=3 is too small for population statistics.",
 "Public reported treasury configuration is not independent proof of legal ownership.",
 "No signing, posting, or gas was used."
 ]}
out=ROOT/"evidence/public-rpc/controlled/private-fee-temporal-shift-placebo-verified.json"
out.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k not in ("windowsByCase","interpretationBoundaries")},indent=2))
print("SAVED",out)
