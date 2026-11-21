#!/usr/bin/env python3
"""Verify original observed second-cohort private send's saved before/after
historical call responses against TWO independently saved exact source tx
records. No archive-node requirement and no new transaction. The RPC result
is frozen source-dated, not freshly recomputed from pruned historical state.
"""
import datetime,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
a=json.loads((ROOT/"evidence/public-rpc/controlled/faucet-cohort-private-spend-77ff894ed5.json").read_text())
b=json.loads((ROOT/"evidence/public-rpc/controlled/faucet-cohort-private-spend-fee-replay-verified.json").read_text())
def require(cond,msg):
 if not cond:raise RuntimeError("SECOND_SEND_FROZEN_REPLAY_FAIL "+msg)
tx=a["rawPublicTx"];receipt=a["rawPublicReceipt"];ftx=b["rawPublicEvidence"]["sourceTx"];fr=b["rawPublicEvidence"]["sourceReceipt"]
hash="0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb"
require(tx["hash"].lower()==hash and receipt["transactionHash"].lower()==hash
 and ftx["hash"].lower()==hash and fr["transactionHash"].lower()==hash,"source transaction hashes")
require(tx["input"].lower()==ftx["input"].lower() and tx["input"].startswith("0xaacd552c"),"exact source transfer calldata")
require(receipt["status"]=="0x1" and fr["status"]=="0x1"
 and int(receipt["blockNumber"],16)==24767795
 and int(fr["blockNumber"],16)==24767795,"original mined receipt")
require(a["blockHash"].lower()==receipt["blockHash"].lower()==fr["blockHash"].lower(),"source block hash")
h=b["historicalReplayControls"];checks=h["calls"]
require(h["transactionBroadcasts"]==0 and h["positiveBefore"]==1 and h["negativeAfter"]==2,"replay count")
require(len(checks)==3 and [v["block"] for v in checks]==[24767794,24767795,24767796]
 and [v["outcome"] for v in checks]==["SUCCESS","REVERT","REVERT"],"frozen before/after observations")
digest=hashlib.sha256(bytes.fromhex(tx["input"][2:])).hexdigest()
out={"status":"PASS","evidence_class":"CONTROLLED_SECOND_COHORT_FROZEN_HISTORICAL_REPLAY_AND_SOURCE_BYTE_CONSISTENCY",
 "verifiedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "sourceTx":hash,"block":24767795,"calldataSha256":digest,
 "frozenPreStateReadOnlyPositive":1,"frozenPostStateReadOnlyReverts":2,
 "readOnlyEthCallBroadcastTransactions":0,"freshHistoricalStateQueried":False,
 "scientificLimit":"Archived public RPC may prune old block state. Saved pre/at/post responses agree with source-dated original experiment; this is frozen evidence, not newly repeated live simulation or a cryptographic security proof."}
dest=ROOT/"qa/faucet-cohort-private-spend-replay-frozen-check.json"
dest.write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps(out,indent=2))
