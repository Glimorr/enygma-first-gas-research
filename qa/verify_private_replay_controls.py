#!/usr/bin/env python3
"""Controlled historical-state replay experiment: read-only eth_call only.
Exact public transaction calldata tested at state before it mined and the state after.
Positive: earlier state returns ABI bool true. Negative: later state reverts.
NO new transaction is sent, no private keys or invite URL are used.
"""
import datetime,hashlib,json,pathlib,requests,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
VAULT=INV["contract_inventory"]["SharedVault"]["address"]
RPC="https://testnet-rpc.rayls.com/"
CASES=[
 {"name":"private_invite_creation","hash":"0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab","block":24744028},
 {"name":"private_invite_claim","hash":"0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec","block":24747924}
]
client=requests.Session()
client.headers.update({"User-Agent":"RaylsQuest3HistoricalCounterfactualQA/1.0"})
def rpc(method,params):
 for attempt in range(3):
  try:
   result=client.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=35)
   result.raise_for_status()
   return result.json()
  except requests.RequestException:
   if attempt==2:raise
   time.sleep(.5*(attempt+1))
def require(cond,explanation):
 if not cond:raise RuntimeError("REPLAY_CONTROL_FAIL "+explanation)
chain=rpc("eth_chainId",[])["result"]
require(int(chain,16)==7295799,"chain id")
scenarios=[]
for case in CASES:
 tx=rpc("eth_getTransactionByHash",[case["hash"]])["result"]
 rec=rpc("eth_getTransactionReceipt",[case["hash"]])["result"]
 require(tx and rec and tx["to"].lower()==VAULT.lower(),"tx exists and targets same vault")
 require(int(rec["status"],16)==1 and int(rec["blockNumber"],16)==case["block"],"original succeeded at expected block")
 block=rpc("eth_getBlockByNumber",[rec["blockNumber"],False])["result"]
 require(rec["blockHash"].lower()==block["hash"].lower(),"block hash")
 request={
  "to":tx["to"],"from":tx["from"],
  "data":tx["input"],"value":tx["value"],"gas":hex(10000000)
 }
 publicDataHash="0x"+hashlib.sha256(bytes.fromhex(tx["input"][2:])).hexdigest()
 checks=[]
 for name,blockNumber in [
  ("original_state_immediately_before",case["block"]-1),
  ("original_state_immediately_after",case["block"]),
  ("state_one_block_later",case["block"]+1)
 ]:
  response=rpc("eth_call",[request,hex(blockNumber)])
  if "result" in response:
   success=response["result"]=="0x"+("0"*63)+"1"
   data={"stage":name,"queriedBlock":blockNumber,"rpcResultClass":"SUCCESS",
       "returnData":response["result"],"returnedTrue":success}
  elif "error" in response:
   data={"stage":name,"queriedBlock":blockNumber,"rpcResultClass":"REVERT",
    "rpcErrorCode":response["error"].get("code"),
    "rpcErrorMessage":response["error"].get("message"),
    "rpcErrorData":str(response["error"].get("data",""))[:150]}
  else:raise RuntimeError("Unrecognized eth_call response: "+str(response)[:200])
  checks.append(data)
 require(checks[0]["rpcResultClass"]=="SUCCESS" and checks[0]["returnedTrue"],"historical positive control must return true")
 require(all(x["rpcResultClass"]=="REVERT" and
   "revert" in x["rpcErrorMessage"].lower() for x in checks[1:]),"replay must fail after original tx")
 scenarios.append({
  "case":case["name"],"originalTxHash":case["hash"],
  "originalBlockNumber":case["block"],"originalStatus":1,
  "contract":VAULT,"txMethodSelector":tx["input"][:10],
  "sameCalldataSha256":publicDataHash,
  "sameOriginalSender":tx["from"],"sameOriginalCallTarget":tx["to"],
  "sameCallValueWei":str(int(tx["value"],16)),
  "simulationGasCap":10000000,
  "readOnlyHistoricalSimulations":checks
 })
result={
 "evidence_class":"RESEARCHER_CONTROLLED_READ_ONLY_HISTORICAL_STATE_REPLAY_POSITIVE_AND_NEGATIVE",
 "createdUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,"publicRpc":RPC,"liveTransactions":0,
 "originalSuccessfulTransactions":len(scenarios),
 "historicalCounterfactualCalls":sum(len(s["readOnlyHistoricalSimulations"]) for s in scenarios),
 "preStatePositiveControls":len(scenarios),"postStateNegativeControls":len(scenarios)*2,
 "cases":scenarios,
 "interpretation":"The same call data returns true immediately before mining but reverts at and after the mined block. This supports state-dependent replay prevention, consistent with nullifier consumption in the transaction receipt.",
 "limits":[
  "An eth_call is a noncommitting simulation; it creates no transaction or gas charge.",
  "This comparison does not isolate the precise revert cause. Other changing chain state may affect the call.",
  "It is not a security proof for all replay variants or adversarial cases.",
  "The original proof and input calldata are already public chain data. No invitation bearer link, passkey or private note key is used."
 ]
}
target=ROOT/"evidence/public-rpc/controlled/claim-invite-historical-replay-controls.json"
target.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":"PASS","cases":len(scenarios),"positive":len(scenarios),
 "negative":len(scenarios)*2,"actualNewTransactions":0,
 "results":[{"name":s["case"],"calls":[c["rpcResultClass"] for c in s["readOnlyHistoricalSimulations"]]} for s in scenarios],
 "saved":str(target)},indent=2))
