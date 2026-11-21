#!/usr/bin/env python3
"""Quest 3 second-cohort public shield: independent live chain receipt, fee and treasury verification.
No signing, protected credentials or shielded key access. User's wallet UI reported 20 RLS.
"""
import json,pathlib,requests,datetime
R=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((R/"evidence/public-rpc/contract-inventory.json").read_text())
ORIGIN="0xe1136dCF839c4aD2704094241928Fa2896A118c5"
TX="0x412a30dfaf94a75b25efbc02edf0f63a6de4846d89392c945e6f9b5b7be5c6b7"
PAYOUT="0x2a462176bace48a23a164a6811019b9792121f2f5a7b41e765bca0f55ef84ef0"
RLS=INV["contract_inventory"]["RLS"]["address"]
USDR=INV["contract_inventory"]["USDr"]["address"]
VAULT=INV["contract_inventory"]["SharedVault"]["address"]
RELAYER=INV["relayer_report"]["relayer_address"]
TREASURY=INV["relayer_report"]["treasury"]
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
s=requests.Session();s.headers["User-Agent"]="RaylsQuest3SecondCohortShieldVerification/1.0"
def rpc(method,p=[]):
 r=s.post("https://testnet-rpc.rayls.com/",json={"jsonrpc":"2.0","id":1,"method":method,"params":p},timeout=26)
 r.raise_for_status();j=r.json()
 if "error" in j:raise RuntimeError(method+":"+str(j["error"]))
 return j["result"]
def check(ok,msg):
 if not ok:raise RuntimeError("SHIELD_CONTROL_VERIFY_FAIL "+msg)
def norm(x):return str(x).lower()
def topicaddr(x):return "0x"+x[2:].lower().rjust(64,"0")
check(int(rpc("eth_chainId"),16)==7295799,"chain")
tx=rpc("eth_getTransactionByHash",[TX]);rec=rpc("eth_getTransactionReceipt",[TX])
check(tx is not None and rec is not None and rec["status"]=="0x1","mined success")
num=int(rec["blockNumber"],16);check(num==24767225,"block number")
h=rpc("eth_getBlockByNumber",[rec["blockNumber"],True])
check(h["hash"].lower()==rec["blockHash"].lower()==tx["blockHash"].lower() and
 any(z["hash"].lower()==TX.lower() for z in h["transactions"]),"block inclusion")
check(norm(tx["to"])==norm(INV["relayer_report"]["active_forwarder"]) and
 norm(tx["from"])==norm(RELAYER),"forwarder and submitting relayer")
logs=rpc("eth_getLogs",[{"address":[RLS,VAULT,INV["relayer_report"]["active_forwarder"]],
 "fromBlock":rec["blockNumber"],"toBlock":rec["blockNumber"]}])
unique=[a for a in logs if norm(a["transactionHash"])==norm(TX)]
check(len(unique)==len(rec["logs"]),"independent log count")
for v in rec["logs"]:
 check(any(z["logIndex"]==v["logIndex"] and norm(z["address"])==norm(v["address"]) and
  norm(z["data"])==norm(v["data"]) and z["topics"]==v["topics"] for z in unique),"independent log bytes")
moves=[]
for l in rec["logs"]:
 if norm(l["address"])==norm(RLS) and norm(l["topics"][0])==TRANSFER:
  moves.append({"from":"0x"+l["topics"][1][-40:],"to":"0x"+l["topics"][2][-40:],
   "wei":str(int(l["data"],16)),"logIndex":int(l["logIndex"],16)})
check(len(moves)==2,"expected two public token transfers")
assertall=lambda pred:all(pred(v) for v in moves)
check(assertall(lambda v:norm(v["from"])==norm(ORIGIN)),"owner as source for both transfers")
expected={(norm(RELAYER),"3525800640000000000"),(norm(VAULT),"20000000000000000000")}
check({(norm(v["to"]),v["wei"]) for v in moves}==expected,"exact public deposit and fee")
reg=rpc("eth_getTransactionReceipt",["0x0c7419d5d3d334dae29f5e87bdde78481ed61b6ae2907429044b4e56903beb0a"])
check(int(reg["blockNumber"],16)<num and reg["status"]=="0x1","registered before shield")
windowStart=num-12;windowEnd=num+25
pay=rpc("eth_getLogs",[{"address":RLS,"fromBlock":hex(windowStart),"toBlock":hex(windowEnd),
 "topics":[TRANSFER,topicaddr(RELAYER),topicaddr(TREASURY)]}])
