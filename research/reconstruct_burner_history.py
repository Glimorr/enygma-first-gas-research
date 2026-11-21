#!/usr/bin/env python3
"""User-provided preexisting Rayls testnet burner: public history and receipt reconstruction.
Explorer is discovery; inclusion/status/blocks are freshly checked with JSON-RPC.
No signing, credentials, private account data, or calls to faucet.
"""
import datetime as dt
import json, pathlib, requests
ROOT=pathlib.Path(__file__).resolve().parents[1]
ADDRESS="0xfE64D1860ee4bF7986D165Ad105d2eD404E7a1F2"
RPC="https://testnet-rpc.rayls.com/"
EXPLORER="https://testnet-explorer.rayls.com/api/v2"
s=requests.Session()
s.headers["User-Agent"]="RaylsQuest3ReadOnlyResearch/1.0"
def get(url):
 r=s.get(url,timeout=25); r.raise_for_status(); return r.json()
def rpc(method,params=[]):
 r=s.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=25)
 r.raise_for_status(); j=r.json()
 if j.get("error"):raise RuntimeError(j["error"])
 return j["result"]
def addr(a):
 if not a:return None
 return a.get("hash") if isinstance(a,dict) else a
def lite_transfer(row):
 return {
  "token_symbol":(row.get("token") or {}).get("symbol"),
  "token_address":(row.get("token") or {}).get("address_hash"),
  "transaction_hash":row.get("tx_hash"),
  "block_number":row.get("block_number"),
  "from":addr(row.get("from")),"to":addr(row.get("to")),
  "total":row.get("total"),"type":row.get("type"),
 }
def lite_explorer_tx(row):
 return {
  "hash":row.get("hash"),"block_number":row.get("block_number"),
  "timestamp":row.get("timestamp"),"from":addr(row.get("from")),
  "to":addr(row.get("to")),"status":row.get("status"),
  "gas_used":row.get("gas_used"),"value":row.get("value")
 }
head=rpc("eth_getBlockByNumber",["latest",False])
scope=hex(int(head["number"],16))
tx_index=get(f"{EXPLORER}/addresses/{ADDRESS}/transactions")
token_index=get(f"{EXPLORER}/addresses/{ADDRESS}/token-transfers")
txs=tx_index.get("items",[])
reconstructed=[]
missing_rpc=[]
for t in txs[:30]:
 h=t["hash"]
 receipt=rpc("eth_getTransactionReceipt",[h])
 if not receipt:
  missing_rpc.append({"hash":h,"explorer":lite_explorer_tx(t),
   "evidence_class":"EXPLORER_INDEXED_ONLY_RPC_RECEIPT_UNAVAILABLE"})
  continue
 block=rpc("eth_getBlockByNumber",[receipt["blockNumber"],True])
 if block["hash"].lower()!=receipt["blockHash"].lower():raise RuntimeError("Block hash mismatch: "+h)
 if not any(x["hash"].lower()==h.lower() for x in block["transactions"]):
  raise RuntimeError("Receipt transaction not included: "+h)
 raw=rpc("eth_getTransactionByHash",[h])
 if not raw or raw["blockHash"].lower()!=receipt["blockHash"].lower():
  raise RuntimeError("Tx receipt hash mismatch: "+h)
 reconstructed.append({
  "explorer":lite_explorer_tx(t),
  "rpc_transaction":{
    "hash":h,"from":raw["from"],"to":raw["to"],"nonce":int(raw["nonce"],16),
    "value_wei":str(int(raw["value"],16)),"input_method_selector":raw["input"][:10],
    "block_number":int(raw["blockNumber"],16),
  },
  "rpc_receipt":{
    "status":int(receipt["status"],16),"gas_used":str(int(receipt["gasUsed"],16)),
    "effective_gas_price":str(int(receipt.get("effectiveGasPrice") or "0x0",16)),
    "block_number":int(receipt["blockNumber"],16),
    "block_hash":receipt["blockHash"],
    "logs_count":len(receipt["logs"]),
    "event_addresses":sorted(set(l["address"] for l in receipt["logs"])),
  },
  "block_timestamp_utc":dt.datetime.fromtimestamp(int(block["timestamp"],16),dt.timezone.utc).isoformat(),
  "included_in_fresh_block":True
 })
result={
 "evidence_class":"EXPLORER_DISCOVERED_PUBLIC_BURNER_HISTORY_FRESH_RPC_RECONSTRUCTED",
 "captured_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
 "chain_id":int(rpc("eth_chainId"),16),
 "account":ADDRESS,
 "snapshot_block":{"number":int(scope,16),"hash":head["hash"]},
 "explorer_transactions":len(txs),
 "explorer_transactions_pagination_complete":tx_index.get("next_page_params") is None,
 "token_transfer_items":[lite_transfer(t) for t in token_index.get("items",[])],
 "token_transfers_pagination_complete":token_index.get("next_page_params") is None,
 "verified_transactions":reconstructed,
 "rpc_receipt_unavailable_transactions":missing_rpc,
 "limitations":[
  "This account was funded before the Quest 3 controlled trials and cannot serve as an unfunded receiver.",
  "The testnet explorer discovered tx hashes; full receipts and block inclusion were rechecked independently with live RPC.",
  "No encrypted private balances are inferred from these transaction receipts."
 ]
}
if result["chain_id"]!=7295799:raise RuntimeError("Chain ID mismatch")
out=ROOT/"evidence/public-rpc/burner-history.json"
out.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({
 "status":"PASS","transactions_verified":len(reconstructed),
 "rpc_receipt_unavailable":len(missing_rpc),
 "token_transfer_items":len(result["token_transfer_items"]),
 "pagination_complete":result["explorer_transactions_pagination_complete"],
 "transactions":[{
  "hash":x["rpc_transaction"]["hash"],"status":x["rpc_receipt"]["status"],
  "from":x["rpc_transaction"]["from"],"to":x["rpc_transaction"]["to"],
  "block":x["rpc_transaction"]["block_number"],"method":x["rpc_transaction"]["input_method_selector"]
 } for x in reconstructed],
 "saved":str(out)
},indent=2))
