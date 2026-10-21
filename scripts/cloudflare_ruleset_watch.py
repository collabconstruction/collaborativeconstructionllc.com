#!/usr/bin/env python3
"""Detect unexpected Cloudflare ruleset changes for this zone.

Separate from scripts/monitor_public_site.py on purpose: that monitor is deliberately
credential-free and runs on a public schedule. This check needs an authenticated
Cloudflare API token (Zone > Zone WAF > Read is enough, scoped to this zone only) and is
not wired into the scheduled workflow. Run it by hand, or from a workflow_dispatch-only
job once CLOUDFLARE_API_TOKEN exists as a repo secret — see
.github/workflows/cloudflare-ruleset-watch.yml.

GET requests only. Never creates, edits, or deletes anything in Cloudflare.

Compares the live ruleset list (and, for zone-owned rulesets, their rules) against
config/cloudflare-ruleset-baseline.json, which records the known-good state captured
alongside docs/releases/2026-10-21-cloudflare-www-redirect-rule.md. Flags:
  - a zone-owned ruleset whose id isn't in the baseline (unexpected_zone_ruleset)
  - a baseline zone-owned ruleset missing live (missing_zone_ruleset)
  - a baseline zone-owned ruleset whose rules differ from the baseline (modified_zone_ruleset)
  - a managed ruleset whose id isn't in the baseline's allow-list (unexpected_managed_ruleset)
  - a baseline managed ruleset id missing live (missing_managed_ruleset, degraded only —
    Cloudflare can legitimately retire or replace one of its own managed rulesets)

Update the baseline file deliberately (and re-commit it) whenever a Cloudflare ruleset
change is intentionally approved and applied; this script does not write to the baseline.
"""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

API_BASE = "https://api.cloudflare.com/client/v4"
BASELINE_PATH = pathlib.Path(__file__).resolve().parent.parent / "config" / "cloudflare-ruleset-baseline.json"


def load_baseline(path=BASELINE_PATH):
    return json.loads(path.read_text())


def _get(path, token):
    """Real network call. Tests replace this via the `getter` parameter below."""
    request = urllib.request.Request(API_BASE + path, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(request, timeout=18) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8"))


def _rule_fingerprint(rule):
    return {
        "id": rule.get("id"),
        "ref": rule.get("ref"),
        "action": rule.get("action"),
        "expression": rule.get("expression"),
        "enabled": rule.get("enabled", True),
    }


def check(token, baseline=None, getter=_get):
    baseline = baseline or load_baseline()
    zone_id = baseline["zone_id"]

    if not token:
        return {
            "status": "skipped",
            "note": "No CLOUDFLARE_API_TOKEN in the environment. This check needs authenticated "
                    "Cloudflare access and is not part of the credential-free public monitor.",
            "findings": [],
        }

    listing = getter(f"/zones/{zone_id}/rulesets", token)
    if not listing.get("success"):
        return {"status": "error", "note": f"Cloudflare API call failed: {listing.get('errors')}", "findings": []}

    live = listing["result"]
    live_by_id = {r["id"]: r for r in live}
    baseline_zone = {r["id"]: r for r in baseline.get("zone_rulesets", [])}
    baseline_managed_ids = set(baseline.get("managed_ruleset_ids", []))

    findings = []
    for r in live:
        if r["kind"] == "zone" and r["id"] not in baseline_zone:
            findings.append({"severity": "alert", "kind": "unexpected_zone_ruleset", "id": r["id"], "name": r.get("name"), "phase": r.get("phase")})
        elif r["kind"] == "managed" and r["id"] not in baseline_managed_ids:
            findings.append({"severity": "alert", "kind": "unexpected_managed_ruleset", "id": r["id"], "name": r.get("name"), "phase": r.get("phase")})

    for rid, expected in baseline_zone.items():
        if rid not in live_by_id:
            findings.append({"severity": "alert", "kind": "missing_zone_ruleset", "id": rid, "name": expected.get("name")})
            continue
        detail = getter(f"/zones/{zone_id}/rulesets/{rid}", token)
        if not detail.get("success"):
            findings.append({"severity": "alert", "kind": "zone_ruleset_unreadable", "id": rid, "name": expected.get("name")})
            continue
        live_rules = [_rule_fingerprint(x) for x in detail["result"].get("rules", [])]
        expected_rules = [_rule_fingerprint(x) for x in expected.get("rules", [])]
        if live_rules != expected_rules:
            findings.append({
                "severity": "alert", "kind": "modified_zone_ruleset", "id": rid, "name": expected.get("name"),
                "live_rules": live_rules, "expected_rules": expected_rules,
            })

    for mid in baseline_managed_ids:
        if mid not in live_by_id:
            findings.append({"severity": "degraded", "kind": "missing_managed_ruleset", "id": mid})

    if not findings:
        status = "ok"
    elif any(f["severity"] == "alert" for f in findings):
        status = "alert"
    else:
        status = "degraded"

    return {"status": status, "note": "compared live Cloudflare rulesets to config/cloudflare-ruleset-baseline.json", "findings": findings}


def main():
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    result = check(token)
    print(json.dumps(result, indent=2))
    if result["status"] == "alert":
        sys.exit("Unexpected Cloudflare ruleset change detected — see findings above")


if __name__ == "__main__":
    main()
