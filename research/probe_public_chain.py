#!/usr/bin/env python3
"""Read-only Rayls Public testnet chain identity and block consistency probe.
Evidence class: PUBLIC_RPC_BASELINE, not an Enygma payment experiment.
No keys, wallets, testnet spending, or privileged endpoints required.
"""
import datetime as dt
import hashlib
import json
import pathlib
import sys
import urllib.request

RPC = "https://testnet-rpc.rayls.com/"
EXPECTED_CHAIN = 7295799
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "evidence" / "public-rpc"
OUT.mkdir(parents=True, exist_ok=True)

def rpc(method, params=None):
    payload = json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params or []}).encode()
    req = urllib.request.Request(RPC, data=payload, headers={
        "Content-Type":"application/json",
        "User-Agent":"RaylsQuest3Research/1.0"
    })
    with urllib.request.urlopen(req, timeout=25) as response:
        result = json.load(response)
    if "error" in result:
        raise RuntimeError(f"{method}: {result['error']}")
    if "result" not in result:
        raise RuntimeError(f"{method}: missing result")
    return result["result"]

def main():
    utc = dt.datetime.now(dt.timezone.utc).isoformat()
    cid = int(rpc("eth_chainId"), 16)
    head = int(rpc("eth_blockNumber"), 16)
    blocks = []
    for height in range(max(0, head - 5), head + 1):
        block = rpc("eth_getBlockByNumber", [hex(height), False])
        if not block:
            raise RuntimeError(f"missing block {height}")
        if int(block["number"],16) != height:
            raise RuntimeError(f"height mismatch {height}")
        if blocks and block["parentHash"].lower() != blocks[-1]["hash"].lower():
            raise RuntimeError(f"parent mismatch {height}")
        blocks.append({"number":height, "hash":block["hash"], "parentHash":block["parentHash"],
                       "timestamp":int(block["timestamp"],16),
                       "tx_count":len(block.get("transactions", []))})
    result={"evidence_class":"PUBLIC_RPC_BASELINE_ONLY", "captured_at_utc":utc,
            "rpc":RPC, "chain_id":cid, "expected_chain_id":EXPECTED_CHAIN,
            "identity_pass":cid==EXPECTED_CHAIN,"head":head,
            "six_block_parent_linkage_pass":True, "blocks":blocks,
            "disclaimer":"No Enygma wallet experiment or private payment was executed by this probe."}
    if cid != EXPECTED_CHAIN:
        raise RuntimeError(f"chain mismatch {cid}")
    canonical = json.dumps(result, sort_keys=True, separators=(",",":")).encode()
    result["snapshot_sha256_without_this_field"] = hashlib.sha256(canonical).hexdigest()
    path=OUT/"baseline.json"
    path.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"status":"PASS","evidence_class":result["evidence_class"],
          "chain_id":cid,"head":head,"block_count":len(blocks),
          "saved":str(path),"snapshot_sha256":result["snapshot_sha256_without_this_field"]},indent=2))
    return 0

if __name__=="__main__":
    try: sys.exit(main())
    except Exception as exc:
        print("FAIL",str(exc),file=sys.stderr)
        sys.exit(1)
