#!/usr/bin/env python3
"""Offline consistency and tamper-test checks for public RLS fee-to-treasury payout sample.
For fresh chain authentication rerun research/reconcile_fee_treasury_controls.py.
No signing, and no data is changed on disk by tamper tests.
"""
import argparse,collections,copy,datetime,json,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"evidence/public-rpc/observational/fee-treasury-multi-case-controls.json"
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
def norm(value):return str(value or "").lower()
def topic(a):return "0x"+a[2:].lower().rjust(64,"0")
def validate(data):
 errors=[]
 def check(v,key):
  if not v:errors.append(key)
 check(data.get("chain_id")==7295799,"chain.id")
 check(data.get("server_reported_share_percent_of_base_fee")==15,"fees.shareRate")
 check(data.get("case_count")==len(data.get("cases",[])),"cases.count")
 check(data.get("errors")==[],"rpc.errors")
 cases=data.get("cases",[])
 check(len(cases)>=20,"cases.sampleMinimum")
 pairs=[]
 paid,zero,matched=0,0,0
 for index,case in enumerate(cases):
  prefix=f"case.{index}"
  try:
   fee=int(case["fee"])
   check(fee>=0,prefix+".feeNonnegative")
   expected=fee*15//115 if fee else 0
   check(case["expected_treasury_share_wei"]==str(expected),prefix+".expectedShare")
   check(case["division_remainder"]==fee*15%115,prefix+".divisionRemainder")
   payments=case.get("matching_treasury_transfers",[])
   check(case["matching_count"]==len(payments),prefix+".matchCount")
   check(0<=len(payments)<=1,prefix+".unambiguous")
   if fee==0:
    zero+=1
    check(case["comparison_result"]=="NO_MATCH" and not payments,prefix+".zeroFeeControl")
    continue
   paid+=1
   check(len(payments)==1,prefix+".paidPayoutExists")
   if not payments:continue
   p=payments[0]
   amt=int(p["amount_wei"])
   check(amt==expected,prefix+".exactShareWei")
   check(p["amount_rls"]==str(__import__("decimal").Decimal(amt)/10**18),prefix+".payoutRls")
   check(p["receipt_verified"] is True,prefix+".receiptVerifiedFlag")
   check(0<=p["blocks_after_fee"]<=25 and p["blocks_after_fee"]==p["block"]-case["block"],
       prefix+".payoutLag")
   check(p["candidate_case_count_using_same_payout"]==1,prefix+".nonuniqueCandidate")
   raw=p["raw_public_receipt"]
   log=p["raw_transfer_log"]
   header=p["block_header"]
   check(norm(raw["transactionHash"])==norm(p["tx"]),prefix+".receiptHash")
   check(norm(raw["blockHash"])==norm(header["hash"]),prefix+".receiptBlockHash")
   check(int(raw["blockNumber"],16)==p["block"]==int(header["number"],16),
         prefix+".blockHeight")
   check(int(raw["status"],16)==1,prefix+".receiptStatus")
   check(norm(log["transactionHash"])==norm(p["tx"]),prefix+".logTxHash")
   check(norm(log["address"])==norm(data["token"]),prefix+".transferToken")
   check(len(log["topics"])==3 and norm(log["topics"][0])==TRANSFER,
         prefix+".transferTopic")
   check(norm(log["topics"][1])==norm(topic(case["relayer"])),prefix+".transferFromRelayer")
   check(norm(log["topics"][2])==norm(topic(data["reported_treasury"])),prefix+".transferToTreasury")
   check(int(log["data"],16)==amt,prefix+".transferRawAmount")
   check(any(r["logIndex"]==log["logIndex"] and
             norm(r["data"])==norm(log["data"]) and
             norm(r["address"])==norm(log["address"]) for r in raw["logs"]),
         prefix+".logReceiptInclusion")
   pairs.append((norm(p["tx"]),int(p["block"])))
   matched+=1
  except Exception as exc:errors.append(prefix+".exception."+str(exc)[:100])
 check(data.get("paid_cases")==paid,"summary.paidCases")
 check(data.get("zero_fee_cases")==zero,"summary.zeroCases")
 check(data.get("paid_cases_with_exact_one")==matched,"summary.exactMatches")
 check(data.get("one_exact_match_cases")==matched,"summary.exactAll")
 check(len(pairs)==len(set(pairs)),"payout.duplicateReuse")
 check(data.get("ambiguous_reused_treasury_tx_candidates")==0,"summary.ambiguity")
 return errors
