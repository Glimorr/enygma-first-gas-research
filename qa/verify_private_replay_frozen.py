#!/usr/bin/env python3
"""Offline authenticated-capture consistency for archived historical eth_call.
Provider has pruned original historical state; DO NOT pretend fresh historical
eth_call is still possible. Validates archived calldata, tx/receipt bytes and
the previously captured 2 positive / 4 negative RPC responses.
"""
import datetime,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
a=json.loads((ROOT/"evidence/public-rpc/controlled/claim-invite-historical-replay-controls.json").read_text())
invite=json.loads((ROOT/"evidence/public-rpc/controlled/god-invite-30-public-envelope-verified.json").read_text())
receiver=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json").read_text())
def require(ok,msg):
 if not ok:raise RuntimeError("FROZEN_HISTORICAL_REPLAY_FAIL "+msg)
cases={
 "private_invite_creation":(invite["raw_public_rpc"]["tx"],invite["raw_public_rpc"]["receipt"],24744028),
 "private_invite_claim":(receiver["claim"]["tx"],receiver["claim"]["receipt"],24747924)
}
require(a["chainId"]==7295799 and a["liveTransactions"]==0,"wrong chain or simulated broadcasts")
require(len(a["cases"])==2 and a["preStatePositiveControls"]==2 and a["postStateNegativeControls"]==4,
 "expected sim counts")
for case in a["cases"]:
 name=case["case"];require(name in cases,"unknown replay case")
 tx,receipt,block=cases[name]
 require(case["originalTxHash"].lower()==tx["hash"].lower() and
  receipt["transactionHash"].lower()==tx["hash"].lower(),"tx hash mismatch")
 require(case["originalBlockNumber"]==block and int(receipt["blockNumber"],16)==block
  and receipt["status"]=="0x1","original mined receipt")
 require(case["sameCalldataSha256"].lower()=="0x"+hashlib.sha256(bytes.fromhex(tx["input"][2:])).hexdigest(),
  "replay payload modified")
 require(case["sameOriginalSender"].lower()==tx["from"].lower()
  and case["sameOriginalCallTarget"].lower()==tx["to"].lower(),"sender/target mismatch")
 require(case["txMethodSelector"]==tx["input"][:10] and
  int(case["sameCallValueWei"])==int(tx["value"],16),"method/value mismatch")
 rows=case["readOnlyHistoricalSimulations"]
 require(len(rows)==3 and [x["queriedBlock"] for x in rows]==[block-1,block,block+1],"state block sequence")
 require(rows[0]["rpcResultClass"]=="SUCCESS" and rows[0].get("returnedTrue") is True,
  "positive control not true")
 require(all(x["rpcResultClass"]=="REVERT" and
  "revert" in x.get("rpcErrorMessage","").lower() for x in rows[1:]),"negative control not revert")
spend=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-spend-5423d2b13c.json").read_text())
fee=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-spend-fee-replay-verified.json").read_text())
original=spend["rawPublicTx"]
require(original["hash"].lower()==fee["sourceTransaction"].lower()==spend["txHash"].lower(),"spend original hash")
require(original["input"].lower()==fee["rawPublicEvidence"]["sourceTx"]["input"].lower(),"spend original calldata bytes")
require(original["input"][:10]=="0xaacd552c" and spend["rawPublicReceipt"]["status"]=="0x1", "spend original successful transfer")
checks=fee["historicalReplayControls"]["calls"]
require(len(checks)==3 and [v["block"] for v in checks]==[24760125,24760126,24760127],"spend replay state heights")
require([v["outcome"] for v in checks]==["SUCCESS","REVERT","REVERT"],"spend saved positive-negative state")
require(fee["historicalReplayControls"]["transactionBroadcasts"]==0,"spend replay signed or broadcast")
out={"status":"PASS","class":"FROZEN_HISTORICAL_RPC_RESPONSES_PLUS_ORIGINAL_CHAIN_RECEIPT_CONSISTENCY",
 "checkedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "originalPrivateCases":3,"beforeSuccess":3,"afterReverts":6,
 "freshArchiveStateQueried":False,"note":"The live public RPC now prunes these historical states. Archived source-dated responses are validated against original hashed calldata and authenticated receipts; independent fresh simulation no longer available."}
(ROOT/"qa/historical-replay-frozen-consistency.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps(out,indent=2))
