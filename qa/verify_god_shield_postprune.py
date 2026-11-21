#!/usr/bin/env python3
"""After historical eth_call state is pruned, independently reconstruct the
public RLS balance at an earlier shield block from current chain state and
all later ERC20 Transfer logs involving the address. Fresh public RPC only.

This is EVENT-BASED reconstruction and is not a claim that old state remains
directly queryable or that explorer indexing alone is complete.
"""
import datetime,json,pathlib,requests,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
B=json.loads((ROOT/"evidence/public-rpc/controlled/god-shield-40-verified.json").read_text())
I=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
TOKEN=I["contract_inventory"]["RLS"]["address"]
VAULT=I["contract_inventory"]["SharedVault"]["address"]
RELAYER=I["relayer_report"]["relayer_address"]
ACCOUNT=B["controlled_account"]
HASH=B["tx_hash"]
ORIGINAL_BLOCK=B["block_number"]
RPC="https://testnet-rpc.rayls.com/"
TOPIC="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
session=requests.Session()
session.headers.update({"User-Agent":"RaylsQuest3PrunedHistoricEventReconstruction/1.0"})
def call(method,params=[]):
 for i in range(3):
  try:
   r=session.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=25)
   r.raise_for_status();o=r.json()
   return o
  except requests.RequestException:
   if i==2:raise
   time.sleep(.5*(i+1))
def rpc(method,params=[]):
 v=call(method,params)
 if "error" in v:raise RuntimeError(method+" error: "+str(v["error"]))
 return v["result"]
def topic(a):return "0x"+a[2:].lower().rjust(64,"0")
def require(ok,message):
 if not ok:raise RuntimeError("RECONSTRUCTION_FAILED "+message)
require(int(rpc("eth_chainId"),16)==7295799,"chain ID")
head=int(rpc("eth_blockNumber"),16)
require(head>ORIGINAL_BLOCK,"chain has not advanced past original receipt")
ownerTopic=topic(ACCOUNT)
def erc20Balance(height):
 res=rpc("eth_call",[{"to":TOKEN,"data":"0x70a08231"+ACCOUNT[2:].lower().rjust(64,"0")},hex(height)])
 return int(res,16)
current=erc20Balance(head)
receipt=rpc("eth_getTransactionReceipt",[HASH]);tx=rpc("eth_getTransactionByHash",[HASH])
block=rpc("eth_getBlockByNumber",[receipt["blockNumber"],False])
require(tx is not None and receipt["status"]=="0x1","original tx succeeded")
require(int(receipt["blockNumber"],16)==ORIGINAL_BLOCK and receipt["blockHash"]==block["hash"],"source block")
require(receipt["transactionHash"].lower()==HASH.lower(),"source hash")
originalTransfers=[]
for log in receipt["logs"]:
 if log["address"].lower()!=TOKEN.lower() or log["topics"][0].lower()!=TOPIC:continue
 originalTransfers.append({"from":"0x"+log["topics"][1][-40:],"to":"0x"+log["topics"][2][-40:],
  "valueWei":int(log["data"],16),"tx":log["transactionHash"]})
ownerSpent=[x for x in originalTransfers if x["from"].lower()==ACCOUNT.lower()]
require(len(ownerSpent)==2,"exactly two RLS transfers from owner")
deposit=[x for x in ownerSpent if x["to"].lower()==VAULT.lower()]
fee=[x for x in ownerSpent if x["to"].lower()==RELAYER.lower()]
require(len(deposit)==1 and len(fee)==1,"vault principal and fee transfers")
require(deposit[0]["valueWei"]==40*10**18,"40 RLS principal exact")
require(fee[0]["valueWei"]==int(B["relayer_fee_wei"]),"fee agrees with original saved verified receipt")
delta=deposit[0]["valueWei"]+fee[0]["valueWei"]
laterEvents=[]
windowScans=[]
for start in range(ORIGINAL_BLOCK+1,head+1,450):
 end=min(head,start+449)
 ranges=[("out",[TOPIC,ownerTopic]),("in",[TOPIC,None,ownerTopic])]
 for direction,topics in ranges:
  found=rpc("eth_getLogs",[{"fromBlock":hex(start),"toBlock":hex(end),
    "address":TOKEN,"topics":topics}])
  windowScans.append({"start":start,"end":end,"direction":direction,"matches":len(found)})
  for log in found:
   require(log["topics"][0].lower()==TOPIC and log["address"].lower()==TOKEN.lower(),
     "unexpected scan log")
   if direction=="out":require(log["topics"][1].lower()==ownerTopic,"scan out topic")
   else:require(log["topics"][2].lower()==ownerTopic,"scan in topic")
   laterEvents.append({
    "from":"0x"+log["topics"][1][-40:],"to":"0x"+log["topics"][2][-40:],
    "valueWei":str(int(log["data"],16)),
    "tx":log["transactionHash"],"block":int(log["blockNumber"],16),"logIndex":int(log["logIndex"],16)})
