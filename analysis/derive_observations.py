#!/usr/bin/env python3
"""Derived facts from saved public-chain evidence, with exact integer accounting."""
import datetime as dt
import json, pathlib, statistics, urllib.request
from decimal import Decimal
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/"evidence/public-rpc"
scan=json.loads((DATA/"observational/window-24670000-24690000.json").read_text())
fees=json.loads((DATA/"observational/forwarder-fees.json").read_text())
def rpc(method,params):
 req=urllib.request.Request("https://testnet-rpc.rayls.com/",
  json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode(),
  headers={"Content-Type":"application/json","User-Agent":"RaylsQuest3/1.0"})
 with urllib.request.urlopen(req,timeout=25) as r: obj=json.load(r)
 if "error" in obj:raise RuntimeError(obj["error"])
 return obj["result"]
def block_date(height):
 x=rpc("eth_getBlockByNumber",[hex(height),False])
 if int(x["number"],16)!=height:raise RuntimeError("Wrong height")
 return {"height":height,"hash":x["hash"],
         "timestamp_utc":dt.datetime.fromtimestamp(int(x["timestamp"],16),dt.timezone.utc).isoformat()}
def rls(v):return str(Decimal(v)/Decimal(10**18))
first=block_date(scan["fromBlock"])
last=block_date(scan["toBlock"])
paid=[x for x in fees["rows"] if int(x["feeEventWei"])>0]
feeints=[int(x["feeEventWei"]) for x in paid]
matches=0
for row in paid:
 total=sum(int(t["amountWei"]) for t in row["rlsTransferLogs"]
   if t["from"].lower()==row["reportedForwarderFromEvent"].lower()
   and t["to"].lower()==row["eventRelayer"].lower())
 if total==int(row["feeEventWei"]):matches+=1
registrations=[x for x in scan["events"] if x["event"]=="UserRegistered"]
with_fee=sum(any(x["txHash"]==r["txHash"] and x["event"]=="Relayed" for x in scan["events"]) for r in registrations)
summary={
 "evidence_class":"DERIVED_PUBLIC_CHAIN_OBSERVATIONS_NOT_CONTROLLED",
 "captured_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
 "chain_id":scan["chainId"],
 "window":{"from":first,"to":last,
           "block_heights_inclusive":scan["toBlock"]-scan["fromBlock"]+1},
 "counts":{"contract_logs":scan["totalLogs"],"distinct_transactions":scan["distinctTxs"],
   "registered_accounts":len(registrations),"registrations_with_forwarder_event":with_fee,
   "forwarder_receipts":len(fees["rows"]),"paid_forwarder_receipts":len(paid),
   "zero_fee_forwarder_receipts":len(fees["rows"])-len(paid),
   "exact_fee_transfer_matches":matches},
 "paid_fee_wei":{"total":str(sum(feeints)),"minimum":str(min(feeints)),
    "maximum":str(max(feeints)),"median":str(statistics.median(feeints))},
 "paid_fee_RLS":{"total":rls(sum(feeints)),"minimum":rls(min(feeints)),
    "maximum":rls(max(feeints))},
 "constraints":[
  "Observational window selected after viewing public explorer activity, not random.",
  "Two zero-fee events were not directly submitted to the active forwarder.",
  "No foundation treasury transfer occurred within checked receipts; later aggregate payments are not evaluated.",
  "Private shielded notes or invitation ownership cannot be inferred from these public receipts."
 ]}
dest=ROOT/"analysis/public_observations.json"
dest.write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps(summary,indent=2))
