#!/usr/bin/env python3
"""Public, credential-free monitoring. Never submit contact forms or handle visitor data."""
import datetime
import json
import pathlib
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

BASE = "https://collaborativeconstructionllc.com"
PATHS = ["/", "/robots.txt", "/sitemap.xml"]
out = pathlib.Path("monitoring-output")
out.mkdir(exist_ok=True)
results = []
for path in PATHS:
    url = BASE + path
    started = time.monotonic()
    request = urllib.request.Request(url, headers={"User-Agent": "CollaborativeConstructionHealthMonitor/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=18, context=ssl.create_default_context()) as response:
            body = response.read(512000).decode("utf-8", errors="replace")
            status = response.status
            final_url = response.url
            content_type = response.headers.get("Content-Type", "")
        result = {"path": path, "status": status, "ok": status == 200, "final_url": final_url, "content_type": content_type}
        if path == "/":
            result["has_title"] = bool(re.search(r"<title\\b[^>]*>\\s*[^<]+", body, re.I))
            result["has_description"] = bool(re.search(r'<meta\\s+[^>]*name=["\\\']description["\\\']', body, re.I))
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        result = {"path": path, "ok": False, "error": str(exc)[:240]}
    result["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    results.append(result)

report = {
    "checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "site": BASE,
    "results": results,
    "notes": "Public availability only; not a GA4, Search Console, Core Web Vitals, or contact-form submission test."
}
(out / "health.json").write_text(json.dumps(report, indent=2) + "\n")
summary = ["# Public website health", "", f"Site: {BASE}", f"Checked: {report['checked_at_utc']}", ""]
for item in results:
    summary.append(f"- {item['path']}: {'OK' if item['ok'] else 'CHECK'} — HTTP {item.get('status','unavailable')}, {item['elapsed_ms']} ms")
(out / "health.md").write_text("\n".join(summary) + "\n")
print("\n".join(summary))
# Only homepage failure pages the job; robots/sitemap may be absent by design.
if not results[0]["ok"]:
    sys.exit("Homepage availability check failed")