check(len(pay)==1 and norm(pay[0]["transactionHash"])==norm(PAYOUT),"unique payout in fixed window")
check(int(pay[0]["blockNumber"],16)==num+3 and int(pay[0]["data"],16)==459887040000000000,"treasury payout value")
pr=rpc("eth_getTransactionReceipt",[PAYOUT]);pt=rpc("eth_getTransactionByHash",[PAYOUT])
ph=rpc("eth_getBlockByNumber",[pr["blockNumber"],False])
check(pr["status"]=="0x1" and ph["hash"]==pr["blockHash"]==pt["blockHash"],"payout mined")
check(any(z["logIndex"]==pay[0]["logIndex"] and z["data"]==pay[0]["data"] for z in pr["logs"]),"payout log")
check(int(pay[0]["data"],16)*115//15==3525800640000000000 and
 int(pay[0]["data"],16)*115%15==0,"15 percent base share exact")
head=int(rpc("eth_blockNumber"),16)
def balance(tok):
 res=rpc("eth_call",[{"to":tok,"data":"0x70a08231"+ORIGIN[2:].lower().zfill(64)},hex(head)])
 return str(int(res,16))
publicRls=balance(RLS);publicUsdr=balance(USDR)
native=str(int(rpc("eth_getBalance",[ORIGIN,hex(head)]),16))
nonce=int(rpc("eth_getTransactionCount",[ORIGIN,hex(head)]),16)
check(publicRls=="219277242680000000000" and publicUsdr=="10000000000000000000" and
 native=="10000000000000000000" and nonce==0,"public postshield balances")
out={"status":"PASS","evidence_class":"RESEARCHER_CONTROLLED_SECOND_COHORT_PUBLIC_SHIELD_LIVE_CHAIN_VERIFIED",
 "verifiedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"chainId":7295799,
 "owner":ORIGIN,"sourceUsername":"@rq3faucet26","txHash":TX,"block":num,"receiptStatus":1,
 "vaultDepositRls":"20","publicGasAndRelayerFeeRls":"3.52580064",
 "publicRlsBeforeShield":"242.80304332","publicRlsAfterShield":"219.27724268",
 "publicUsdrAfterShield":"10","nativeBalanceAfterShield":"10","evmNonceAfterShield":nonce,
 "treasuryPayoutHash":PAYOUT,"payoutBlock":num+3,"reportedTreasuryRls":"0.45988704",
 "feeFormulaExact":{"grossRls":"3.52580064","baseRls":"3.06591360","15PercentShareRls":"0.45988704"},
 "logBytesMatchedFreshEthGetLogs":True,"publicTransferEvents":moves,
 "rawPublicEvidence":{"shieldTx":tx,"shieldReceipt":rec,"shieldBlockHash":h["hash"],
  "independentEthGetLogs":unique,"payoutReceipt":pr,"payoutTx":pt,
  "payoutBlockHash":ph["hash"],"treasuryLog":pay[0]},
 "scientificLimits":[
  "Shielding 20 RLS is a PUBLIC operation: the account, token, deposit principal and fee are directly exposed in ERC20 Transfer logs.",
  "The account originally received public RLS, USDr and native units from default faucet. This second cohort cannot prove zero-public-funded onboarding.",
  "A successful public shield receipt does not establish a successful later private send.",
  "The payout match uses reported treasury address and predeclared fixed window, not an on-chain cryptographic link to the source fee.",
  "A private wallet-observed shielded balance must be corroborated by the wallet UI; public RPC alone cannot decrypt it."
 ]}
p=R/"evidence/public-rpc/controlled/faucet-cohort-public-shield-20-verified.json"
p.write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({"status":out["status"],"tx":TX,"block":num,"depositRls":"20",
 "feeRls":out["publicGasAndRelayerFeeRls"],"publicRlsAfter":out["publicRlsAfterShield"],
 "treasuryRls":out["reportedTreasuryRls"],"treasuryTx":PAYOUT,
 "publicBalanceAndNonceChecked":True,"independentLogsMatched":True,"saved":str(p)},indent=2))
