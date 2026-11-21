#!/usr/bin/env python3
"""Rayls WQ3: independent public fee and read-only replay controls on real
@devil-to-@rq3dev26 shielded transfer. No signing, no secret, no invite link.
"""
from decimal import Decimal
import datetime,hashlib,json,pathlib,requests,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
TX="0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8"
PAID_TX="0xd639df4cd7d62ea031a313ec5b3b9f6b46241aebe599b29867bf7a3e7302bb32"
VAULT=INV["contract_inventory"]["SharedVault"]["address"]
RLS=INV["contract_inventory"]["RLS"]["address"]
RELAYER=INV["relayer_report"]["relayer_address"]
TREASURY=INV["relayer_report"]["treasury"]
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
NULLIFIER="0x437885c05eacc89ce854c46fbeb8290d4c624ea6b561c7a784d86bb5369b2ea3"
s=requests.Session();s.headers.update({"User-Agent":"RaylsWQ3ShieldedFirstSpendAudit/1.0"})
def rpc(method,params=[]):
 for attempt in range(3):
  try:
   r=s.post("https://testnet-rpc.rayls.com/",json={"jsonrpc":"2.0","method":method,"params":params,"id":1},timeout=32)
   r.raise_for_status();obj=r.json()
   if "error" in obj and method!="eth_call":raise RuntimeError(method+" "+str(obj["error"]))
   return obj
  except requests.RequestException:
   if attempt==2:raise
   time.sleep(.5*(attempt+1))
def result(method,params=[]):
 o=rpc(method,params)
 if "error" in o:raise RuntimeError(method+" "+str(o["error"]))
 return o["result"]
def ensure(ok,msg):
 if not ok:raise RuntimeError("WQ3_VERIFY_FAIL "+msg)
def pad(addr):return "0x"+addr[2:].lower().rjust(64,"0")
def decimalRls(n):return Decimal(n)/Decimal(10**18)
ensure(int(result("eth_chainId"),16)==7295799,"wrong chain")
src=result("eth_getTransactionReceipt",[TX])
sourceTx=result("eth_getTransactionByHash",[TX])
ensure(src and sourceTx and int(src["status"],16)==1,"missing or reverted spend")
blockNumber=int(src["blockNumber"],16)
ensure(blockNumber==24760126,"unexpected source block number")
h=result("eth_getBlockByNumber",[src["blockNumber"],False])
ensure(src["blockHash"].lower()==h["hash"].lower(),"source block hash")
ensure(sourceTx["from"].lower()==RELAYER.lower() and sourceTx["to"].lower()==VAULT.lower(),"wrong relayer/vault")
ensure(sourceTx["input"][:10]=="0xaacd552c","not vault transferV2")
ensure(len(src["logs"])==7 and sum(x["topics"][0].lower()==NULLIFIER for x in src["logs"])==1,"expected vault note topology")
ensure(all(x["address"].lower()==VAULT.lower() for x in src["logs"]),"unexpected token log")
# Preset interval defined before counting candidate events, consistent with earlier fee study
begin,end=blockNumber-12,blockNumber+25
nulls=result("eth_getLogs",[{"address":VAULT,"topics":[NULLIFIER],"fromBlock":hex(begin),"toBlock":hex(end)}])
vaultTxs=set(x["transactionHash"].lower() for x in nulls)
ensure(vaultTxs=={TX.lower()},"other private spend transactions in comparison window")
payouts=result("eth_getLogs",[{"address":RLS,"topics":[TRANSFER,pad(RELAYER),pad(TREASURY)],
 "fromBlock":hex(begin),"toBlock":hex(end)}])
ensure(len(payouts)==1 and payouts[0]["transactionHash"].lower()==PAID_TX.lower(),
 "unexpected treasury payout candidates")
p=payouts[0]
amountWei=int(p["data"],16)
ensure(amountWei==576000000000000000,"unexpected treasury amount")
ensure(amountWei*115%15==0,"non-exact fee division")
grossWei=amountWei*115//15
baseWei=grossWei-amountWei
ensure(grossWei==4416000000000000000 and baseWei==3840000000000000000,"gross fee reconstruction")
payoutReceipt=result("eth_getTransactionReceipt",[PAID_TX])
payoutTx=result("eth_getTransactionByHash",[PAID_TX])
payoutHeader=result("eth_getBlockByNumber",[payoutReceipt["blockNumber"],False])
ensure(int(payoutReceipt["status"],16)==1 and
 payoutReceipt["blockHash"].lower()==payoutHeader["hash"].lower(),"payout receipt/header mismatch")
ensure(any(l["logIndex"]==p["logIndex"] and l["data"].lower()==p["data"].lower() and
 l["topics"]==p["topics"] for l in payoutReceipt["logs"]),"transfer not included in receipt")
