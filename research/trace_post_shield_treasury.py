#!/usr/bin/env python3
"""Read-only targeted fee-revenue public-chain trace (not a guarantee of a per-tx Foundation payment).
Search RLS Transfer(relayer, treasury) in a declared post-shield window; cross-check any receipts.
"""
import datetime, json, pathlib, requests, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
SHIELD=json.loads((ROOT/"evidence/public-rpc/controlled/god-shield-40-verified.json").read_text())
RLS=INV["contract_inventory"]["RLS"]["address"]
RELAYER=INV["relayer_report"]["relayer_address"]
TREASURY=INV["relayer_report"]["treasury"]
RPC="https://testnet-rpc.rayls.com/"
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
session=requests.Session()
session.headers.update({"User-Agent":"RaylsQuest3ReadOnlyFeeTrace/1.0"})
def rpc(method,params=[]):
 for attempt in range(3):
  try:
   r=session.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=20)
   r.raise_for_status();a=r.json()
   if "error" in a:raise RuntimeError(str(a["error"]))
   return a["result"]
  except requests.RequestException:
   if attempt==2:raise
def topic(address):return "0x"+address[2:].lower().rjust(64,"0")
start=SHIELD["block_number"]
head=int(rpc("eth_blockNumber"),16)
end=min(start+2500,head)
found=[]
errors=[]
for begin in range(start,end+1,250):
 last=min(begin+249,end)
 try:
  logs=rpc("eth_getLogs",[{"fromBlock":hex(begin),"toBlock":hex(last),"address":RLS,
    "topics":[TRANSFER,topic(RELAYER),topic(TREASURY)]}])
  for log in logs:
   receipt=rpc("eth_getTransactionReceipt",[log["transactionHash"]])
   block=rpc("eth_getBlockByNumber",[log["blockNumber"],False])
   if not receipt or receipt["status"]!="0x1" or receipt["blockHash"].lower()!=block["hash"].lower():
    raise RuntimeError("Mismatched treasury-transfer receipt")
   found.append({"tx_hash":log["transactionHash"],
       "block_number":int(log["blockNumber"],16),
       "timestamp_utc":datetime.datetime.fromtimestamp(int(block["timestamp"],16),datetime.timezone.utc).isoformat(),
       "amount_wei":str(int(log["data"],16)),
       "log_index":int(log["logIndex"],16),"receipt_status":1})
 except Exception as exc:
  errors.append({"start":begin,"end":last,"error":str(exc)[:220]})
result={"evidence_class":"SCOPED_PUBLIC_TREASURY_TRANSFER_SCAN_NOT_PER_PAYMENT_ATTRIBUTION",
  "captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "chain_id":7295799,"rpc":RPC,
  "parent_shield_tx":SHIELD["tx_hash"],
  "starting_block":start,"ending_block":end,"blocks_inclusive":end-start+1,
  "token_address":RLS,"sender_address":RELAYER,"treasury_address":TREASURY,
  "transfers":found,"error_windows":errors,
  "scope_notes":[
    "Matches ERC20 RLS transfers from this relayer to the reported treasury only, within a bounded post-shield window.",
    "No matching transfer is NOT proof that a Foundation payout never happened: another sender, token, contract, batching or later window is possible.",
    "Even a matching amount does not prove unique one-to-one attribution to the studied shield transaction.",
    "Relayer-config treasury is server-reported and not an independently authenticated Foundation identity."
  ]}
output=ROOT/"evidence/public-rpc/controlled/god-shield-fee-treasury-scan.json"
output.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":"PASS" if not errors else "PARTIAL",
  "window":[start,end],"matches":len(found),
  "first_matches":found[:12],"errors":errors,"saved":str(output)},indent=2))
