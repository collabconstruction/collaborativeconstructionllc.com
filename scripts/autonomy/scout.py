"""Scout prototype (Agent A). Deterministic, read only, no model calls, no network of its own.

It turns a health report (scripts/site_health.py output) into findings. A later phase may add
more sources behind the same adapter shape. Nothing here writes to GitHub: it returns findings
and a summary, and a human or an approved workflow decides what happens next.
"""
from . import evidence

SEVERITY_BY_NAME = {"www redirect": "P1", "contact endpoint": "P0"}


def findings_from_health(report):
    out = []
    for r in report.get("results", []):
        if r["status"] == "ok":
            continue
        name = r["name"]
        failed = r["status"] == "failed"
        severity = "P0" if failed else SEVERITY_BY_NAME.get(name, "P2")
        out.append(evidence.make_finding(
            subject=name,
            claim=r["note"],
            source_url=r["url"],
            source_type="site-response",
            label="verified-source",
            severity=severity,
            confidence="high",
            needs_owner_approval=(name == "www redirect"),
            owner="owner" if name == "www redirect" else "engineering",
            repro=[f"GET {r['url']}", f"observed HTTP {r.get('http_status', 'none')}"],
            recommended_test="status and Location regression in tests/test_site_health.py",
            blocked_reason="Cloudflare dashboard change needed" if name == "www redirect" else None,
            observed_at=None,
        ))
    return out


def run(health_report, known_ids=()):
    findings = evidence.dedupe(findings_from_health(health_report), known_ids)
    top = sorted(findings, key=lambda f: f["severity"])[:3]
    return {
        "new_findings": findings,
        "issue_candidates": [f for f in top if f["severity"] in ("P0", "P1") and not f["flags"]],
        "summary": f"{len(findings)} new finding(s); {len(top)} worth an owner's attention.",
    }