# Deduplicate self-transfer logs returned by both directional queries.
laterEvents=list({(x["tx"].lower(),x["logIndex"]):x for x in laterEvents}.values())
netAfterOriginal=sum(int(x["valueWei"])*(1 if x["to"].lower()==ACCOUNT.lower() else -1) for x in laterEvents)
reconstructedAfter=current-netAfterOriginal
reconstructedBefore=reconstructedAfter+delta
require(str(reconstructedAfter)==B["public_rls_after_wei"],"event-reconstructed after balance disagrees with frozen verified value")
require(str(reconstructedBefore)==B["public_rls_before_wei"],"event-reconstructed before balance disagrees with frozen verified value")
require(reconstructedBefore-reconstructedAfter==delta,"principal + fee balance delta arithmetic")
# Try the historical query explicitly, but PRUNED state is an expected outcome.
historical=call("eth_call",[{"to":TOKEN,"data":"0x70a08231"+ACCOUNT[2:].lower().rjust(64,"0")},
 hex(ORIGINAL_BLOCK)])
directAvailable="result" in historical
if directAvailable:
 require(int(historical["result"],16)==reconstructedAfter,"direct historic state inconsistent with event reconstruction")
elif "error" in historical:
 require("pruned" in str(historical["error"]).lower() or
  "historical" in str(historical["error"]).lower(),"unrecognized historical RPC error")
else:raise RuntimeError("Unrecognized historical eth_call response")
# Independent indexer corroboration on the same address, current and full page.
explorerUrl="https://testnet-explorer.rayls.com/api/v2/addresses/"+ACCOUNT+"/token-transfers"
resp=session.get(explorerUrl,timeout=20);resp.raise_for_status();indexed=resp.json()
if indexed.get("next_page_params"):raise RuntimeError("Indexer pagination incomplete")
indexedRls=[x for x in indexed.get("items",[]) if
 (x.get("token") or {}).get("address_hash","").lower()==TOKEN.lower()]
indexedAfter=[x for x in indexedRls if int(x["block_number"])>ORIGINAL_BLOCK]
rpcEventKeys={(x["tx"].lower(),x["logIndex"]) for x in laterEvents}
indexKeys={(x["transaction_hash"].lower(),int(x["log_index"])) for x in indexedAfter}
require(rpcEventKeys==indexKeys,"indexer vs independent RPC Transfer scans disagreement")
result={
 "evidence_class":"LIVE_RPC_CURRENT_BALANCE_PLUS_COMPLETE_POST_EVENT_RECONSTRUCTION__HISTORICAL_STATE_MAY_BE_PRUNED",
 "verifiedAtUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,"account":ACCOUNT,"token":TOKEN,
 "originalTxHash":HASH,"originalBlock":ORIGINAL_BLOCK,"latestBlock":head,
 "latestAccountRlsWei":str(current),
 "laterTransferEventCount":len(laterEvents),
 "laterAccountRlsTransferEvents":laterEvents,
 "rpcTransferSearchRequests":len(windowScans),
 "allDirectionalTransferWindowsQueried":True,
 "explorerPaginationComplete":True,"indexerTransferEventMatch":True,
 "reconstructedAfterWei":str(reconstructedAfter),
 "reconstructedBeforeWei":str(reconstructedBefore),
 "principalWei":str(deposit[0]["valueWei"]),
 "feeWei":str(fee[0]["valueWei"]),
 "directHistoricalStateQueryAvailable":directAvailable,
 "historicalQueryErrorIfPruned":historical.get("error") if not directAvailable else None,
 "result":"PASS_WITH_LIVE_EVENT_RECONSTRUCTION",
 "limits":[
  "This independently reconstructs prior balance from live current state and all intervening ERC20 Transfer logs, not from direct archived ERC20 state if pruned.",
  "A provider's indexer completeness is corroborating evidence; event logs were also independently searched with two directional topic filters over the complete interval.",
  "Other token mechanisms that alter balance without emitting Transfer could violate event-based accounting. No such mechanism is established for these inspected receipts.",
  "Original fixed-block balance snapshots are preserved with the capture timestamps; these snapshots cannot automatically become freshly authenticated state once provider pruning occurs."
 ]
}
target=ROOT/"evidence/public-rpc/controlled/god-shield-postprune-event-reconstruction.json"
target.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":result["result"],"currentBlock":head,
 "originalBlock":ORIGINAL_BLOCK,
 "historicDirectCallAvailable":directAvailable,
 "laterPublicRlsTransfers":len(laterEvents),
 "reconstructedBeforeRls":str(reconstructedBefore/10**18),
 "reconstructedAfterRls":str(reconstructedAfter/10**18),
 "rpcTopicWindowCalls":len(windowScans),"saved":str(target)},indent=2))
