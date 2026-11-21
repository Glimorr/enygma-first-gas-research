#!/usr/bin/env python3
"""Public RPC test: Do relayer RLS fees match subsequent reported-treasury payouts?
No signing. Exploratory, activity-biased sample; cannot establish treasury ownership or offchain attribution.
"""
import datetime, json, pathlib, requests, time
from decimal import Decimal
ROOT=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
OBS=json.loads((ROOT/"evidence/public-rpc/observational/forwarder-fees.json").read_text())
DEV=json.loads((ROOT/"evidence/public-rpc/controlled/dev-registration-verified-receipt.json").read_text())
SHIELD=json.loads((ROOT/"evidence/public-rpc/controlled/god-shield-40-verified.json").read_text())
RPC="https://testnet-rpc.rayls.com/"
RLS=INV["contract_inventory"]["RLS"]["address"]
FWD=INV["relayer_report"]["active_forwarder"]
TREASURY=INV["relayer_report"]["treasury"]
RELAYER=INV["relayer_report"]["relayer_address"]
SHARE_PCT=int(INV["relayer_report"]["gas_share_percent"])
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
RELAYED="0x0684ec99c5a024d68812ca8b1a1fc50eb479a6b72828732541183a0a28be4a41"
client=requests.Session()
client.headers["User-Agent"]="RaylsQuest3ReadOnlyTreasuryControls/1.0"
def call(method,params=[]):
 for attempt in range(3):
  try:
   res=client.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=25)
   res.raise_for_status();data=res.json()
   if "error" in data:raise RuntimeError(str(data["error"]))
   return data["result"]
  except requests.RequestException:
   if attempt==2:raise
   time.sleep(.3*(attempt+1))
def topic(addr):return "0x"+addr[2:].lower().rjust(64,"0")
def dec(wei):return str(Decimal(wei)/Decimal(10**18))
cases=[]
for row in OBS["rows"]:
 cases.append({"case":"observed_prior_sample","tx":row["txHash"],
  "block":row["blockNumber"],"fee":str(row["feeEventWei"]),"relayer":row["eventRelayer"]})
cases.append({"case":"controlled_dev_registration","tx":DEV["txHash"],
 "block":DEV["blockNumber"],"fee":DEV["relayedEvents"][0]["feeWei"],
 "relayer":DEV["relayedEvents"][0]["relayer"]})
cases.append({"case":"controlled_god_shield","tx":SHIELD["tx_hash"],
 "block":SHIELD["block_number"],"fee":SHIELD["relayer_fee_wei"],
 "relayer":SHIELD["relayed"][0]["relayer"]})
# Dev + shield + samples have exact fee captured in earlier live receipt. God @god registration is independent extra control.
PREVIOUS_USER_REG="0x46765dfe79fc4954fc8fb12bdcb4b4391dce3e28a01e42de96518b9a0536cfbc"
reg=call("eth_getTransactionReceipt",[PREVIOUS_USER_REG])
if reg and reg["status"]=="0x1":
 revents=[log for log in reg["logs"] if log["address"].lower()==FWD.lower() and log["topics"][0].lower()==RELAYED]
 if len(revents)==1:
  e=revents[0]; fee=int(e["data"][-64:],16)
  cases.append({"case":"prior_god_registration_control","tx":PREVIOUS_USER_REG,
   "block":int(reg["blockNumber"],16),"fee":str(fee),"relayer":"0x"+e["topics"][3][-40:]})
cache={}
def scan_treasury(from_block,to_block,account):
 key=(from_block,to_block,account.lower())
 if key not in cache:
  logs=call("eth_getLogs",[{"fromBlock":hex(from_block),"toBlock":hex(to_block),
   "address":RLS,"topics":[TRANSFER,topic(account),topic(TREASURY)]}])
  cache[key]=logs
 return cache[key]
header={}
def block(height):
 if height not in header:header[height]=call("eth_getBlockByNumber",[hex(height),False])
 return header[height]
