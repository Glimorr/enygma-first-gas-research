#!/usr/bin/env python3
"""Clean extraction and executable QA for the two-cohort frozen public research release.
Never accesses key storage; use pinned node dependencies in isolated extracted copy.
"""
import datetime, hashlib, json, os, pathlib, shutil, subprocess, sys, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
RELEASE=ROOT/"release"
ARCHIVE=RELEASE/"rayls-nov-wq3-two-cohort-final-evidence-20261121.zip"
DEST=RELEASE/"final-two-cohort-extracted-qa-20261121-fresh"
if DEST.exists():shutil.rmtree(DEST)
DEST.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(ARCHIVE) as z:
 if z.testzip():raise RuntimeError("ZIP CRC verification failed")
 z.extractall(DEST)
lines=(DEST/"MANIFEST.sha256").read_text().splitlines()
for line in lines:
 digest,relative=line.split("  ",1)
 if hashlib.sha256((DEST/relative).read_bytes()).hexdigest()!=digest:
  raise RuntimeError("Manifest digest mismatch for "+relative)
NODE_DIR=pathlib.Path("/home/glim/.nvm/versions/node/v22.23.3/bin")
if not NODE_DIR.exists():NODE_DIR=pathlib.Path(shutil.which("node") or "/missing").parent
NODE=NODE_DIR/"node";NPM=NODE_DIR/"npm"
if not NODE.exists() or not NPM.exists():raise RuntimeError("Node.js 22 and npm unavailable")
env=dict(os.environ)
env["PATH"]=str(NODE_DIR)+":"+env.get("PATH","")
processes=[]
def run(label,command,cwd):
 try:
  r=subprocess.run(command,cwd=cwd,env=env,capture_output=True,text=True,timeout=150)
  record={"label":label,"returncode":r.returncode,"stdout_tail":r.stdout[-2500:],
          "stderr_tail":r.stderr[-1800:]}
 except Exception as exc:
  record={"label":label,"returncode":999,"error":str(exc)}
 processes.append(record)
 print(label,"PASS" if record["returncode"]==0 else "FAIL",flush=True)
 return record["returncode"]==0
package_dir=DEST/"experiments/browser"
passed=run("clean_dependency_install",[str(NPM),"ci","--cache",str(ROOT/"tools/npm-cache"),
 "--offline","--ignore-scripts","--no-audit","--no-fund"],package_dir)
if passed:
 for name,cmd in (
  ("final_release_manifest_and_claims",[sys.executable,"qa/check_two_cohort_release.py"]),
  ("first_private_send_offline",[str(NODE),"qa/verify_private_spend_offline.mjs"]),
  ("first_private_send_tamper_37",[str(NODE),"qa/tamper_private_spend.mjs"]),
  ("shield_offline",[str(NODE),"qa/verify_god_shield_offline.mjs"]),
  ("receiver_offline",[str(NODE),"qa/verify_receiver_onboarding_offline.mjs"]),
  ("receiver_tamper_30",[str(NODE),"qa/tamper_receiver_onboarding.mjs"]),
  ("private_fee_offline",[sys.executable,"qa/verify_private_fee_sidechannel_offline.py"]),
  ("private_fee_tamper_21",[sys.executable,"qa/verify_private_fee_sidechannel_offline.py","--tamper-tests"]),
  ("invitation_offline",[str(NODE),"qa/verify_god_invite_offline.mjs"]),
  ("invitation_tamper_19",[str(NODE),"qa/tamper_god_invite.mjs"]),
  ("shield_tamper_22",[str(NODE),"qa/tamper_god_shield.mjs"]),
  ("treasury_offline",[sys.executable,"qa/verify_treasury_controls.py"]),
  ("treasury_tamper_15",[sys.executable,"qa/verify_treasury_controls.py","--tamper-tests"]),
  ("shield_current_state_event_reconstruction",[sys.executable,"qa/verify_god_shield_postprune.py"]),
  ("invitation_live_receipt_prune_safe",[str(NODE),"qa/verify_god_invite_pruned_rpc.mjs"]),
  ("receiver_live_receipts_and_complete_transfer_scan",[str(NODE),"qa/verify_receiver_onboarding_pruned_rpc.mjs"]),
  ("private_fee_live_rpc",[sys.executable,"qa/verify_private_fee_sidechannel.py"]),
  ("original_historical_replay_frozen_calldata_verified",[sys.executable,"qa/verify_private_replay_frozen.py"]),
  ("first_private_send_live_rpc",[str(NODE),"qa/verify_devils_first_private_spend.mjs", "--tx", "0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8"]),
  ("first_private_send_fee_payout_live_prune_safe",[sys.executable,"qa/verify_private_spend_public_payout.py"]),
  ("second_cohort_public_faucet_registration_live",[str(NODE),"qa/verify_faucet_cohort_registration.mjs"]),
  ("second_cohort_public_shield20_live",[sys.executable,"qa/verify_faucet_cohort_public_shield20.py"]),
  ("second_cohort_private_send_frozen_source_offline",[str(NODE),"qa/verify_faucet_cohort_private_spend_offline.mjs"]),
  ("second_cohort_private_send_tamper_38",[str(NODE),"qa/tamper_faucet_cohort_private_spend.mjs"]),
  ("second_cohort_private_send_receipt_live",[str(NODE),"qa/verify_faucet_cohort_private_spend_envelope.mjs"]),
  ("second_cohort_private_fee_payout_live_no_archive_state",[sys.executable,"qa/verify_faucet_cohort_private_spend_public_payout.py"]),
  ("second_cohort_frozen_historical_replay_byte_consistency",[sys.executable,"qa/verify_faucet_cohort_private_spend_replay_frozen.py"]),
  ("thirty_temporal_shift_placebo_windows",[sys.executable,"qa/verify_private_fee_shifted_nulls.py"])
 ):
  run(name,cmd,DEST)
# Test the site build separately in a clean extracted workspace (no keys, no browser profiles).
if passed:
 site_dir=DEST/"site"
 site_installed=run("site_clean_npm_ci",[str(NPM),"ci","--ignore-scripts","--no-audit","--no-fund"],site_dir)
 if site_installed:run("site_reproducible_build",[str(NPM),"run","build"],site_dir)
result={"status":"PASS" if all(x["returncode"]==0 for x in processes) else "FAIL",
 "archive":str(ARCHIVE),"sha256":hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),
 "manifest_file_count":len(lines),"qa_extracted_path":str(DEST),
 "ran_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "results":processes}
output=RELEASE/"final-two-cohort-extracted-qa-report.json"
output.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({"status":result["status"],"checked_files":len(lines),
 "tests":len(processes),"passed":sum(x["returncode"]==0 for x in processes),
 "report":str(output)},indent=2))
sys.exit(0 if result["status"]=="PASS" else 1)
