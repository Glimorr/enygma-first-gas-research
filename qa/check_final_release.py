#!/usr/bin/env python3
"""Strict offline preflight for the extracted public-only Rayls Quest 3 archive.

Run BEFORE other QA tests which regenerate timestamped output JSON files.
Hashes, privacy boundary, controlled lifecycle, scientific scope, Figure refs.
No private material or signing; no network required.
"""
import hashlib,json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
STATUS=ROOT/"RELEASE_STATUS.json"
MANIFEST=ROOT/"MANIFEST.sha256"
def require(cond,msg):
 if not cond:raise RuntimeError("PUBLIC_RELEASE_AUDIT_FAIL "+msg)
require(STATUS.is_file() and MANIFEST.is_file(),"run this from EXTRACTED release")
meta=json.loads(STATUS.read_text())
entries=[line.split("  ",1) for line in MANIFEST.read_text().splitlines()]
require(len(entries)==meta["file_count"],"source file count")
names={name for _,name in entries}
for digest,name in entries:
 p=ROOT/name
 require(p.is_file(),name+" missing")
 require(hashlib.sha256(p.read_bytes()).hexdigest()==digest,name+" digest mismatch")
blocked={"evidence/public-rpc/controlled/receiver-passkey-preclaim-baseline.json",
 "evidence/public-rpc/controlled/receiver-postclaim-preregistration-observed.json"}
require(not(blocked&names),"wrong-address snapshots in public release")
for digest,name in entries:
 b=(ROOT/name).read_bytes()
 require(not re.search(rb'enygma-testnet\.rayls\.com/i#[A-Za-z0-9_-]{10,}',b),
  name+" contains bearer claim link")
 require(not re.search(rb'(?i)[\x22\x27]privateKey[\x22\x27]\s*:\s*[\x22\x27]0x[0-9a-f]{64}',b),
  name+" contains wallet key")
 require(not re.search(rb'ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}',b),
  name+" contains GitHub token")
require(meta["controlled_private_spend_verified"] is True,"spend status")
require(meta["zero_funded_invite_claim_verified"] and meta["zero_funded_receiver_registry_verified"],
  "claim and registration stage")
require(meta["private_fee_metadata_exploratory_cases"]==3,"private fee cases")
require(meta["historical_state_positive_controls"]==3
 and meta["historical_state_replay_negative_controls"]==6,"replay check counts")
require(meta["total_tamper_tests_pass"]==144,"tamper counts")
require(meta["claim_link_exposure_flag"] is True,"exposed link qualification")
require(meta["superseded_wrong_address_snapshots_excluded"] is True,"superseded sources omitted")
REG=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-claim-and-registration-verified.json").read_text())
SPEND=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-spend-5423d2b13c.json").read_text())
FEE=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-private-spend-fee-replay-verified.json").read_text())
OWNER=json.loads((ROOT/"evidence/public-rpc/controlled/receiver-dev-owner-ui-3rls-verified.json").read_text())
require(REG["correctReceiver"]=="0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C",
  "correct receiver address")
require(REG["registration"]["username"]=="devil","registered username")
require(SPEND["txHash"]=="0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8",
 "first spend exact tx")
require(SPEND["receiptStatus"]==1 and SPEND["method"]=="transferV2" and SPEND["blockNumber"]==24760126,
  "first spend block, method, status")
require(SPEND["senderStateAtLatestHead"]["rlsWei"]=="0" and
 SPEND["senderStateAtLatestHead"]["nonce"]==0 and not SPEND["transparentRlsUsdrTransfersInControlledSenderWindow"],
  "public sender still unfunded")
require(FEE["derivedGrossFeeRls"]=="4.416" and
 FEE["treasuryTransferRls"]=="0.576" and FEE["payoutBlockDelta"]==4,
 "private send fee and payout")
require(OWNER["privateIncomingBalanceWalletUi"]=="3 RLS" and
 OWNER["transactionSignedOrBroadcastByProbe"] is False,"independent owner observation")
tests=[
 ("qa/god-shield-tamper-tests.json",22),
 ("qa/treasury-tamper-tests.json",15),
 ("qa/invite-tamper-tests.json",19),
 ("qa/receiver-onboarding-tamper-tests.json",30),
 ("qa/private-fee-tamper-tests.json",21),
 ("qa/private-spend-tamper-tests.json",37)
]
for name,count in tests:
 a=json.loads((ROOT/name).read_text())
 require(a["status"]=="PASS",name+" status")
 actual=a.get("rejected",a.get("rejected_count",a.get("detected",a.get("detected_count"))))
 require(actual==count,name+" mutation detection count")
article=(ROOT/"publication/FINAL_X_ARTICLE.md").read_text()
require("first private payment" in article.lower() and
 "0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8" in article,
 "final article includes first private spend")
require("?" not in article,"article contains a question")
figures=[x for x in names if re.match(r"figures/F[0-9]{2}-.*\.png$",x)]
require(len(figures)==6,"six evidence figures")
for file in ["research/FINAL_VERIFICATION_REGISTER.md","publication/FINAL_X_ARTICLE.md",
             "site/src/main.js","site/scripts/build-evidence.mjs",
             "recording/VIDEO_SHOTLIST_20261121.md"]:
 require(file in names,file+" missing")
result={"status":"PASS","evidence_class":"OFFLINE_FINAL_RELEASE_INTEGRITY_COMPLETENESS_AND_SCIENTIFIC_SCOPE",
        "manifestSourceFiles":len(entries),"figures":len(figures),
        "controlledLifecycleVerified":True,"recipientOwnerWallet3RlsObserved":True,
        "deliberateEvidenceTamperingDetected":144,
        "wrongAddressSnapshotsExcluded":True,"bearerSecretsIncluded":False}
print(json.dumps(result,indent=2))
