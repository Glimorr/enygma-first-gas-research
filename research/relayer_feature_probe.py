#!/usr/bin/env python3
"""Read-only relayer information and faucet route feasibility snapshot.
Does NOT call /faucet or submit any transaction.
"""
import datetime, json, pathlib, requests
root=pathlib.Path(__file__).resolve().parents[1]
base="https://enygma-relayer-aafjr.ondigitalocean.app/rayls"
session=requests.Session()
session.headers.update({"User-Agent":"RaylsQuest3ReadOnlyResearch/1.0"})
pilot="0x9047105CC586dE38dE36CEBdC0bbaCC9d25C51B8"
info=session.get(base+"/info",timeout=20)
info.raise_for_status()
faucet=session.post(base+"/faucet-status",json={"address":pilot},timeout=20)
faucet.raise_for_status()
policy=info.json()
offers=faucet.json()
if policy.get("chainId")!=7295799: raise RuntimeError("Unexpected relayer chain")
expected={"rls","stable","shielded-rls","shielded-stable"}
kinds=set(offers.get("kinds",{}))
if not expected.issubset(kinds): raise RuntimeError("Missing a documented faucet funding route")
result={"captured_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "evidence_class":"RELAYER_REPORTED_PUBLIC_FEATURE_AND_FEE_POLICY",
 "relayer_info_endpoint":base+"/info","read_only_faucet_status_endpoint":base+"/faucet-status",
 "research_pilot_public_account":pilot,
 "info":policy,"offers":offers,
 "checks":{"chain_id_matches":True,"all_four_faucet_kinds_advertised":True},
 "caveat":"This is a read-only relayer response. It does not prove any faucet funding, invite claiming, or shielded payment was executed."}
dest=root/"evidence/public-rpc/relayer-feature-snapshot.json"
dest.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
print(json.dumps({"status":"PASS","chain_id":policy["chainId"],
  "faucet_options":list(sorted(kinds)),"file":str(dest)},indent=2))
