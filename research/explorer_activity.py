#!/usr/bin/env python3
"""Probe recent indexed public contract activity without claiming researcher control."""
import json, pathlib, requests, datetime
root=pathlib.Path(__file__).resolve().parents[1]
inventory=json.loads((root/"evidence/public-rpc/contract-inventory.json").read_text())
api="https://testnet-explorer.rayls.com/api/v2"
session=requests.Session();session.headers["User-Agent"]="RaylsQuest3/1.0"
out={}
for name in ("UserRegistry","SharedVault","RlsVault","UsdrVault","next"):
 addr=inventory["contract_inventory"][name]["address"]
 url=f"{api}/addresses/{addr}/logs"
 try:
  response=session.get(url,timeout=30);response.raise_for_status()
  x=response.json();items=x.get("items",[])
  out[name]={"address":addr,"recent_log_count_page":len(items),
    "recent":[{"transaction_hash":e.get("tx_hash") or e.get("transaction_hash"),
      "block_number":e.get("block_number"),
      "timestamp":e.get("timestamp"),"topics":e.get("topics",[])[:1]}
      for e in items[:10]],"has_next_page":x.get("next_page_params") is not None}
 except Exception as exc:
  out[name]={"address":addr,"error":str(exc)}
data={"captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "evidence_class":"PUBLIC_EXPLORER_INDEXED_ACTIVITY",
      "explorer_api_base":api,
      "note":"Log timestamps and metadata are indexer outputs, not fresh RPC verification.",
      "contracts":out}
dest=root/"evidence/public-rpc/explorer-recent-activity.json"
dest.write_text(json.dumps(data,indent=2)+"\n")
for name,value in out.items():
 print(name,"recent_page_logs",value.get("recent_log_count_page"),
       "latest_block",(value.get("recent") or [{}])[0].get("block_number"),
       "error",value.get("error"))
print("saved",dest)
