#!/usr/bin/env python3
"""Dry run of the Scout over an existing health report. Prints findings. Changes nothing.

Usage: python3 scripts/autonomy/run_scout.py [monitoring-output/health.json] [known_ids.json]
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from autonomy import scout  # noqa: E402

report = json.loads(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "monitoring-output/health.json").read_text())
known = json.loads(pathlib.Path(sys.argv[2]).read_text()) if len(sys.argv) > 2 else []
out = scout.run(report, known)
print(json.dumps(out, indent=2))
print(out["summary"], file=sys.stderr)
