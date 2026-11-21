#!/usr/bin/env python3
"""Identify invitation transaction by PUBLIC transaction prefix from owner's screenshot.
Do not use, persist or import an invitation claim URL or key.
"""
import requests, json, pathlib, datetime, collections
ROOT=pathlib.Path("/mnt/e/Rayls-Nov-Week3")
inv=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
addresses=[inv["contract_inventory"]["SharedVault"]["address"],inv["relayer_report"]["active_forwarder"]]
base=24738801
prefix="0x6beefec2"
s=requests.Session();s.headers["User-Agent"]="RaylsQuest3PublicSearchNoSecrets/1.0"
def rpc(m,p=[]):
 r=s.post("https://testnet-rpc.rayls.com/",json={"jsonrpc":"2.0","method":m,"params":p,"id":1},timeout=24)
 r.raise_for_status()
 o=r.json()
 if "error" in o:raise RuntimeError(str(o["error"]))
 return o["result"]
height=int(rpc("eth_blockNumber"),16)
seen=collections.defaultdict(lambda:{"blocks":set(),"addresses":set(),"topics":set(),"count":0})
errors=[]
for start in range(base,height+1,400):
 end=min(start+399,height)
 try:
  logs=rpc("eth_getLogs",[{"fromBlock":hex(start),"toBlock":hex(end),"address":addresses}])
  for log in logs:
   h=log["transactionHash"].lower()
   rec=seen[h];rec["blocks"].add(int(log["blockNumber"],16));rec["addresses"].add(log["address"].lower())
   rec["topics"].add(log["topics"][0] if log.get("topics") else None);rec["count"]+=1
 except Exception as exc:
  errors.append({"from":start,"to":end,"error":str(exc)[:200]})
matching=[{"tx":tx, "blocks":sorted(v["blocks"]), "count":v["count"], "addresses":sorted(v["addresses"])} for tx,v in seen.items() if tx.startswith(prefix)]
candidate=[{"tx":tx,"block":min(v["blocks"]),"vault":inv["contract_inventory"]["SharedVault"]["address"].lower() in v["addresses"],"count":v["count"]} for tx,v in seen.items() if max(v["blocks"])>=height-1500]
candidate.sort(key=lambda x:x["block"],reverse=True)
result={"status":"PASS" if not errors else "PARTIAL","capturedAtUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
"chainId":7295799,"fromBlock":base,"toBlock":height,"scannedContracts":addresses,
"prefixSearch":prefix,"matched":matching,"distinctTxs":len(seen),
"recentCandidateTxs":candidate[:35],"rpcErrors":errors,"publicDataOnly":True}
outfile=ROOT/"evidence/public-rpc/controlled/invitation-public-discovery.json"
outfile.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":result["status"],"height":height,"public_tx_count":len(seen),
"matching":matching,"rpc_errors":errors[:5],"recent_candidates":candidate[:18],"saved":str(outfile)},indent=2))
