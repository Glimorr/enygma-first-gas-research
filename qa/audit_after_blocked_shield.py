#!/usr/bin/env python3
"""Read-only public chain check after blocked 40 RLS shield dry runs.
No private keys, signing or wallet interaction.
"""
import datetime,json,pathlib,requests
ROOT=pathlib.Path(__file__).resolve().parents[1]
DEV="0x1AcC448116C00A16bBfCE8f9d280aaA4D3Ad4FF6"
HUB="0xa7EB60a22240FCa3D684f1B96dFE3f68a8cfC38A"
REG_BLOCK=24735856
RPC="https://testnet-rpc.rayls.com/"
x=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
RLS=x["contract_inventory"]["RLS"]["address"]
SHARED=x["contract_inventory"]["SharedVault"]["address"]
session=requests.Session()
session.headers["User-Agent"]="RaylsQuest3ReadOnlySafetyAudit/1.0"
def call(method,params=[]):
 r=session.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":params},timeout=20)
 r.raise_for_status();b=r.json()
 if "error" in b:raise RuntimeError(b["error"])
 return b["result"]
def balance(account,tag):
 data="0x70a08231"+account[2:].lower().zfill(64)
 return int(call("eth_call",[{"to":RLS,"data":data},tag]),16)
head=call("eth_getBlockByNumber",["latest",False])
height=int(head["number"],16)
if height<REG_BLOCK:raise RuntimeError("Chain moved backward")
if int(call("eth_chainId"),16)!=7295799:raise RuntimeError("Wrong chain")
topic0="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
fromtopic="0x"+DEV[2:].lower().rjust(64,"0")
outgoing=[]
for start in range(REG_BLOCK+1,height+1,500):
 end=min(start+499,height)
 logs=call("eth_getLogs",[{"address":RLS,
   "fromBlock":hex(start),"toBlock":hex(end),"topics":[topic0,fromtopic]}])
 for log in logs:
  outgoing.append({"txHash":log["transactionHash"],"blockNumber":int(log["blockNumber"],16),
   "to":"0x"+log["topics"][2][-40:],"valueWei":str(int(log["data"],16))})
starting=balance(DEV,hex(REG_BLOCK))
current=balance(DEV,head["number"])
hub=balance(HUB,head["number"])
hubnative=int(call("eth_getBalance",[HUB,head["number"]]),16)
record={"evidenceClass":"CONTROLLED_WALLET_POST_DRYRUN_PUBLIC_CHAIN_SAFETY_CHECK",
 "capturedAtUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,"devAddress":DEV,"hubAddress":HUB,
 "fromBlockExclusive":REG_BLOCK,"toBlockInclusive":height,"endBlockHash":head["hash"],
 "devRlsAtRegistrationWei":str(starting),"devRlsNowWei":str(current),
 "hubRlsNowWei":str(hub),"hubNativeUsdrWei":str(hubnative),
 "outgoingRlsTransfersAfterRegistration":outgoing,
 "outgoingRlsToSharedVault":[e for e in outgoing if e["to"].lower()==SHARED.lower()],
 "scope":"Read-only public ERC-20 Transfer event scan and fixed-block balance checks; no private note state proven.",
 "noShieldTransactionInCheckedWindow":len([e for e in outgoing if e["to"].lower()==SHARED.lower()])==0}
dest=ROOT/"evidence/public-rpc/controlled/dev-shield-dryrun-safety-audit.json"
dest.write_text(json.dumps(record,indent=2)+"\n")
print(json.dumps({"status":"PASS","lastBlock":height,"devRlsStarting":str(starting),
 "devRlsNow":str(current),"hubRlsNow":str(hub),
 "outgoingTransfers":len(outgoing),"outgoingToSharedVault":len(record["outgoingRlsToSharedVault"]),
 "noShieldTransactionInCheckedWindow":record["noShieldTransactionInCheckedWindow"],
 "saved":str(dest)},indent=2))
