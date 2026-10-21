#!/usr/bin/env python3
"""Raw HTML crawl facts for the 9 public pages: what a crawler sees before any JavaScript runs.

Usage: python3 scripts/seo_audit.py [base_url]   (default: the live site)
Prints one block per page and writes monitoring-output/seo-audit.json. Read only. Sends no form data.
This is the raw view only. It is not Google's rendered view or its index (use Search Console for those).
"""
import html as htmllib
import json
import pathlib
import re
import ssl
import sys
import urllib.error
import urllib.request

APEX = "https://collaborativeconstructionllc.com"
PAGES = ["/", "/about/", "/gallery/", "/construction-advisory/", "/general-contractor-falmouth-ma/",
         "/home-additions-cape-cod/", "/adu-builder-cape-cod/", "/home-renovation-cape-cod/",
         "/custom-home-builder-cape-cod/"]


def fetch(url):
    """Returns (status, body). Never raises for HTTP errors."""
    req = urllib.request.Request(url, headers={"User-Agent": "CollaborativeConstructionSeoAudit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ssl.create_default_context()) as r:
            return r.status, r.read(1_000_000).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except (urllib.error.URLError, TimeoutError, OSError):
        return None, ""


def _meta(s, attr, name):
    m = re.search(rf'<meta[^>]+{attr}="{re.escape(name)}"[^>]+content="([^"]*)"', s, re.I)
    return htmllib.unescape(m.group(1)) if m else None


def facts(page_html, url):
    s = page_html
    h1_raw = re.findall(r"<h1\b[^>]*>(.*?)</h1>", s, re.S | re.I)
    h1_text = [htmllib.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<br\s*/?>", " ", h))).strip()) for h in h1_raw]
    h1_stripped = [re.sub(r"<[^>]+>", "", h).strip() for h in h1_raw]
    title = re.search(r"<title>(.*?)</title>", s, re.S | re.I)
    canonical = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"', s, re.I)
    types = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            doc = json.loads(block)
            types += [n.get("@type") for n in doc.get("@graph", [doc])]
        except ValueError:
            types.append("INVALID-JSON")
    imgs = re.findall(r"<img\b[^>]*>", s, re.I)
    out = {
        "url": url,
        "title": htmllib.unescape(title.group(1).strip()) if title else None,
        "description": _meta(s, "name", "description"),
        "canonical": canonical.group(1) if canonical else None,
        "robots_meta": _meta(s, "name", "robots"),
        "h1_count": len(h1_raw),
        "h1_text": h1_text,
        "og": {k: _meta(s, "property", f"og:{k}") for k in ("title", "description", "image", "url")},
        "h2_count": len(re.findall(r"<h2\b", s, re.I)),
        "jsonld_types": types,
        "images": len(imgs),
        "images_without_alt": sum(1 for i in imgs if "alt=" not in i),
    }
    issues = []
    if out["h1_count"] == 0:
        issues.append("no H1 in raw HTML")
    if any(re.search(r"[a-z][.!?,:][A-Za-z]", t) for t in h1_stripped):
        issues.append("H1 words run together when tags are stripped")
    if out["canonical"] != url:
        issues.append(f"canonical {out['canonical']} differs from {url}")
    if out["og"]["url"] and out["og"]["url"] != out["canonical"]:
        issues.append("og:url differs from canonical")
    if out["robots_meta"] and "noindex" in out["robots_meta"].lower():
        issues.append("noindex")
    if not out["description"]:
        issues.append("no meta description")
    if "INVALID-JSON" in types:
        issues.append("JSON-LD does not parse")
    if out["images_without_alt"]:
        issues.append(f"{out['images_without_alt']} images without alt")
    out["issues"] = issues
    return out


def audit(base=APEX, fetcher=fetch):
    pages = []
    for path in PAGES:
        url = base + path
        status, body = fetcher(url)
        if status != 200:
            pages.append({"url": url, "http_status": status, "issues": [f"HTTP {status}"]})
            continue
        f = facts(body, url)
        f["http_status"] = status
        pages.append(f)
    return {"schema": "seo-audit/1", "base": base, "pages": pages}


if __name__ == "__main__":
    report = audit(sys.argv[1] if len(sys.argv) > 1 else APEX)
    out = pathlib.Path("monitoring-output")
    out.mkdir(exist_ok=True)
    (out / "seo-audit.json").write_text(json.dumps(report, indent=2) + "\n")
    for p in report["pages"]:
        print(f"{p['url']}  H1x{p.get('h1_count')} {p.get('h1_text')}  title={p.get('title')!r}")
        for i in p["issues"]:
            print(f"   ISSUE: {i}")
