#!/usr/bin/env python3
"""Detect unexpected Cloudflare ruleset changes for this zone.

Separate from scripts/monitor_public_site.py on purpose: that monitor is deliberately
credential-free and runs on a public schedule. This check needs an authenticated
Cloudflare API token (Zone > Zone WAF > Read is enough, scoped to this zone only) and is
not wired into the scheduled workflow. Run it by hand, or from the workflow_dispatch-only
job in .github/workflows/cloudflare-ruleset-watch.yml once CLOUDFLARE_API_TOKEN exists as
a repo secret.

GET requests only. Never creates, edits, or deletes anything in Cloudflare.

Compares the live ruleset list — and, for zone-owned rulesets, the full rule contents,
including action_parameters (redirect target, status code, preserve_query_string), enabled
state, and rule order — against config/cloudflare-ruleset-baseline.json, the known-good
state recorded alongside docs/releases/2026-10-21-cloudflare-www-redirect-rule.md.

Five possible outcomes (the `status` field), each with its own exit code so a human or a
workflow log can tell them apart without reading the JSON body:

    ok              0   Live state matches the baseline exactly.
    not_checked     0   No CLOUDFLARE_API_TOKEN available. Not a failure — this check is
                        optional and intentionally does not run without a credential.
    degraded        1   Only low-priority findings (see "severity" below) — worth a look,
                        not an emergency.
    drift_detected  2   At least one critical finding: a security-relevant rule changed,
                        disappeared, or a new rule a token could have created appeared.
    error           3   The check itself could not be completed and trusted: an expired or
                        invalid credential, an HTTP error from Cloudflare, a response that
                        didn't parse, or a baseline file that is missing required data.
                        Never conflated with "ok" — an unreadable or unverifiable ruleset is
                        always escalated, never silently treated as a pass.

Each finding carries a `severity` of "critical" or "review":

    critical  A zone-kind (kind: "zone") ruleset is the one thing a Cloudflare API token
              scoped to this zone can actually create, edit, or delete. Any unexpected,
              missing, or modified zone-kind ruleset — including a rule whose action,
              expression, action_parameters, enabled state, or position in the list changed
              — is treated as potentially attacker- or mistake-driven and is critical.
    review    A managed ruleset (kind: "managed") is authored and versioned by Cloudflare
              itself; this API token cannot create or alter one. Cloudflare does add,
              retire, or replace its own managed rulesets over time as part of normal
              product changes (its `version` field also bumps on its own schedule — that is
              expected and is never compared). So an unexpected or missing managed ruleset
              ID is flagged for a human to glance at, not escalated to drift_detected.
              A zone-kind ruleset's cosmetic name/description changing (not its rules,
              phase, or kind) is also "review": it does not change what the ruleset does.

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

EXIT_CODES = {"ok": 0, "not_checked": 0, "degraded": 1, "drift_detected": 2, "error": 3}


def load_baseline(path=BASELINE_PATH):
    return json.loads(path.read_text())


def _get(path, token):
    """Real network call. Tests replace this via the `getter` parameter below.

    HTTP-level errors (401, 403, 5xx, Cloudflare's own `success: false` body) are returned
    as a dict so the caller can inspect them — they are not control flow. A connection
    failure, timeout, or a response that is not valid JSON raises, and is caught by check()
    so it always becomes a clean "error" result instead of an uncaught traceback.
    """
    request = urllib.request.Request(API_BASE + path, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(request, timeout=18) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            parsed = json.loads(body.decode("utf-8")) if body else {}
        except ValueError:
            parsed = {}
        if not isinstance(parsed, dict):
            parsed = {}
        parsed.setdefault("success", False)
        parsed["_http_status"] = e.code
        return parsed


def _normalize_text(value):
    if not isinstance(value, str):
        return value
    return " ".join(value.split()).strip()


def _rule_fingerprint(rule):
    """Normalize one rule down to the fields that matter for security behavior.

    Deliberately excludes `last_updated` and `version` — Cloudflare sets and changes these
    on every rule and ruleset automatically; comparing them would make every live check
    report drift that never actually happened (pure metadata noise, not a real change).
    """
    ap = rule.get("action_parameters") or {}
    from_value = ap.get("from_value") or {}
    target = from_value.get("target_url") or {}
    return {
        "id": rule.get("id"),
        "ref": rule.get("ref"),
        "action": rule.get("action"),
        "expression": _normalize_text(rule.get("expression")),
        "enabled": rule.get("enabled", True),
        "action_parameters": {
            "status_code": from_value.get("status_code", 301),
            "preserve_query_string": bool(from_value.get("preserve_query_string", False)),
            "target_url_expression": _normalize_text(target.get("expression")),
            "target_url_value": _normalize_text(target.get("value")),
        },
    }


def _critical(kind, **extra):
    return {"severity": "critical", "kind": kind, **extra}


def _review(kind, **extra):
    return {"severity": "review", "kind": kind, **extra}


def _overall_status(findings):
    if any(f["severity"] == "critical" for f in findings):
        return "drift_detected"
    if findings:
        return "degraded"
    return "ok"


def check(token, baseline=None, getter=_get):
    """Never returns "ok" or "degraded" for something it could not actually verify —
    any error mid-check (expired credential, Cloudflare HTTP error, malformed JSON,
    incomplete baseline) is caught here and reported as "error", not swallowed."""
    try:
        return _check(token, baseline, getter)
    except Exception as exc:
        return {"status": "error", "note": f"Could not complete the ruleset check: {exc}", "findings": []}


def _check(token, baseline, getter):
    if not token:
        return {
            "status": "not_checked",
            "note": "No CLOUDFLARE_API_TOKEN in the environment. This check needs authenticated "
                    "Cloudflare access and is not part of the credential-free public monitor.",
            "findings": [],
        }

    baseline = baseline or load_baseline()
    if not baseline.get("zone_id") or not baseline.get("zone_rulesets"):
        return {
            "status": "error",
            "note": "Baseline is missing zone_id or zone_rulesets; refusing to compare against an incomplete baseline.",
            "findings": [],
        }

    zone_id = baseline["zone_id"]
    listing = getter(f"/zones/{zone_id}/rulesets", token)
    if not isinstance(listing, dict) or not listing.get("success"):
        http_status = listing.get("_http_status") if isinstance(listing, dict) else None
        if http_status in (401, 403):
            return {"status": "error", "note": f"Cloudflare rejected the credential (HTTP {http_status}) — expired or invalid token.", "findings": []}
        errors = listing.get("errors") if isinstance(listing, dict) else listing
        return {"status": "error", "note": f"Cloudflare API call failed: {errors}", "findings": []}

    live = listing["result"]
    live_by_id = {r["id"]: r for r in live}
    baseline_zone = {r["id"]: r for r in baseline.get("zone_rulesets", [])}
    baseline_managed_ids = set(baseline.get("managed_ruleset_ids", []))

    findings = []

    for r in live:
        if r.get("kind") == "zone" and r["id"] not in baseline_zone:
            findings.append(_critical("unexpected_zone_ruleset", id=r["id"], name=r.get("name"), phase=r.get("phase")))
        elif r.get("kind") == "managed" and r["id"] not in baseline_managed_ids:
            findings.append(_review("unexpected_managed_ruleset", id=r["id"], name=r.get("name"), phase=r.get("phase")))

    for rid, expected in baseline_zone.items():
        if rid not in live_by_id:
            findings.append(_critical("missing_zone_ruleset", id=rid, name=expected.get("name")))
            continue

        live_entry = live_by_id[rid]
        if live_entry.get("phase") != expected.get("phase") or live_entry.get("kind", "zone") != expected.get("kind", "zone"):
            findings.append(_critical(
                "modified_zone_ruleset_metadata", id=rid, name=expected.get("name"),
                expected={"phase": expected.get("phase"), "kind": expected.get("kind", "zone")},
                live={"phase": live_entry.get("phase"), "kind": live_entry.get("kind")},
            ))
        if live_entry.get("name") != expected.get("name"):
            findings.append(_review("zone_ruleset_renamed", id=rid, expected_name=expected.get("name"), live_name=live_entry.get("name")))

        detail = getter(f"/zones/{zone_id}/rulesets/{rid}", token)
        if not isinstance(detail, dict) or not detail.get("success"):
            # Could not read the rules of a ruleset we know exists. Treat as critical, not
            # as "assume unchanged" — an unreadable config is never a pass (task requirement:
            # an API error or unreadable configuration must never look like a clean result).
            findings.append(_critical("zone_ruleset_unreadable", id=rid, name=expected.get("name")))
            continue

        live_rules = [_rule_fingerprint(x) for x in detail["result"].get("rules", [])]
        expected_rules = [_rule_fingerprint(x) for x in expected.get("rules", [])]
        if live_rules != expected_rules:
            findings.append(_critical(
                "modified_zone_ruleset", id=rid, name=expected.get("name"),
                live_rules=live_rules, expected_rules=expected_rules,
            ))

    for mid in baseline_managed_ids:
        if mid not in live_by_id:
            findings.append(_review("missing_managed_ruleset", id=mid))

    return {
        "status": _overall_status(findings),
        "note": "compared live Cloudflare rulesets to config/cloudflare-ruleset-baseline.json",
        "findings": findings,
    }


def main():
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    result = check(token)
    print(json.dumps(result, indent=2))
    sys.exit(EXIT_CODES.get(result["status"], EXIT_CODES["error"]))


if __name__ == "__main__":
    main()
