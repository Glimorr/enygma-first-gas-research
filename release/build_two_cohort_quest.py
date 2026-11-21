#!/usr/bin/env python3
"""Package a PUBLIC-ONLY final controlled testnet RESEARCH RELEASE.
User will still record videos and publish the final X article.
Curated safe files only. No wallet credentials, browser sessions or invitation secrets.
"""
import datetime,hashlib,json,pathlib,re,shutil,sys,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
RELEASE=ROOT/"release"
STAGE=RELEASE/"w3-two-cohort-staged"
if STAGE.exists():shutil.rmtree(STAGE)
STAGE.mkdir(parents=True)
files=[
 "README.md","research/STATUS_2026-11-21.md","research/PREREGISTRATION.md",
 "research/CURRENT_VERIFICATION_REGISTER.md","research/FINAL_VERIFICATION_REGISTER.md",
 "research/NEXT_INVITE_PROTOCOL.md",
 "release/build_two_cohort_quest.py","release/verify_two_cohort_reproduction.py",
 "publication/FINAL_X_ARTICLE.md",
 "research/FINAL_TWO_COHORT_COMPARISON_20261121.md",
 "research/FAUCET_FIRST_COMPARATOR_PREREG_20261121.md",
 "research/PUBLIC_FAUCET_TRANSPARENT_SHIELD_COMPARATOR_PREREG_20261121.md",
 "research/CONTROL_EXTENSION_RESULTS_20261121.md",
 "publication/SEPARATE_X_TEAM_QUESTION.md",
 "publication/ARTICLE_FACT_PACK.md","publication/EVALUATOR_GATE_CHECKLIST.md",
 "recording/VIDEO_SHOTLIST_20261121.md",
 "qa/verify_devils_first_private_spend.mjs",
 "qa/verify_private_spend_offline.mjs","qa/tamper_private_spend.mjs",
 "qa/verify_private_spend_fee_replay.py",
 "qa/private-spend-offline-result.json","qa/private-spend-tamper-tests.json",
 "qa/check_final_release.py","qa/check_two_cohort_release.py",
 "qa/site_browser_qa.mjs",
 "qa/verify_private_fee_shifted_nulls.py",
 "qa/verify_faucet_cohort_registration.mjs",
 "qa/verify_faucet_cohort_public_shield20.py",
 "qa/verify_faucet_cohort_private_spend_envelope.mjs",
 "qa/verify_faucet_cohort_private_spend_fee_replay.py",
 "qa/verify_faucet_cohort_private_spend_public_payout.py",
 "qa/verify_faucet_cohort_private_spend_replay_frozen.py",
 "qa/faucet-cohort-private-spend-payout-prune-safe-check.json",
 "qa/faucet-cohort-private-spend-replay-frozen-check.json",
 "qa/verify_faucet_cohort_private_spend_offline.mjs",
 "qa/tamper_faucet_cohort_private_spend.mjs",
 "qa/faucet-cohort-private-spend-offline-result.json",
 "qa/faucet-cohort-private-spend-tamper-tests.json",
 "qa/verify_god_invite_pruned_rpc.mjs",
 "qa/verify_receiver_onboarding_pruned_rpc.mjs",
 "qa/verify_private_replay_frozen.py",
 "qa/verify_private_spend_public_payout.py",
 "qa/invite-pruned-state-receipt-check.json",
 "qa/receiver-pruned-state-receipt-check.json",
 "qa/historical-replay-frozen-consistency.json",
 "qa/private-spend-payout-prune-safe-check.json",
 "site/index.html","site/package.json","site/package-lock.json","site/vite.config.mjs",
 "site/src/main.js","site/src/style.css","site/scripts/build-evidence.mjs",
 "site/public/assets/rayls-symbol-gradient.png",
 "figures/render_research_figures.mjs","figures/figures-manifest.json",
 "publication/EDITORIAL_BRIEF.md",
 "research/probe_public_chain.py","research/check_verified_sources.py",
 "research/fetch_verified_abis.py","research/explorer_activity.py",
 "research/relayer_feature_probe.py","research/audit_hub_preinvite.mjs",
 "research/trace_post_shield_treasury.py",
 "research/locate_invitation_public.py",
 "research/reconcile_fee_treasury_controls.py",
 "research/reconstruct_burner_history.py",
 "research/snapshot_burner.mjs",
 "analysis/derive_observations.py","analysis/public_observations.json",
 "experiments/browser/package.json","experiments/browser/package-lock.json",
 "experiments/browser/scan_events.mjs",
 "experiments/browser/reconcile_forwarder_fees.mjs",
 "experiments/browser/verify_observational.mjs",
 "experiments/browser/tamper_tests.mjs",
 "qa/verify_god_shield.mjs","qa/verify_god_shield_offline.mjs",
 "qa/verify_god_shield_postprune.py",
 "qa/verify_god_invite.mjs","qa/verify_god_invite_offline.mjs",
 "qa/tamper_god_invite.mjs",
 "qa/tamper_god_shield.mjs","qa/verify_treasury_controls.py",
 "qa/verify_receiver_onboarding.mjs","qa/verify_receiver_onboarding_offline.mjs",
 "qa/tamper_receiver_onboarding.mjs",
 "qa/verify_private_fee_sidechannel.py","qa/verify_private_fee_sidechannel_offline.py",
 "qa/verify_private_replay_controls.py",
 "qa/verify_controlled_registration.mjs","qa/verify_controlled_faucet_rls.py",
 "qa/audit_after_blocked_shield.py",
 "qa/verification-offline.json","qa/verification-live.json",
 "qa/tamper-tests.json","qa/invite-offline-result.json",
 "qa/invite-tamper-tests.json","qa/god-shield-offline-check.json",
 "qa/god-shield-tamper-tests.json","qa/treasury-offline-check.json",
 "qa/treasury-tamper-tests.json",
 "qa/receiver-onboarding-offline-result.json","qa/receiver-onboarding-tamper-tests.json",
 "qa/private-fee-offline-result.json","qa/private-fee-tamper-tests.json"
]
files += [p.relative_to(ROOT).as_posix() for p in (ROOT/"evidence/public-rpc").rglob("*.json")]
files += [p.relative_to(ROOT).as_posix() for p in (ROOT/"research/verified-abis").glob("*.json")]
files += [p.relative_to(ROOT).as_posix() for p in (ROOT/"figures").glob("F[0-9][0-9]-*.png")]
files=sorted(set(files))
# The two saved snapshots below used an INCORRECT screenshot-transcribed receiver address.
# Explicitly exclude them; the correction record and authoritative live verifier are included.
WRONG={
 "evidence/public-rpc/controlled/receiver-passkey-preclaim-baseline.json",
 "evidence/public-rpc/controlled/receiver-postclaim-preregistration-observed.json",
 "evidence/public-rpc/controlled/faucet-cohort-fresh-passkey-preaction-baseline.json"
}
files=[f for f in files if f not in WRONG]
for rel in files:
 src=ROOT/rel
 if not src.is_file():raise FileNotFoundError(src)
 if any(term in rel.lower() for term in (
  "/.env","private-key","/secrets/","/private/","passkey","credential","node_modules",
  "browser-cache","ui-feasibility","invite-secret","live-app-bundle","pilot-alpha")):
  raise RuntimeError("Forbidden release path: "+rel)
 data=src.read_bytes()
 if (b"-----BEGIN"+b" PRIVATE KEY-----") in data or re.search(rb'(?i)(?:"privateKey"\s*:\s*"0x[0-9a-f]{64}")',data):
  raise RuntimeError("Potential private key in "+rel)
 if re.search(rb'ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}',data):
  raise RuntimeError("Potential token in "+rel)
 dest=STAGE/rel
 dest.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(src,dest)
