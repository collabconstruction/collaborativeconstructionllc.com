# Operator guide

Run the tests: `python3 -m unittest discover -s tests -p "test_*.py"`

Check the live site by hand: `python3 scripts/monitor_public_site.py`. Output goes to `monitoring-output/health.md` and `health.json`. Exit code is non zero only for `failed`. Set `MONITOR_STRICT=1` to fail on `degraded` too.

See what the Scout would report: `python3 scripts/autonomy/run_scout.py monitoring-output/health.json`. It prints findings and changes nothing.

From GitHub: Actions, then "Autonomy Scout Dry Run", then Run workflow. It is manual only.

Reading a health result:
- OK: as designed.
- DEGRADED: still serving, but something needs a person (for example `www` returns 522, or a page is slow, or a rate limit answered).
- FAILED: the site or contact endpoint is not behaving. Treat as urgent.

Pause everything: create `autonomy.STOP` in the repository root, or disable the workflows in GitHub Actions settings.
Resume: delete the file or re-enable the workflows.
