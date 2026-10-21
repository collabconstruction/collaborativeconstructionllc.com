#!/usr/bin/env python3
"""Public website health logic. Credential-free. Never submits a form or sends visitor data.

Each check returns a dict with a `status` of ok, degraded or failed:
  ok        behaves as designed
  degraded  worth a warning, the site is still serving (www redirect broken, rate limited,
            an optional asset missing, a slow page)
  failed    the site itself is not serving (apex page down, wrong content type)
Only `failed` makes the monitor exit non-zero. Degraded results are in the report and in
the GitHub step summary so they cannot hide behind a green run.
"""
import datetime
import json
import pathlib
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request

APEX = "https://collaborativeconstructionllc.com"
WWW = "https://www.collaborativeconstructionllc.com"
USER_AGENT = "CollaborativeConstructionHealthMonitor/2.0"
SLOW_MS = 4000

PAGES = [
    "/", "/about/", "/gallery/", "/construction-advisory/", "/general-contractor-falmouth-ma/",
    "/home-additions-cape-cod/", "/adu-builder-cape-cod/", "/home-renovation-cape-cod/",
    "/custom-home-builder-cape-cod/",
]
FILES = ["/robots.txt", "/sitemap.xml"]
ASSETS = ["/css/styles.css", "/js/main.js", "/llms.txt", "/assets/logo.png"]


class Response:
    def __init__(self, status=None, headers=None, body="", url="", error=None, elapsed_ms=0):
        self.status = status
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}
        self.body = body
        self.url = url
        self.error = error
        self.elapsed_ms = elapsed_ms


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def fetch(url, method="GET", follow=True, timeout=18):
    """Real network fetch. Tests replace this with a fake."""
    request = urllib.request.Request(url, method=method, headers={"User-Agent": USER_AGENT})
    handlers = [urllib.request.HTTPSHandler(context=ssl.create_default_context())]
    if not follow:
        handlers.append(_NoRedirect())
    opener = urllib.request.build_opener(*handlers)
    started = time.monotonic()
    try:
        with opener.open(request, timeout=timeout) as r:
            body = r.read(512000).decode("utf-8", errors="replace") if method == "GET" else ""
            return Response(r.status, dict(r.headers), body, r.url, None, _ms(started))
    except urllib.error.HTTPError as e:
        return Response(e.code, dict(e.headers or {}), "", url, None, _ms(started))
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return Response(None, {}, "", url, str(e)[:200], _ms(started))


def _ms(started):
    return round((time.monotonic() - started) * 1000)


def _result(name, url, status, note, resp=None, **extra):
    out = {"name": name, "url": url, "status": status, "note": note}
    if resp is not None:
        out["http_status"] = resp.status
        out["elapsed_ms"] = resp.elapsed_ms
        if resp.error:
            out["error"] = resp.error
    out.update(extra)
    return out


def check_page(path, fetcher=fetch, base=APEX):
    url = base + path
    r = fetcher(url)
    if r.error or r.status is None:
        return _result(f"page {path}", url, "failed", "no response", r)
    if r.status == 429:
        return _result(f"page {path}", url, "degraded", "rate limited (429), not a site fault", r)
    if r.status != 200:
        return _result(f"page {path}", url, "failed", f"HTTP {r.status}", r)
    body = r.body.lower()
    if "<title" not in body or "</title>" not in body:
        return _result(f"page {path}", url, "degraded", "200 but no <title>", r)
    if not re.search(r'<meta[^>]+name=["\']description["\']', r.body, re.I):
        return _result(f"page {path}", url, "degraded", "200 but no meta description", r)
    if r.elapsed_ms > SLOW_MS:
        return _result(f"page {path}", url, "degraded", f"slow ({r.elapsed_ms} ms)", r)
    return _result(f"page {path}", url, "ok", "ok", r)


def check_file(path, fetcher=fetch, base=APEX, required=True):
    url = base + path
    r = fetcher(url)
    if r.error or r.status is None:
        return _result(f"file {path}", url, "failed" if required else "degraded", "no response", r)
    if r.status == 429:
        return _result(f"file {path}", url, "degraded", "rate limited (429)", r)
    if r.status != 200:
        return _result(f"file {path}", url, "degraded", f"HTTP {r.status}", r)
    return _result(f"file {path}", url, "ok", "ok", r)


