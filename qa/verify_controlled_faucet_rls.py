#!/usr/bin/env python3
"""Independent receipt verification for one authorized public testnet faucet request."""
import datetime, json, pathlib, requests, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
ONE=ROOT/"evidence/public-rpc/controlled/faucet-rls-request.json"
PRE=ROOT/"evidence/public-rpc/controlled/clean-local-burners-baseline.json"
OUT=ROOT/"evidence/public-rpc/controlled/verified-faucet-rls-receipt.json"
req=json.loads(ONE.read_text())
base=json.loads(PRE.read_text())
account=base["accounts"]["local_dev_new_public_control"]["address"]
receiver=base["accounts"]["local_hub_unfunded_public_receiver"]["address"]
hash=req["request_body"]["rls"]["hash"]
expected=int(req["request_body"]["rls"]["amount"])
RLS="0x07e17e17e17e17e17e17e17e17e17e17e17e17ea"
RPC="https://testnet-rpc.rayls.com/"
session=requests.Session()
session.headers["User-Agent"]="RaylsQuest3ControlledIndependentVerifier/1.0"
def rpc(method,params=[]):
 r=session.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=25)
 r.raise_for_status(); result=r.json()
 if result.get("error"):raise RuntimeError(result["error"])
 return result["result"]
def erc20_balance(addr,tag):
 data="0x70a08231"+addr[2:].lower().zfill(64)
 return int(rpc("eth_call",[{"to":RLS,"data":data},tag]),16)
cid=int(rpc("eth_chainId"),16)
if cid!=7295799:raise RuntimeError("Wrong chain")
rec=rpc("eth_getTransactionReceipt",[hash])
if not rec:raise RuntimeError("Receipt not mined yet, do not retry faucet")
tx=rpc("eth_getTransactionByHash",[hash])
block=rpc("eth_getBlockByNumber",[rec["blockNumber"],True])
if not tx or not block:raise RuntimeError("Missing tx or block")
if block["hash"].lower()!=rec["blockHash"].lower():raise RuntimeError("Receipt block hash mismatch")
if tx["blockHash"].lower()!=rec["blockHash"].lower():raise RuntimeError("Transaction block hash mismatch")
if not any(t["hash"].lower()==hash.lower() for t in block["transactions"]):
 raise RuntimeError("Faucet tx missing from block")
if int(rec["status"],16)!=1:raise RuntimeError("Faucet receipt reverted")
transfer_topic="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
matching=[]
for log in rec["logs"]:
 if log["address"].lower()!=RLS:continue
 if len(log["topics"])<3 or log["topics"][0].lower()!=transfer_topic:continue
 to="0x"+log["topics"][2][-40:]
 amount=int(log["data"],16)
 if to.lower()==account.lower():
  matching.append({"from":"0x"+log["topics"][1][-40:],"to":to,"valueWei":str(amount),
    "logIndex":int(log["logIndex"],16),"logHash":log["transactionHash"]})
if sum(int(e["valueWei"]) for e in matching)!=expected:
 raise RuntimeError("ERC-20 transfer amounts do not reconcile with faucet response")
height=int(rec["blockNumber"],16)
before="0x"+str(hex(height-1))[2:]
after=rec["blockNumber"]
balances={}
for name,addr in [("funded_control",account),("unfunded_receiver",receiver)]:
 balances[name]={
  "address":addr,
  "RLS_before_wei":str(erc20_balance(addr,before)),
  "RLS_after_wei":str(erc20_balance(addr,after)),
  "native_USDr_after_wei":str(int(rpc("eth_getBalance",[addr,after]),16)),
  "nonce_after":int(rpc("eth_getTransactionCount",[addr,after]),16)}
if int(balances["unfunded_receiver"]["RLS_after_wei"])!=0 or int(balances["unfunded_receiver"]["native_USDr_after_wei"])!=0:
 raise RuntimeError("Unfunded receiver unexpectedly funded")
if int(balances["funded_control"]["RLS_after_wei"])-int(balances["funded_control"]["RLS_before_wei"])!=expected:
 raise RuntimeError("Control pre/post balance difference does not match faucet allocation")
snapshot={
 "evidence_class":"CONTROLLED_PUBLIC_TESTNET_FAUCET__LIVE_RPC_FULL_RECEIPT_AND_TOKEN_TRANSFER_VERIFIED",
 "captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chain_id":cid,"source_faucet_response_file":str(ONE.relative_to(ROOT)),
 "transaction_hash":hash,"explorer_link":"https://testnet-explorer.rayls.com/tx/"+hash,
 "block_number":height,"block_hash":rec["blockHash"],
 "block_timestamp_utc":datetime.datetime.fromtimestamp(int(block["timestamp"],16),datetime.timezone.utc).isoformat(),
 "tx_from":tx["from"],"tx_to":tx["to"],
 "tx_nonce":int(tx["nonce"],16),"receipt_status":int(rec["status"],16),
 "receipt_gas_used":str(int(rec["gasUsed"],16)),
 "token_transfer_logs":matching,
 "faucet_reported_amount_wei":str(expected),
 "balances_at_before_after":balances,
 "receipt_verified_in_fresh_block":True,
 "important_scope":"Public faucet allocation to old local Dev key with fresh Rayls Public testnet history; receiver untouched. This is NOT an Enygma private invitation or payment.",
 "raw_rpc":{"transaction":tx,"receipt":rec,
  "block_summary":{"hash":block["hash"],"number":block["number"],"timestamp":block["timestamp"],
   "transaction_count":len(block["transactions"])}}
}
OUT.write_text(json.dumps(snapshot,indent=2)+"\n")
print(json.dumps({"status":"PASS","tx_hash":hash,"block":height,
 "verified_transfer_RLS":str(expected/10**18),
 "dev_RLS_before":str(int(balances["funded_control"]["RLS_before_wei"])/10**18),
 "dev_RLS_after":str(int(balances["funded_control"]["RLS_after_wei"])/10**18),
 "hub_RLS_after":balances["unfunded_receiver"]["RLS_after_wei"],
 "hub_native_USDr_after":balances["unfunded_receiver"]["native_USDr_after_wei"],
 "file":str(OUT)},indent=2))
