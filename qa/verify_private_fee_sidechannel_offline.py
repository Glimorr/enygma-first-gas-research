#!/usr/bin/env python3
"""Offline fee side-channel consistency + in-memory mutation tests.
Fresh RPC authentication: run qa/verify_private_fee_sidechannel.py.
"""
import copy,datetime,json,pathlib,sys
from decimal import Decimal
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"evidence/public-rpc/controlled/receiver-private-fee-sidechannel-verified.json"
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
TOKEN=INV["contract_inventory"]["RLS"]["address"].lower()
VAULT=INV["contract_inventory"]["SharedVault"]["address"].lower()
RELAYER=INV["relayer_report"]["relayer_address"].lower()
TREASURY=INV["relayer_report"]["treasury"].lower()
TOPIC="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
NULL="0x437885c05eacc89ce854c46fbeb8290d4c624ea6b561c7a784d86bb5369b2ea3"
def padded(s):return "0x"+s[2:].lower().rjust(64,"0")
def validate(obj):
 issues=[]
 def check(v,n):
  if not v:issues.append(n)
 check(obj.get("chainId")==7295799,"chain.id")
 check(obj.get("sampleCount")==2 and obj.get("oneToOneMatches")==2,"sample.size")
 check(obj.get("reportedRelayer","").lower()==RELAYER,"config.relayer")
 check(obj.get("reportedTreasury","").lower()==TREASURY,"config.treasury")
 check(len(obj.get("controlledPrivateCases",[]))==2,"cases.count")
 for i,c in enumerate(obj.get("controlledPrivateCases",[])):
  x="case."+str(i)+"."
  try:
   receipt=c["rawPayoutReceipt"];tx=c["rawPayoutTx"];header=c["payoutBlockHeader"];log=c["rawPayoutTransferLog"]
   source=c["rawSourceReceipt"]
   check(int(source["status"],16)==1 and source["transactionHash"].lower()==c["tx"].lower(),"case."+str(i)+".sourceReceipt")
   check(int(source["blockNumber"],16)==c["block"],x+"sourceBlock")
   check(int(receipt["status"],16)==1,x+"receiptStatus")
   check(receipt["transactionHash"].lower()==c["treasuryTx"].lower() and
    tx["hash"].lower()==c["treasuryTx"].lower(),x+"payoutTxHash")
   check(receipt["blockHash"].lower()==header["hash"].lower() and
    tx["blockHash"].lower()==header["hash"].lower(),x+"blockHash")
   check(int(receipt["blockNumber"],16)==int(header["number"],16),x+"blockHeight")
   check(log["transactionHash"].lower()==c["treasuryTx"].lower(),x+"transferTxHash")
   check(log["address"].lower()==TOKEN,x+"transferToken")
   check(len(log["topics"])==3 and log["topics"][0].lower()==TOPIC,x+"transferEventSignature")
   check(log["topics"][1].lower()==padded(RELAYER),x+"transferRelayer")
   check(log["topics"][2].lower()==padded(TREASURY),x+"transferTreasury")
   check(any(l["logIndex"]==log["logIndex"] and l["data"].lower()==log["data"].lower()
     and l["topics"]==log["topics"] for l in receipt["logs"]),x+"transferReceiptInclusion")
   payoutWei=int(log["data"],16)
   check(str(payoutWei)==c["treasuryShareWei"],x+"shareWei")
   check(payoutWei*115%15==0,x+"integerRatio")
   expected=Decimal(payoutWei)*Decimal(115)/Decimal(15)/Decimal(10**18)
   base=expected-Decimal(payoutWei)/Decimal(10**18)
   check(str(expected)==c["grossFeeImpliedRls"],x+"grossFee")
   check(base==Decimal(c["baseFeeImpliedRls"]),x+"baseFee")
   check(expected.quantize(Decimal(".01"))==Decimal(c["walletFeeUiApprox"]),x+"walletQuoteReconciliation")
   if c["walletExactFeeReconstructedFromBalance"]:
    check(str(expected)==c["walletExactFeeReconstructedFromBalance"],x+"walletBalanceReconciliation")
   check(c["block"]-12==c["windowStartBlock"] and
     c["block"]+25==c["windowEndBlock"],x+"windowBounds")
   check(c["relativePayoutBlock"]==int(header["number"],16)-c["block"]
      and 0<c["relativePayoutBlock"]<=25,x+"payoutLag")
   check(c["unambiguousRelativeToAllNullifierEventsInComparisonWindow"] is True and
     len(c["allNullifierLogTransactionsInWindow"])==1 and
     c["allNullifierLogTransactionsInWindow"][0].lower()==c["tx"].lower(),x+"candidateVaultCount")
   check(c["unambiguousRelativeToAllRelayerToTreasuryTransfersInWindow"] is True,x+"candidatePayoutCount")
  except Exception as e:issues.append(x+"exception."+str(e)[:100])
 check(obj.get("negativeControl",{}).get("treasuryPaymentsNext35Blocks")==0,"control.zeroFeePayout")
 return issues