def check_www(path="/about/", query="?monitor=1", fetcher=fetch):
    """www must answer with one permanent redirect to the same path and query on the apex."""
    url = WWW + path + query
    r = fetcher(url, "GET", False)
    expected = APEX + path + query
    if r.error or r.status is None:
        return _result("www redirect", url, "degraded", "www did not answer (timeout or connection error)", r)
    if r.status in (301, 308):
        loc = r.headers.get("location", "")
        if loc == expected:
            return _result("www redirect", url, "ok", f"{r.status} to the apex, path and query kept", r, location=loc)
        return _result("www redirect", url, "degraded", f"{r.status} but Location is {loc or 'missing'}, expected {expected}", r, location=loc)
    if r.status in (302, 303, 307):
        return _result("www redirect", url, "degraded", f"temporary redirect {r.status}, expected a permanent 301", r, location=r.headers.get("location", ""))
    if r.status == 200:
        return _result("www redirect", url, "degraded", "www serves the site instead of redirecting (duplicate content)", r)
    if r.status == 429:
        return _result("www redirect", url, "degraded", "rate limited (429), could not check", r)
    return _result("www redirect", url, "degraded", f"HTTP {r.status} on www (522 means Cloudflare cannot reach an origin for this name)", r)


def check_contact_endpoint(fetcher=fetch):
    """Non-mutating: GET must be refused with 405 and Allow: POST. No form data is ever sent."""
    url = APEX + "/api/contact"
    r = fetcher(url, "GET")
    if r.error or r.status is None:
        return _result("contact endpoint", url, "failed", "no response", r)
    if r.status == 405:
        allow = r.headers.get("allow", "")
        if "POST" in allow.upper():
            return _result("contact endpoint", url, "ok", "405 with Allow: POST, as designed", r)
        return _result("contact endpoint", url, "degraded", "405 but no Allow: POST header", r)
    if r.status == 429:
        return _result("contact endpoint", url, "degraded", "rate limited (429)", r)
    if r.status in (200, 201, 202):
        return _result("contact endpoint", url, "failed", f"GET answered {r.status}; the endpoint should refuse GET", r)
    return _result("contact endpoint", url, "failed", f"HTTP {r.status}, expected 405", r)


def run_all(fetcher=fetch):
    results = [check_page(p, fetcher) for p in PAGES]
    results += [check_file(p, fetcher) for p in FILES]
    results += [check_file(p, fetcher, required=False) for p in ASSETS]
    results.append(check_www(fetcher=fetcher))
    results.append(check_contact_endpoint(fetcher))
    return results


def overall(results):
    states = {r["status"] for r in results}
    return "failed" if "failed" in states else ("degraded" if "degraded" in states else "ok")


def build_report(results, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    counts = {s: sum(1 for r in results if r["status"] == s) for s in ("ok", "degraded", "failed")}
    return {
        "schema": "site-health/2",
        "checked_at_utc": now.isoformat(),
        "site": APEX,
        "overall": overall(results),
        "counts": counts,
        "results": results,
        "notes": "Public availability only. Not GA4, Search Console, Core Web Vitals or a form submission test. No form data is sent.",
    }


def render_markdown(report):
    lines = ["# Public website health", "", f"Site: {report['site']}", f"Checked: {report['checked_at_utc']}",
             f"Overall: **{report['overall']}** (ok {report['counts']['ok']}, degraded {report['counts']['degraded']}, failed {report['counts']['failed']})", ""]
    for r in report["results"]:
        mark = {"ok": "OK", "degraded": "DEGRADED", "failed": "FAILED"}[r["status"]]
        lines.append(f"- {mark}: {r['name']}: {r['note']} (HTTP {r.get('http_status', 'none')}, {r.get('elapsed_ms', 0)} ms)")
    return "\n".join(lines) + "\n"


def github_annotations(report):
    out = []
    for r in report["results"]:
        if r["status"] == "failed":
            out.append(f"::error title={r['name']}::{r['note']} ({r['url']})")
        elif r["status"] == "degraded":
            out.append(f"::warning title={r['name']}::{r['note']} ({r['url']})")
    return out


def main(out_dir="monitoring-output", fetcher=fetch, step_summary=None):
    results = run_all(fetcher)
    report = build_report(results)
    out = pathlib.Path(out_dir)
    out.mkdir(exist_ok=True)
    (out / "health.json").write_text(json.dumps(report, indent=2) + "\n")
    md = render_markdown(report)
    (out / "health.md").write_text(md)
    print(md)
    for line in github_annotations(report):
        print(line)
    if step_summary:
        with open(step_summary, "a") as fh:
            fh.write(md)
    return report
