#!/usr/bin/env python3
"""Live public-RPC fee metadata trace for two controlled SHIELDED transfers.
No private-note or invitation secret is accessed. This is an exploratory correlation,
not a proof of one-to-one fee attribution without owner-wallet evidence.
"""
import datetime,json,pathlib,requests,time
from decimal import Decimal
ROOT=pathlib.Path(__file__).resolve().parents[1]
INV=json.loads((ROOT/"evidence/public-rpc/contract-inventory.json").read_text())
TOKEN=INV["contract_inventory"]["RLS"]["address"]
VAULT=INV["contract_inventory"]["SharedVault"]["address"]
RELAYER=INV["relayer_report"]["relayer_address"]
TREASURY=INV["relayer_report"]["treasury"]
TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
NULLIFIER="0x437885c05eacc89ce854c46fbeb8290d4c624ea6b561c7a784d86bb5369b2ea3"
RPC="https://testnet-rpc.rayls.com/"
def pad(addr):return "0x"+addr[2:].lower().rjust(64,"0")
s=requests.Session();s.headers.update({"User-Agent":"RaylsQuest3FeeResearch/1.0"})
def rpc(method,args=[]):
 for attempt in range(3):
  try:
   response=s.post(RPC,json={"jsonrpc":"2.0","id":1,"method":method,"params":args},timeout=25)
   response.raise_for_status();msg=response.json()
   if "error" in msg:raise RuntimeError(str(msg["error"]))
   return msg["result"]
  except requests.RequestException:
   if attempt==2:raise
   time.sleep(.3*(attempt+1))
def logs(spec):return rpc("eth_getLogs",[spec])
def block(n):return rpc("eth_getBlockByNumber",[hex(n),False])
def amount(wei):return str(Decimal(wei)/Decimal(10**18))
CASES=[
 {"name":"controlled_owner_shielded_invitation",
  "tx":"0x6bedfee2032c1e1001c3dd5563df84d662cf965e0c7e3f301751a9b458d3c0ab",
  "block":24744028,
  "treasuryTx":"0x3650f335ce12fe0c2ad4616aa7d595503e44e18b141e35121fc7cc7f077377f1",
  "walletFeeUiApprox":"4.42",
  "walletExactFeeReconstructedFromBalance":None},
 {"name":"controlled_receiver_private_claim",
  "tx":"0x1c53886772c267e25f0d5c45d7dcc9ecc54246c4bfbf5e9202926f3f70959dec",
  "block":24747924,
  "treasuryTx":"0xc9e3b527d27b152bde59a9529679dcbf2d4237dda1c7f7c2564ad9cff18ab116",
  "walletFeeUiApprox":"12.70",
  "walletExactFeeReconstructedFromBalance":"12.696"}
]
results=[]
for case in CASES:
 pre,post=case["block"]-12,case["block"]+25
 source=rpc("eth_getTransactionReceipt",[case["tx"]])
 assert source and int(source["status"],16)==1 and int(source["blockNumber"],16)==case["block"]
 sourceBlock=block(case["block"])
 assert source["blockHash"].lower()==sourceBlock["hash"].lower()
 # Inspect ALL transfer events in a fixed comparison window, not only the expected amount.
 payoutEvents=logs({"fromBlock":hex(pre),"toBlock":hex(post),
  "address":TOKEN,"topics":[TRANSFER,pad(RELAYER),pad(TREASURY)]})
 vaultEvents=logs({"fromBlock":hex(pre),"toBlock":hex(post),
  "address":VAULT,"topics":[NULLIFIER]})
 vaultCases={}
 for e in vaultEvents:vaultCases.setdefault(e["transactionHash"],[]).append(int(e["blockNumber"],16))
 assert len(vaultCases)==1 and case["tx"].lower() in [x.lower() for x in vaultCases]
 assert len(payoutEvents)==1 and payoutEvents[0]["transactionHash"].lower()==case["treasuryTx"].lower()
 event=payoutEvents[0]
 receipt=rpc("eth_getTransactionReceipt",[case["treasuryTx"]])
 tx=rpc("eth_getTransactionByHash",[case["treasuryTx"]])
 n=int(event["blockNumber"],16)
 header=block(n)
 assert receipt and tx and int(receipt["status"],16)==1
 assert receipt["blockHash"].lower()==header["hash"].lower()
 assert receipt["transactionHash"].lower()==case["treasuryTx"].lower()
 assert any(e["logIndex"]==event["logIndex"] and e["data"].lower()==event["data"].lower()
  and e["topics"]==event["topics"] for e in receipt["logs"])
 wei=int(event["data"],16)
 assert wei>0 and wei*115%15==0
 gross=wei*115//15
 fee=Decimal(gross)/Decimal(10**18)
 quote=Decimal(case["walletFeeUiApprox"])
 assert fee.quantize(Decimal("0.01"))==quote
 if case["walletExactFeeReconstructedFromBalance"]:
  assert str(fee)==case["walletExactFeeReconstructedFromBalance"]
 assert n>case["block"] and n<=post
 result=dict(case)
 result.update({
  "windowStartBlock":pre,"windowEndBlock":post,
  "sourceReceiptStatus":int(source["status"],16),
  "sourceMethodSelector":rpc("eth_getTransactionByHash",[case["tx"]])["input"][:10],
  "grossFeeImpliedRls":str(fee),
  "baseFeeImpliedRls":amount(gross-wei),
  "treasuryShareRls":amount(wei),
  "treasuryShareWei":str(wei),
  "relativePayoutBlock":n-case["block"],
  "unambiguousRelativeToAllNullifierEventsInComparisonWindow":len(vaultCases)==1,
  "unambiguousRelativeToAllRelayerToTreasuryTransfersInWindow":len(payoutEvents)==1,
  "checkedPayoutReceipt":True,
  "rawSourceReceipt":source,
  "rawPayoutReceipt":receipt,
  "rawPayoutTx":tx,
  "payoutBlockHeader":header,
  "rawPayoutTransferLog":event,
  "allNullifierLogTransactionsInWindow":list(vaultCases.keys())
 })
 results.append(result)
