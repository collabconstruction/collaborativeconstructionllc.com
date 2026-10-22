#!/usr/bin/env python3
"""Read-only health check for the repository's GitHub Actions automations.

Does not assume a successful workflow means its report artifact was delivered.
Does not attempt to inspect ChatGPT/Claude scheduler internals.
Only uses GitHub's REST API with the run-scoped GITHUB_TOKEN.
"""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

UTC = dt.timezone.utc
BASE = "https://api.github.com"
OUTPUT = Path("monitoring-output/reliability")
SELF_WORKFLOW = "automation-reliability-watch.yml"

# Exact schedules are duplicated intentionally as audited expectations.
# If the underlying workflow schedule changes, update this list and its tests.
SCHEDULED = (
    {
        "name": "Public Website Health",
        "file": "public-website-health.yml",
        "hours": (0, 6, 12, 18), "minute": 17, "weekdays": None,
        "timezone": "UTC", "grace_minutes": 150,
        "artifact_prefix": "website-health-",
    },
    {
        "name": "Falmouth Contractor Watch",
        "file": "falmouth-competitor-watch.yml",
        "hours": (8,), "minute": 13, "weekdays": (0,),
        "timezone": "America/New_York", "grace_minutes": 240,
        "artifact_prefix": "competitor-watch-",
    },
)
# These are not scheduled. Absence of a recent run is NOT an outage.
ON_DEMAND = (
    {"name": "Release Check", "file": "release-check.yml"},
    {"name": "Cloudflare Ruleset Watch", "file": "cloudflare-ruleset-watch.yml"},
)
RECENT_MANUAL_FAILURE_HOURS = 48