manifest=[hashlib.sha256((STAGE/p).read_bytes()).hexdigest()+"  "+p for p in files]
(STAGE/"MANIFEST.sha256").write_text("\n".join(manifest)+"\n")
status={"release_status":"TWO_DISTINCT_CONTROLLED_TESTNET_PAYMENT_LIFECYCLES_VERIFIED__USER_VIDEO_AND_X_PUBLICATION_PENDING",
  "created_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "file_count":len(files),
  "controlled_shield_public_chain_verified":True,
  "controlled_dev_registration_public_chain_verified":True,
  "public_fee_treasury_paid_cases_exact":18,
  "public_fee_treasury_zero_fee_controls":2,
  "shield_tamper_tests_pass":22,
  "treasury_tamper_tests_pass":15,
  "controlled_invitation_public_envelope_verified":True,
  "invitation_receipt_tamper_tests_pass":19,
  "zero_funded_invite_claim_verified":True,
  "zero_funded_receiver_registry_verified":True,
  "corrected_receiver_address":"0x665E08A2867Cb53d05C1381D565e19Da0bC3e76C",
  "superseded_wrong_address_snapshots_excluded":True,
  "private_fee_metadata_exploratory_cases":4,
  "historical_state_positive_controls":4,
  "historical_state_replay_negative_controls":8,
  "historical_archive_state_pruned":True,
  "postprune_current_state_and_transfer_event_reconstruction_passed":True,
  "receiver_onboarding_tamper_tests_pass":30,
  "private_fee_metadata_tamper_tests_pass":21,
  "claim_link_exposure_flag":True,
  "controlled_private_spend_verified":True,
  "controlled_private_spend_hash":"0x5423d2b13c575c8e26c73e42906f4eefb7a6a257defcebad81a1415c857253e8",
  "private_spend_owner_ui_principal_rls":"3",
  "independent_receiving_wallet_shielded_rls_observed":"3",
  "controlled_private_spend_tamper_tests_pass":37,
  "total_tamper_tests_pass":182,
  "sender_stayed_publicly_unfunded_after_send":True,
  "website_published":False,
  "website_source_and_seven_figures_included":True,
  "two_distinct_funding_route_private_payment_lifecycles_verified":True,
  "second_cohort_publicly_funded":True,
  "second_cohort_username":"rq3faucet26",
  "second_cohort_public_faucet_registration_and_shield_verified":True,
  "second_cohort_public_shield_rls":"20",
  "second_cohort_public_shield_fee_rls":"3.52580064",
  "second_cohort_private_spend_tx":"0x77ff894ed5be5694a806d0b7c17666be0bbe5dbf64a4340eb10374fa04f11bdb",
  "second_cohort_private_send_fee_gross_rls":"4.416",
  "second_cohort_private_spend_tamper_tests_pass":38,
  "independent_receiver_cumulative_shielded_rls_observed":"6",
  "shielded_faucet_direct_claim_performed":False,
  "direct_faucet_cooldown_ui_all_four_get_disabled_observed":True,
  "temporal_shifted_placebo_windows_scanned":30,
  "ui_only_overspend_rejected_without_transaction":True,
  "browser_qa_development_passed":None,
  "browser_qa_nested_production_passed":None,
  "remaining_user_actions":"Record/edit three actual demonstration videos and publish final X article and separate technical question. Two distinct funding-route private payment lifecycles are verified; no direct shielded faucet credit or privileged auditor decryption tested. One case per different treatment is not independent replication of the same treatment."
}
(STAGE/"RELEASE_STATUS.json").write_text(json.dumps(status,indent=2)+"\n")
archive=RELEASE/"rayls-nov-wq3-two-cohort-final-evidence-20261121.zip"
with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(STAGE.rglob("*")):
  if p.is_file():z.write(p,p.relative_to(STAGE).as_posix())
with zipfile.ZipFile(archive) as z:
 if z.testzip():raise RuntimeError("ZIP member failed CRC")
 if len(z.namelist())!=len(files)+2:raise RuntimeError("Unexpected ZIP count")
result={"status":"PASS","archive":str(archive),
  "archive_sha256":hashlib.sha256(archive.read_bytes()).hexdigest(),
  "size_bytes":archive.stat().st_size,"source_files":len(files),
  "zip_entries":len(files)+2,"wallet_keys_included":False,
  "final_research_evidence_complete":True,"user_video_and_x_publication_pending":True}
(RELEASE/"two-cohort-release-report.json").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result,indent=2))