payoutHeight=int(payoutReceipt["blockNumber"],16)
ensure(payoutHeight==blockNumber+4,"unexpected payout delay")
# Noncommitting eth_call controls with exact original publicly available calldata.
request={k:sourceTx[k] for k in ("from","to","value")};request["data"]=sourceTx["input"];request["gas"]=hex(10000000)
replayChecks=[]
for tag,b in [("before",blockNumber-1),("mined",blockNumber),("next",blockNumber+1)]:
 res=rpc("eth_call",[request,hex(b)])
 if "error" in res:
  replayChecks.append({"phase":tag,"block":b,"outcome":"REVERT",
   "rpcErrorCode":res["error"].get("code"),"rpcErrorMessage":res["error"].get("message"),
   "rpcErrorData":str(res["error"].get("data"))[:150]})
 else:
  reply=res["result"]
  replayChecks.append({"phase":tag,"block":b,"outcome":"SUCCESS" if reply=="0x"+"0"*63+"1" else "UNEXPECTED_RETURN",
    "returnData":reply})
ensure(replayChecks[0]["outcome"]=="SUCCESS","pre-mined control did not succeed")
ensure(replayChecks[1]["outcome"]=="REVERT" and replayChecks[2]["outcome"]=="REVERT","post-settlement replay not rejected")
allEvidence={
 "evidence_class":"CONTROLLED_RECEIVER_PRIVATE_SPEND_FEE_AND_HISTORICAL_REPLAY_LIVE_RPC_VERIFIED",
 "generatedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,"sourceTransaction":TX,
 "sourceBlock":blockNumber,"sourceReceiptStatus":1,
 "publicVault":VAULT,"reportedRelayer":RELAYER,"reportedTreasury":TREASURY,
 "sourceWalletObservedSender":"@devil",
 "sourceWalletObservedRecipient":"@rq3dev26",
 "sourceWalletObservedPrincipalRls":"3",
 "sourceWalletDisplayedFeeRlsApprox":"4.42",
 "actualPrivatePrincipalVisibleInPublicRpc":False,
 "payoutTx":PAID_TX,"payoutBlock":payoutHeight,
 "payoutBlockDelta":payoutHeight-blockNumber,
 "treasuryTransferWei":str(amountWei),
 "treasuryTransferRls":str(decimalRls(amountWei)),
 "derivedGrossFeeWei":str(grossWei),
 "derivedGrossFeeRls":str(decimalRls(grossWei)),
 "derivedBaseFeeWei":str(baseWei),
 "derivedBaseFeeRls":str(decimalRls(baseWei)),
 "reported15PercentFeeShareFormulaExact":amountWei*115==grossWei*15,
 "uniquePrivateSpendInFixedWindow":len(vaultTxs)==1,
 "uniqueTreasuryTransferInFixedWindow":len(payouts)==1,
 "window":{"startBlock":begin,"endBlock":end,
  "nullifierTransactions":[{"hash":x["transactionHash"],"block":int(x["blockNumber"],16)} for x in nulls],
  "matchingTreasuryTransfers":[{"hash":x["transactionHash"],"block":int(x["blockNumber"],16),
    "rawAmountWei":str(int(x["data"],16))} for x in payouts]},
 "historicalReplayControls":{"transactionBroadcasts":0,"positiveBefore":1,"negativeAfter":2,"calls":replayChecks,
  "interpretation":"Same exact calldata succeeds before mining and reverts at/after mining, consistent with state-dependent replay rejection but without isolating revert cause."},
 "rawPublicEvidence":{"sourceReceipt":src,"sourceTx":sourceTx,
  "sourceHeader":h,"payoutReceipt":payoutReceipt,"payoutTx":payoutTx,
  "payoutHeader":payoutHeader,"payoutTransferLog":p},
 "limitations":[
  "Shielded principal, payer and recipient come from the account-owner's official wallet UI, not public vault logs.",
  "Treasury recipient identity is relayer-reported; fee-source-to-treasury relation is correlated by timing, uniqueness and formula, not a cryptographic linkage.",
  "Fixed window is source block minus 12 through plus 25. This third controlled private case is selected, not a random network sample.",
  "Historical eth_call is a read-only state simulation, not a real replay transaction or an exhaustive security proof.",
  "This script reads no private bearer URL, passkey material or private wallet keys."
 ]}
dest=ROOT/"evidence/public-rpc/controlled/receiver-private-spend-fee-replay-verified.json"
dest.write_text(json.dumps(allEvidence,indent=2)+"\n")
print(json.dumps({"status":"PASS","sourceTx":TX,"sourceBlock":blockNumber,
 "treasuryPayoutTx":PAID_TX,"treasuryRls":allEvidence["treasuryTransferRls"],
 "impliedGrossFeeRls":allEvidence["derivedGrossFeeRls"],
 "impliedBaseFeeRls":allEvidence["derivedBaseFeeRls"],
 "sourcePayoutLagBlocks":4,
 "isolatedVaultAndPayoutCandidates":True,
 "historicalReplay":[c["outcome"] for c in replayChecks],
 "newTransactionsSignedOrBroadcast":0,"output":str(dest)},indent=2))