def parse_timestamp(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def latest_due(now: dt.datetime, target: dict) -> dt.datetime:
    """Latest scheduled wall-clock slot, honoring target timezone and DST."""
    zone = ZoneInfo(target["timezone"])
    local_date = now.astimezone(zone).date()
    choices = []
    for days_back in range(10):
        day = local_date - dt.timedelta(days=days_back)
        if target["weekdays"] is not None and day.weekday() not in target["weekdays"]:
            continue
        for hour in target["hours"]:
            value = dt.datetime.combine(day, dt.time(hour, target["minute"]), tzinfo=zone)
            value = value.astimezone(UTC)
            if value <= now:
                choices.append(value)
    if not choices:
        raise ValueError("No due slot found within the lookback window")
    return max(choices)


def run_for_slot(runs: list[dict], due: dt.datetime) -> dict | None:
    """A manual/push run must never satisfy the expected scheduled run."""
    cutoff = due - dt.timedelta(minutes=10)
    valid = [
        r for r in runs
        if r.get("event") == "schedule" and r.get("created_at")
        and parse_timestamp(r["created_at"]) >= cutoff
    ]
    return max(valid, key=lambda r: parse_timestamp(r["created_at"]), default=None)


def check_scheduled(target: dict, now: dt.datetime, activated: dt.datetime,
                    meta: dict, runs: list[dict], artifacts: list[dict] | None) -> dict:
    item = {"name": target["name"], "file": target["file"],
            "kind": "scheduled", "status": "unknown", "details": "", "url": ""}
    if meta.get("state") != "active":
        item.update(status="critical", details="Workflow disabled or not active.")
        return item
    due = latest_due(now, target)
    item["expected_utc"] = due.isoformat()
    # Never claim a miss for a slot preceding the first deployment of this checker.
    if due <= activated:
        item.update(status="pending", details="Awaiting first scheduled slot since checker activation.")
        return item
    matched = run_for_slot(runs, due)
    if matched is None:
        lag = now - due
        if lag <= dt.timedelta(minutes=target["grace_minutes"]):
            item.update(status="pending", details="Scheduled slot still within GitHub delay allowance.")
        else:
            item.update(status="critical", details="No scheduled workflow run for the latest due slot.")
        return item
    item["url"] = matched.get("html_url", "")
    item["run_id"] = matched.get("id")
    status = matched.get("status")
    conclusion = matched.get("conclusion")
    if status != "completed":
        item.update(status="warning", details=f"Run exists but is not completed ({status or 'unknown'}).")
    elif conclusion != "success":
        item.update(status="critical", details=f"Scheduled run concluded {conclusion or 'unknown'}.")
    elif artifacts is None:
        item.update(status="unknown", details="Could not verify expected report artifact.")
    else:
        expected = f'{target["artifact_prefix"]}{matched["id"]}'
        found = any(a.get("name") == expected and not a.get("expired", False)
                    for a in artifacts)
        if found:
            item.update(status="ok", details="Scheduled run succeeded; expected report artifact present.")
        elif now - parse_timestamp(matched["updated_at"]) < dt.timedelta(minutes=15):
            item.update(status="pending", details="Run succeeded; artifact may still be publishing.")
        else:
            item.update(status="critical", details=f"Scheduled run succeeded but artifact {expected} is missing.")
    return item


def check_manual(meta: dict, runs: list[dict], target: dict, now: dt.datetime) -> dict:
    item = {"name": target["name"], "file": target["file"],
            "kind": "on-demand", "status": "info", "details": "", "url": ""}
    if meta.get("state") != "active":
        item.update(status="warning", details="Manual/PR workflow not active.")
    elif not runs:
        item["details"] = "No runs found (not a freshness failure for an on-demand workflow)."
    else:
        latest = max(runs, key=lambda r: parse_timestamp(r["created_at"]))
        item["url"] = latest.get("html_url", "")
        age = now - parse_timestamp(latest["created_at"])
        if latest.get("status") == "completed" and latest.get("conclusion") not in ("success", "skipped", "neutral"):
            if age <= dt.timedelta(hours=RECENT_MANUAL_FAILURE_HOURS):
                item.update(status="warning",
                            details=f"Recent on-demand/PR run concluded {latest.get('conclusion')}. Inspect before release.")
            else:
                item["details"] = "Most recent run failed, but is older than the review window."
        elif latest.get("status") != "completed":
            item["details"] = "Most recent on-demand/PR run is still in progress."
        else:
            item["details"] = "Latest on-demand/PR run completed; no periodic run required."
    return item


def fetch_json(url: str, token: str) -> dict:
    if not url.startswith(BASE + "/"):
        raise ValueError("Only api.github.com requests are permitted")
    req = Request(url, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "cc-automation-reliability-watch/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    try:
        with urlopen(req, timeout=18) as response:
            return json.load(response)
    except HTTPError as exc:
        raise RuntimeError(f"GitHub API returned HTTP {exc.code} for {url.split('?')[0]}") from None
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise RuntimeError(f"GitHub API request failed: {type(exc).__name__}") from None


def api_path(repo: str, path: str, token: str, params: dict | None = None) -> dict:
    url = f"{BASE}/repos/{repo}/{path}"
    if params:
        url += "?" + urlencode(params)
    return fetch_json(url, token)


def evaluate(repo: str, token: str, now: dt.datetime) -> dict:
    now = now.astimezone(UTC)
    failures = []
    results = []
    try:
        monitor = api_path(repo, f"actions/workflows/{SELF_WORKFLOW}", token)
        activated = parse_timestamp(monitor["created_at"])
    except (RuntimeError, KeyError, TypeError, ValueError) as exc:
        failures.append(f"Cannot determine monitor activation: {exc}")
        activated = now  # Withhold missed-run claims without a trustworthy baseline.
    for target in SCHEDULED:
        path = f'actions/workflows/{target["file"]}'
        try:
            meta = api_path(repo, path, token)
            payload = api_path(repo, path + "/runs", token, {
                "event": "schedule", "branch": "main", "per_page": 30,
            })
            runs = payload.get("workflow_runs", [])
            due = latest_due(now, target)
            matched = run_for_slot(runs, due)
            artifacts = None
            if matched and matched.get("status") == "completed" and matched.get("conclusion") == "success":
                try:
                    data = api_path(repo, f'actions/runs/{matched["id"]}/artifacts', token,
                                    {"per_page": 100})
                    artifacts = data.get("artifacts", [])
                except RuntimeError as exc:
                    failures.append(f'{target["name"]} artifact verification unavailable: {exc}')
            results.append(check_scheduled(target, now, activated, meta, runs, artifacts))
        except (RuntimeError, ValueError, KeyError, TypeError) as exc:
            failures.append(f'{target["name"]} inspection unavailable: {exc}')
            results.append({"name": target["name"], "file": target["file"],
                            "kind": "scheduled", "status": "unknown",
                            "details": "GitHub API inspection unavailable; not healthy by assumption.", "url": ""})
    for target in ON_DEMAND:
        path = f'actions/workflows/{target["file"]}'
        try:
            meta = api_path(repo, path, token)
            data = api_path(repo, path + "/runs", token, {"per_page": 8})
            results.append(check_manual(meta, data.get("workflow_runs", []), target, now))
        except (RuntimeError, ValueError, KeyError, TypeError) as exc:
            failures.append(f'{target["name"]} inspection unavailable: {exc}')
            results.append({"name": target["name"], "file": target["file"],
                            "kind": "on-demand", "status": "unknown",
                            "details": "GitHub API inspection unavailable.", "url": ""})
    counts = {s: sum(x["status"] == s for x in results)
              for s in ("ok", "critical", "warning", "pending", "unknown", "info")}
    if failures or counts["critical"]:
        overall = "critical"
    elif counts["warning"] or counts["unknown"] or counts["pending"]:
        overall = "attention"
    else:
        overall = "ok"
    return {"checked_at_utc": now.isoformat(), "repository": repo,
            "overall": overall, "counts": counts, "checks": results,
            "api_errors": failures,
            "external_schedulers": "unverifiable: ChatGPT/Claude task states are not exposed to GitHub Actions",
            "blind_spot": "This checker cannot detect its own failure to run. External watchdog required."}


def markdown(result: dict) -> str:
    lines = [
        "# Automation Reliability Watch", "",
        f'Checked (UTC): {result["checked_at_utc"]}',
        f'Overall: **{result["overall"].upper()}**', "",
        "| Automation | Mode | Status | Evidence |",
        "|---|---|---|---|",
    ]
    for item in result["checks"]:
        name = item["name"]
        evidence = item.get("details", "").replace("|", "/").replace("\n", " ")
        if item.get("url"):
            evidence += f' ([run]({item["url"]}))'
        lines.append(f'| {name} | {item["kind"]} | **{item["status"]}** | {evidence} |')
    lines += ["", "## Coverage and limitations", "",
        "- Scheduled workflows: verify expected run *event*, timing, conclusion, and named artifact.",
        "- Manual/PR workflows: report recent failures; never require a daily run.",
        "- Successful run and saved artifact are not proof that scanned sources were complete or accurate.",
        "- GitHub schedules can be delayed/dropped; a missed slot after grace is an alert, not proof of a broken script.",
        "- ChatGPT/Claude task status, Gmail/Drive coverage, and private lead data are NOT checked.",
        "- This workflow cannot detect its own failure to start; use an independent external watcher.",
        "- Report artifact retained 30 days; no commits, issues, deployments, or customer data changes.", ""]
    if result["api_errors"]:
        lines += ["## API inspection errors", ""]
        lines += ["- " + e for e in result["api_errors"]]
    return "\n".join(lines) + "\n"


def main() -> int:
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    token = os.environ.get("GH_TOKEN", "")
    if not repo or not token:
        print("Missing GITHUB_REPOSITORY or GH_TOKEN", file=sys.stderr)
        return 2
    result = evaluate(repo, token, dt.datetime.now(UTC))
    report = markdown(result)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "report.md").write_text(report, encoding="utf-8")
    (OUTPUT / "status.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report)
    print(report)
    if result["overall"] == "critical":
        print("::error::Automation reliability watch found a critical issue or missing visibility")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
