#!/usr/bin/env python3
"""Fresh onchain receipt+fee-payout checks for @rq3faucet26's second-cohort private RLS send.
No historical eth_call, so RPC state pruning does NOT affect reproducibility.
Historical replay is a separately authenticated frozen positive/negative control.
"""
from decimal import Decimal
import datetime,json,pathlib,requests
R=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((R/"evidence/public-rpc/contract-inventory.json").read_text())
SOURCE="0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb"
PAYOUT="0x1e98495ef31b41a8dab93f1a2b284f81991987000a3c69c958287e82f6e9fa8f"
TOKEN=INV["contract_inventory"]["RLS"]["address"]
VAULT=INV["contract_inventory"]["SharedVault"]["address"]
RELAYER=INV["relayer_report"]["relayer_address"]
TREASURY=INV["relayer_report"]["treasury"]
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
NULLIFIER="0x437885c05eacc89ce854c46fbeb8290d4c624ea6b561c7a784d86bb5369b2ea3"
def pad(x):return "0x"+x[2:].lower().rjust(64,"0")
s=requests.Session();s.headers["User-Agent"]="RaylsQuest3SecondCohortPruneSafeFeeProof/1.0"
def rpc(method,args=[]):
 response=s.post("https://testnet-rpc.rayls.com/",json={"jsonrpc":"2.0","id":1,"method":method,"params":args},timeout=25)
 response.raise_for_status()
 obj=response.json()
 if "error" in obj:raise RuntimeError(method+" "+str(obj["error"]))
 return obj["result"]
def check(v,msg):
 if not v:raise RuntimeError("SECOND_SPEND_PUBLIC_FEE_FAIL "+msg)
check(int(rpc("eth_chainId"),16)==7295799,"chain")
r=rpc("eth_getTransactionReceipt",[SOURCE]);t=rpc("eth_getTransactionByHash",[SOURCE])
block=rpc("eth_getBlockByNumber",[r["blockNumber"],False])
check(r and r["status"]=="0x1" and t and int(r["blockNumber"],16)==24767795,"source receipt")
check(t["input"][:10]=="0xaacd552c" and t["to"].lower()==VAULT.lower()
 and t["from"].lower()==RELAYER.lower(),"source call")
check(r["blockHash"].lower()==block["hash"].lower(),"source block hash")
check(len(r["logs"])==7 and all(l["address"].lower()==VAULT.lower() for l in r["logs"]),"event source")
check(sum(l["topics"][0].lower()==NULLIFIER for l in r["logs"])==1,"nullifier")
fromBlock,toBlock=24767783,24767820
nullLogs=rpc("eth_getLogs",[{"address":VAULT,"topics":[NULLIFIER],
 "fromBlock":hex(fromBlock),"toBlock":hex(toBlock)}])
check(len({l["transactionHash"].lower() for l in nullLogs})==1 and
 all(l["transactionHash"].lower()==SOURCE.lower() for l in nullLogs),"one vault-nullifier transaction in window")
transfers=rpc("eth_getLogs",[{"address":TOKEN,
 "topics":[TRANSFER,pad(RELAYER),pad(TREASURY)],
 "fromBlock":hex(fromBlock),"toBlock":hex(toBlock)}])
check(len(transfers)==1 and transfers[0]["transactionHash"].lower()==PAYOUT.lower(),
 "one relayer treasury payout in window")
l=transfers[0];payoutReceipt=rpc("eth_getTransactionReceipt",[PAYOUT])
payoutTx=rpc("eth_getTransactionByHash",[PAYOUT])
payoutBlock=rpc("eth_getBlockByNumber",[payoutReceipt["blockNumber"],False])
check(payoutTx and payoutReceipt["status"]=="0x1"
 and payoutReceipt["blockHash"].lower()==payoutBlock["hash"].lower(),"payout receipt/chain")
check(any(x["logIndex"]==l["logIndex"] and x["data"].lower()==l["data"].lower()
 and x["topics"]==l["topics"] for x in payoutReceipt["logs"]),"payout event receipt inclusion")
wei=int(l["data"],16)
check(wei==576000000000000000 and wei*115%15==0,"payout amount/formula")
gross=wei*115//15
check(gross==4416000000000000000,"gross private fee")
check(int(payoutReceipt["blockNumber"],16)==24767799,"payout block")
out={"status":"PASS","class":"LIVE_PUBLIC_SECOND_COHORT_PRIVATE_SEND_ENVELOPE_AND_EXACT_FEE_PAYOUT__NO_HISTORICAL_STATE_REQUIRED",
 "checkedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "sourceTx":SOURCE,"sourceBlock":24767795,"privateNotePrincipalPublic":False,
 "sourceReceiptStatus":1,"sourceEventCount":7,
 "payoutTx":PAYOUT,"payoutBlock":24767799,"payoutDelayBlocks":4,
 "treasuryRls":"0.576","impliedGrossRls":"4.416","impliedBaseRls":"3.84",
 "oneVaultSpendAndOneTreasuryPayoutInPredeclaredWindow":True,
 "historicalStateQueried":False,
 "publicPrincipalVisibility":"The 3 RLS principal and @rq3dev26 recipient come from two controlled owner-wallet observations, not public calldata.",
 "causalLimit":"Relayer treasury payout is associated by timing/uniqueness and arithmetic under reported fee policy, not by onchain cryptographic source ID."}
(R/"qa/faucet-cohort-private-spend-payout-prune-safe-check.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps(out,indent=2))
