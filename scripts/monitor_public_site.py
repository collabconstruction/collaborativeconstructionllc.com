#!/usr/bin/env python3
"""Public, credential-free monitoring. Never submit contact forms or handle visitor data.

Logic lives in scripts/site_health.py so it can be tested with fake responses.
Exit status: non-zero only when the site itself is failing. Degraded results (for example the
www redirect) are written to the report, annotated as warnings and put in the job summary.
Set MONITOR_STRICT=1 to treat degraded as a failure too.
"""
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import site_health  # noqa: E402

report = site_health.main(step_summary=os.environ.get("GITHUB_STEP_SUMMARY"))
if report["overall"] == "failed":
    sys.exit("Website health check failed: see monitoring-output/health.md")
if report["overall"] == "degraded" and os.environ.get("MONITOR_STRICT") == "1":
    sys.exit("Website health degraded and MONITOR_STRICT=1")
