#!/usr/bin/env python3
"""Cross-source source-verification metadata for current Rayls Public deployment.
Uses live JSON RPC and Blockscout explorer API (not a local bytecode rebuild).
"""
import pathlib,json,requests,hashlib,datetime,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
inv=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
out=ROOT/"evidence/public-rpc/explorer-source-summary.json"
explorer="https://testnet-explorer.rayls.com/api/v2"
names=["UserRegistry","UserRegistryImplementation","SharedVault",
       "SharedVaultImplementation","RlsVault","UsdrVault","RLS","next"]
session=requests.Session()
session.headers["User-Agent"]="RaylsQuest3-IndependentVerifier/1.0"
results={}
for name in names:
  entry=inv["contract_inventory"].get(name)
  if not entry:
    results[name]={"error":"Not in captured deployment map"}
    continue
  addr=entry["address"]
  record={"address":addr,"rpc_has_code":entry["code_hex_bytes"]>0,
          "rpc_code_sha256":entry["code_sha256"],
          "eip1967_implementation":entry["eip1967_implementation"]}
  try:
    res=session.get(explorer+"/addresses/"+addr,timeout=20)
    res.raise_for_status()
    x=res.json()
    record.update({"explorer_contract_name":x.get("name"),
                   "explorer_is_contract":x.get("is_contract"),
                   "explorer_is_verified":x.get("is_verified"),
                   "explorer_creation_tx":x.get("creation_transaction_hash"),
                   "explorer_proxy_type":x.get("proxy_type")})
    if x.get("is_verified"):
      detail=session.get(explorer+"/smart-contracts/"+addr,timeout=25)
      detail.raise_for_status()
      y=detail.json()
      record["explorer_source_metadata"]={
        "name":y.get("name"),"compiler_version":y.get("compiler_version"),
        "language":y.get("language"),"optimization_enabled":y.get("optimization_enabled"),
        "source_sha256":hashlib.sha256((y.get("source_code") or "").encode()).hexdigest(),
        "abi_sha256":hashlib.sha256(json.dumps(y.get("abi"),sort_keys=True).encode()).hexdigest()
      }
  except Exception as exc:
    record["explorer_error"]=str(exc)
  results[name]=record
data={"captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "evidence_class":"PUBLIC_RPC_CROSSCHECK_WITH_EXPLORER_METADATA",
      "sources":["https://testnet-rpc.rayls.com/","https://testnet-explorer.rayls.com/api/v2"],
      "items":results,
      "caveat":"Explorer's verified flag is a service assertion. No locally rebuilt compiler output has been compared to chain bytecode."}
out.write_text(json.dumps(data,indent=2,sort_keys=True)+"\n")
print(json.dumps({"items":len(results),"verified_count":sum(r.get("explorer_is_verified") is True for r in results.values()),
"source_file":str(out),"warnings":[n for n,r in results.items() if r.get("explorer_error")]},indent=2))
