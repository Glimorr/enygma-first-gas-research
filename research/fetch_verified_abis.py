#!/usr/bin/env python3
"""Retrieve current contract ABIs from Rayls testnet explorer.
No signing, no private keys, and no user-wallet interactions.
"""
import json, pathlib, requests, hashlib, datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
src=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
out=ROOT/"research/verified-abis"
out.mkdir(parents=True,exist_ok=True)
names=("UserRegistry","UserRegistryImplementation","SharedVault",
       "SharedVaultImplementation","RlsGasForwarder","next","RlsVault","UsdrVault")
index={}
for name in names:
    obj=src["contract_inventory"].get(name)
    if obj is None: continue
    address=obj["address"]
    url=f"https://testnet-explorer.rayls.com/api/v2/smart-contracts/{address}"
    r=requests.get(url,headers={"User-Agent":"RaylsQuest3/1.0"},timeout=25)
    r.raise_for_status()
    response=r.json()
    abi=response.get("abi") or []
    filename=out/(name+".json")
    filename.write_text(json.dumps(abi,indent=2)+"\n")
    index[name]={"address":address,"abi_source_url":url,
       "abi_sha256":hashlib.sha256(filename.read_bytes()).hexdigest(),
       "functions":[x.get("name") for x in abi if x.get("type")=="function"],
       "events":[{"name":x.get("name"),"inputs":[p.get("type") for p in x.get("inputs",[])]}
                 for x in abi if x.get("type")=="event"]}
data={"captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"index":index}
(ROOT/"research/verified-abis/manifest.json").write_text(json.dumps(data,indent=2)+"\n")
for name,v in index.items():
    print(name,"events",len(v["events"]),"functions",len(v["functions"]),
          "names",",".join(e["name"] for e in v["events"][:16]))