# Registration makes a NEGATIVE control: zero explicit Forwarder fee, and no treasury payout within 35 blocks.
REGISTER_TX="0xd7f6197e642f7d0bd48b19ab41cb742f07ce05e89442eb59f2513a4ff2eff71b"
REGISTER_BLOCK=24748136
reg=rpc("eth_getTransactionReceipt",[REGISTER_TX])
regPayout=logs({"fromBlock":hex(REGISTER_BLOCK),"toBlock":hex(REGISTER_BLOCK+35),
 "address":TOKEN,"topics":[TRANSFER,pad(RELAYER),pad(TREASURY)]})
assert reg and int(reg["status"],16)==1 and not regPayout
control={"name":"public_registry_success_zero_forwarder_fee",
 "registrationTx":REGISTER_TX,"block":REGISTER_BLOCK,"treasuryPaymentsNext35Blocks":len(regPayout),
 "interpretation":"No separately observed fee-share transfer after zero-fee public Forwarder registration; does not rule out private invitation funding costs."}
result={
 "evidence_class":"CONTROLLED_SHIELDED_FEE_TREASURY_SIDECHANNEL_EXPLORATORY_PILOT",
 "capturedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "chainId":7295799,
 "reportedRelayer":RELAYER,"reportedTreasury":TREASURY,
 "selectedWindow":"source block -12 through +25; includes all vault Nullifier and relayer-to-treasury RLS Transfer events",
 "formula":"gross_fee_wei = treasury_share_wei * 115 / 15",
 "controlledPrivateCases":results,"negativeControl":control,
 "sampleCount":len(results),"oneToOneMatches":len(results),
 "bounds":[
  "Foundation identity comes from relayer-reported configuration, not legal authentication.",
  "The treasury payout happens in a separate transaction; correlation is strong within these windows but the protocol does not include a cryptographic payout-to-source reference.",
  "Fee metadata is inferable under the reported fixed 15% share and proximity assumption; shielded payment principal and recipient are NOT inferred.",
  "This is a small, researcher-controlled selected pilot, not a network-wide estimator.",
  "Private quote in app is rounded and not itself public blockchain data."
 ]
}
file=ROOT/"evidence/public-rpc/controlled/receiver-private-fee-sidechannel-verified.json"
file.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":"PASS","cases":len(results),
 "matches":[{"stage":r["name"],"payout":r["treasuryShareRls"],
 "impliedGrossRls":r["grossFeeImpliedRls"],
 "blocksAfter":r["relativePayoutBlock"],
 "uniqueVaultInWindow":r["unambiguousRelativeToAllNullifierEventsInComparisonWindow"],
 "uniquePayoutInWindow":r["unambiguousRelativeToAllRelayerToTreasuryTransfersInWindow"]} for r in results],
 "zeroFeeRegistrationNoTreasuryPayout":not regPayout,"saved":str(file)},indent=2))