def main():
 parser=argparse.ArgumentParser();parser.add_argument("--tamper-tests",action="store_true")
 args=parser.parse_args()
 original=json.loads(SOURCE.read_text())
 clean_errors=validate(original)
 if clean_errors:raise RuntimeError("Frozen source invalid: "+repr(clean_errors[:8]))
 if args.tamper_tests:
  paid_index,second_index=[i for i,c in enumerate(original["cases"]) if int(c["fee"])>0][:2]
  tests=[
   ("wrong_chain",lambda x:x.__setitem__("chain_id",1),"chain.id"),
   ("wrong_fee_rate",lambda x:x.__setitem__("server_reported_share_percent_of_base_fee",50),"fees.shareRate"),
   ("case_removed",lambda x:x["cases"].pop(),"cases.count"),
   ("wrong_fee",lambda x:x["cases"][paid_index].__setitem__("fee","400"),f"case.{paid_index}.expectedShare"),
   ("wrong_expected_payout",lambda x:x["cases"][paid_index].__setitem__("expected_treasury_share_wei","1"),f"case.{paid_index}.expectedShare"),
   ("wrong_payout_amount",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0].__setitem__("amount_wei","1"),f"case.{paid_index}.exactShareWei"),
   ("tampered_raw_amount",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0]["raw_transfer_log"].__setitem__("data","0x1"),f"case.{paid_index}.transferRawAmount"),
   ("tampered_raw_receipt",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0]["raw_public_receipt"].__setitem__("status","0x0"),f"case.{paid_index}.receiptStatus"),
   ("wrong_treasury_address",lambda x:x.__setitem__("reported_treasury","0x"+"1"*40),f"case.{paid_index}.transferToTreasury"),
   ("wrong_sender_address",lambda x:x["cases"][paid_index].__setitem__("relayer","0x"+"1"*40),f"case.{paid_index}.transferFromRelayer"),
   ("wrong_raw_tx_hash",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0]["raw_public_receipt"].__setitem__("transactionHash","0x"+"f"*64),f"case.{paid_index}.receiptHash"),
   ("wrong_block_hash",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0]["block_header"].__setitem__("hash","0x"+"f"*64),f"case.{paid_index}.receiptBlockHash"),
   ("wrong_log_topic",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0]["raw_transfer_log"]["topics"].__setitem__(0,"0x"+"0"*64),f"case.{paid_index}.transferTopic"),
   ("incorrect_lag",lambda x:x["cases"][paid_index]["matching_treasury_transfers"][0].__setitem__("blocks_after_fee",99),f"case.{paid_index}.payoutLag"),
   ("reused_payout",lambda x:x["cases"][second_index]["matching_treasury_transfers"][0].__setitem__("tx",x["cases"][paid_index]["matching_treasury_transfers"][0]["tx"]),f"case.{second_index}.receiptHash")
  ]
  reports=[]
  for name,change,expected in tests:
   copy_data=copy.deepcopy(original);change(copy_data)
   errs=validate(copy_data)
   reports.append({"test":name,"detected":any(e.startswith(expected) for e in errs),
                   "expected":expected,"errors":errs[:5]})
  ok=all(x["detected"] for x in reports)
  out={"class":"OFFLINE_TREASURY_EVIDENCE_TAMPER_TESTS","test_count":len(reports),
       "detected_count":sum(x["detected"] for x in reports),"status":"PASS" if ok else "FAIL",
       "run_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
       "original_source_unchanged":True,"results":reports}
  target=ROOT/"qa/treasury-tamper-tests.json"
  target.write_text(json.dumps(out,indent=2)+"\n")
  print(json.dumps({"status":out["status"],"detected":out["detected_count"],
     "tests":out["test_count"],"failures":[x for x in reports if not x["detected"]],
     "saved":str(target)},indent=2))
  return 0 if ok else 2
 out={"class":"OFFLINE_TREASURY_EVIDENCE_CONSISTENCY","status":"PASS",
      "paid_cases":original["paid_cases"],"exact_matches":original["paid_cases_with_exact_one"],
      "zero_fee_cases":original["zero_fee_cases"],
      "checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "caveat":"Live public RPC authentication requires rerunning source collection; this check only evaluates the frozen data."}
 target=ROOT/"qa/treasury-offline-check.json"
 target.write_text(json.dumps(out,indent=2)+"\n")
 print(json.dumps(out,indent=2));return 0
if __name__=="__main__":sys.exit(main())