def main():
 a=json.loads(SOURCE.read_text())
 errors=validate(a)
 if errors:raise RuntimeError("Frozen evidence invalid: "+repr(errors))
 if "--tamper-tests" not in sys.argv:
  result={"status":"PASS","checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
     "scope":"FROZEN_RECEIPT_CONSISTENCY_ONLY_NOT_LIVE_CHAIN","cases":len(a["controlledPrivateCases"])}
  target=ROOT/"qa/private-fee-offline-result.json";target.write_text(json.dumps(result,indent=2)+"\n")
  print(json.dumps(result,indent=2));return 0
 tests=[
  ("wrong_chain",lambda x:x.__setitem__("chainId",1),"chain.id"),
  ("wrong_treasury",lambda x:x.__setitem__("reportedTreasury","0x"+"f"*40),"config.treasury"),
  ("wrong_relayer",lambda x:x.__setitem__("reportedRelayer","0x"+"f"*40),"config.relayer"),
  ("wrong_case_count",lambda x:x.__setitem__("sampleCount",99),"sample.size"),
  ("wrong_source_receipt_status",lambda x:x["controlledPrivateCases"][0]["rawSourceReceipt"].__setitem__("status","0x0"),"case.0.sourceReceipt"),
  ("wrong_payout_receipt_status",lambda x:x["controlledPrivateCases"][0]["rawPayoutReceipt"].__setitem__("status","0x0"),"case.0.receiptStatus"),
  ("wrong_payout_hash",lambda x:x["controlledPrivateCases"][0].__setitem__("treasuryTx","0x"+"f"*64),"case.0.payoutTxHash"),
  ("wrong_block_hash",lambda x:x["controlledPrivateCases"][0]["payoutBlockHeader"].__setitem__("hash","0x"+"f"*64),"case.0.blockHash"),
  ("wrong_transfer_topic",lambda x:x["controlledPrivateCases"][0]["rawPayoutTransferLog"]["topics"].__setitem__(0,"0x"+"f"*64),"case.0.transferEventSignature"),
  ("wrong_transfer_sender",lambda x:x["controlledPrivateCases"][0]["rawPayoutTransferLog"]["topics"].__setitem__(1,"0x"+"f"*64),"case.0.transferRelayer"),
  ("wrong_transfer_target",lambda x:x["controlledPrivateCases"][0]["rawPayoutTransferLog"]["topics"].__setitem__(2,"0x"+"f"*64),"case.0.transferTreasury"),
  ("wrong_transfer_amount",lambda x:x["controlledPrivateCases"][0]["rawPayoutTransferLog"].__setitem__("data","0x1"),"case.0.transferReceiptInclusion"),
  ("wrong_reported_payout",lambda x:x["controlledPrivateCases"][0].__setitem__("treasuryShareWei","5"),"case.0.shareWei"),
  ("wrong_gross_fee",lambda x:x["controlledPrivateCases"][0].__setitem__("grossFeeImpliedRls","100"),"case.0.grossFee"),
  ("wrong_base_fee",lambda x:x["controlledPrivateCases"][0].__setitem__("baseFeeImpliedRls","100"),"case.0.baseFee"),
  ("bad_ui_quote",lambda x:x["controlledPrivateCases"][0].__setitem__("walletFeeUiApprox","5.42"),"case.0.walletQuoteReconciliation"),
  ("bad_claim_balance",lambda x:x["controlledPrivateCases"][1].__setitem__("walletExactFeeReconstructedFromBalance","13.696"),"case.1.walletBalanceReconciliation"),
  ("bad_window",lambda x:x["controlledPrivateCases"][0].__setitem__("windowEndBlock",1),"case.0.windowBounds"),
  ("bad_payout_lag",lambda x:x["controlledPrivateCases"][0].__setitem__("relativePayoutBlock",99),"case.0.payoutLag"),
  ("duplicate_vault_candidate",lambda x:x["controlledPrivateCases"][0]["allNullifierLogTransactionsInWindow"].append("0x"+"f"*64),"case.0.candidateVaultCount"),
  ("bad_negative_control",lambda x:x["negativeControl"].__setitem__("treasuryPaymentsNext35Blocks",1),"control.zeroFeePayout")
 ]
 results=[]
 for name,change,expected in tests:
  modified=copy.deepcopy(a);change(modified);errs=validate(modified)
  results.append({"name":name,"expected":expected,"detected":any(s.startswith(expected) for s in errs),"issues":errs[:5]})
 missed=[x for x in results if not x["detected"]]
 output={"status":"FAIL" if missed else "PASS","tests":len(tests),"detected":len(tests)-len(missed),
  "missed":missed,"changed_original_file":False,"results":results}
 target=ROOT/"qa/private-fee-tamper-tests.json";target.write_text(json.dumps(output,indent=2)+"\n")
 print(json.dumps({"status":output["status"],"tests":output["tests"],"detected":output["detected"],
  "missed":missed,"saved":str(target)},indent=2))
 return 2 if missed else 0
if __name__=="__main__":sys.exit(main())