output=[]
errors=[]
for c in cases:
 try:
  fee=int(c["fee"])
  expected=(fee*SHARE_PCT)//(100+SHARE_PCT) if fee>0 else 0
  remainder=(fee*SHARE_PCT)%(100+SHARE_PCT) if fee>0 else 0
  # Search at most 25 blocks after the fee event. Source selection was not random.
  end=c["block"]+25
  logs=scan_treasury(c["block"],end,c["relayer"])
  possible=[]
  for e in logs:
   amount=int(e["data"],16)
   if abs(amount-expected)>1:continue
   rec=call("eth_getTransactionReceipt",[e["transactionHash"]])
   b=block(int(e["blockNumber"],16))
   if not rec or rec["status"]!="0x1" or rec["blockHash"].lower()!=b["hash"].lower():
    raise RuntimeError("treasury receipt or block verification failed")
   if not any(x["logIndex"]==e["logIndex"] and x["data"]==e["data"] for x in rec["logs"]):
    raise RuntimeError("transfer event not included in receipt")
   possible.append({"tx":e["transactionHash"],"block":int(e["blockNumber"],16),
     "amount_wei":str(amount),"amount_rls":dec(amount),
     "blocks_after_fee":int(e["blockNumber"],16)-c["block"],
     "receipt_verified":True,
     "raw_public_receipt":rec,
     "raw_transfer_log":e,
     "block_header":{"hash":b["hash"],"number":b["number"],"timestamp":b["timestamp"],"parentHash":b["parentHash"]}})
  c["fee_rls"]=dec(fee)
  c["expected_treasury_share_wei"]=str(expected)
  c["expected_treasury_share_rls"]=dec(expected)
  c["division_remainder"]=remainder
  c["matching_treasury_transfers"]=possible
  c["matching_count"]=len(possible)
  c["comparison_result"]="EXACT_ONE" if len(possible)==1 and int(possible[0]["amount_wei"])==expected else "NO_MATCH" if len(possible)==0 else "NONUNIQUE_OR_ROUNDING"
  output.append(c)
 except Exception as err:
  c["error"]=str(err)[:350]
  errors.append({"tx":c["tx"],"error":str(err)[:350]})
  output.append(c)
payout_uses={}
for c in output:
 for p in c.get("matching_treasury_transfers",[]):
  payout_uses.setdefault((p["tx"].lower(),p["block"]),[]).append(c["tx"])
for c in output:
 for p in c.get("matching_treasury_transfers",[]):
  p["candidate_case_count_using_same_payout"]=len(payout_uses[(p["tx"].lower(),p["block"])])
summary={
 "evidence_class":"OBSERVATIONAL_RELAY_FEE_TREASURY_CONTROLS_FROM_LIVE_PUBLIC_RPC",
 "captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chain_id":7295799,"source_rpc":RPC,
 "treasury_address_provenance":"relayer /rayls/info reported at earlier capture, not independent legal identification",
 "token":RLS,"forwarder":FWD,"reported_treasury":TREASURY,
 "server_reported_share_percent_of_base_fee":SHARE_PCT,
 "formula":"reported_treasury_amount = feeEventWei * 15 / 115, where feeEventWei is base fee plus 15% surcharge. Allow ±1 wei for rounding.",
 "window":"fee transaction block through next 25 blocks inclusive",
 "case_count":len(output),
 "paid_cases":sum(int(c["fee"])>0 for c in output),
 "zero_fee_cases":sum(int(c["fee"])==0 for c in output),
 "one_exact_match_cases":sum(c.get("comparison_result")=="EXACT_ONE" for c in output),
 "paid_cases_with_exact_one":sum(c.get("comparison_result")=="EXACT_ONE" and int(c["fee"])>0 for c in output),
 "ambiguous_reused_treasury_tx_candidates":sum(len(p)>1 for p in payout_uses.values()),
 "errors":errors,
 "cases":output,
 "limits":[
  "These are activity-selected public testnet receipts, not a random sample.",
  "The treasury identity and 15% policy are relayer-reported, not independently verified legal Foundation ownership.",
  "Exact matching amounts and temporal proximity support fee reconciliation but do not establish unique causation if multiple fee events share payout timing.",
  "The 15% share applies to base relayer fee, not 15% of the gross RLS fee. It is 15/115 of the gross.",
  "Zero-fee controls must not be forced into a paid-fee match.",
  "Relayer transfers might be delayed or aggregated beyond 25 blocks; no match in this window does not prove nonpayment."
 ]
}
target=ROOT/"evidence/public-rpc/observational/fee-treasury-multi-case-controls.json"
target.write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps({"status":"PASS" if not errors else "PARTIAL",
 "total_cases":summary["case_count"],
 "paid_cases":summary["paid_cases"],"zero_fee_cases":summary["zero_fee_cases"],
 "paid_cases_with_exact_one":summary["paid_cases_with_exact_one"],
 "ambiguous_reused_treasury_tx_candidates":summary["ambiguous_reused_treasury_tx_candidates"],
 "errors":errors[:8],
 "non_matches":[{"case":c["case"],"tx":c["tx"],"fee":c["fee_rls"],"result":c.get("comparison_result")} for c in output if c.get("comparison_result")!="EXACT_ONE"][:15],
 "controlled_cases":[{"case":c["case"],"fee_rls":c["fee_rls"],"treasury":c.get("matching_treasury_transfers")} for c in output if c["case"]!="observed_prior_sample"],
 "saved":str(target)},indent=2))
