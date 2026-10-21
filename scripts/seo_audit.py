#!/usr/bin/env python3
"""Raw HTML crawl facts for the 9 public pages: what a crawler sees before any JavaScript runs.

Usage: python3 scripts/seo_audit.py [base_url]   (default: the live site)
Prints one block per page and writes monitoring-output/seo-audit.json (schema seo-audit/1).
Read only. Sends no form data. Does not follow redirects, so a redirect on a canonical page shows up.
This is the raw view only. It is not Google's rendered view or its index (use Search Console for those).
Parsing uses the standard library HTML parser, so attribute order, quote style and spacing do not matter.
"""
import hashlib
import html as htmllib
import json
import pathlib
import re
import ssl
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser

APEX = "https://collaborativeconstructionllc.com"
PAGES = ["/", "/about/", "/gallery/", "/construction-advisory/", "/general-contractor-falmouth-ma/",
         "/home-additions-cape-cod/", "/adu-builder-cape-cod/", "/home-renovation-cape-cod/",
         "/custom-home-builder-cape-cod/"]


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def fetch(url):
    """Returns (status, headers, body). Does not follow redirects. Never raises for HTTP errors."""
    req = urllib.request.Request(url, headers={"User-Agent": "CollaborativeConstructionSeoAudit/1.1"})
    opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl.create_default_context()), _NoRedirect())
    try:
        with opener.open(req, timeout=20) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read(1_000_000).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, ""
    except (urllib.error.URLError, TimeoutError, OSError):
        return None, {}, ""


class PageParser(HTMLParser):
    """Collects the crawl facts. Attribute order and quote style are handled by the parser."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titles, self.canonicals, self.h1_parts, self.jsonld = [], [], [], []
        self.meta, self.images = [], []
        self._in_title = self._in_h1 = self._in_ld = False
        self._buf = []

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self._in_title, self._buf = True, []
        elif tag == "h1":
            self._in_h1, self._buf = True, []
        elif tag == "br" and self._in_h1:
            self._buf.append("\u0000")  # marks a line break so "a.<br>B" can be told from "a. B"
        elif tag == "meta":
            self.meta.append(a)
        elif tag == "link" and "canonical" in a.get("rel", "").lower().split():
            self.canonicals.append(a.get("href", ""))
        elif tag == "img":
            self.images.append(a)
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._in_ld, self._buf = True, []

    def handle_data(self, data):
        if self._in_title or self._in_h1 or self._in_ld:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self.titles.append("".join(self._buf).strip())
            self._in_title = False
        elif tag == "h1" and self._in_h1:
            self.h1_parts.append("".join(self._buf))
            self._in_h1 = False
        elif tag == "script" and self._in_ld:
            self.jsonld.append("".join(self._buf))
            self._in_ld = False

    def meta_value(self, key, name):
        vals = [m.get("content", "") for m in self.meta if m.get(key, "").lower() == name]
        return vals


def facts(page_html, url, status=200, location=None):
    p = PageParser()
    p.feed(page_html)
    h1_text = [re.sub(r"\s+", " ", t.replace("\u0000", " ")).strip() for t in p.h1_parts]
    # what a tool that strips tags without adding spaces would read
    h1_naive = [t.replace("\u0000", "").strip() for t in p.h1_parts]
    types, ld_ok = [], True
    for block in p.jsonld:
        try:
            doc = json.loads(block)
            types += [n.get("@type") for n in (doc.get("@graph", [doc]) if isinstance(doc, dict) else doc)]
        except (ValueError, AttributeError):
            ld_ok = False
    og = {k: p.meta_value("property", f"og:{k}") for k in ("title", "description", "image", "url")}
    desc = p.meta_value("name", "description")
    robots = p.meta_value("name", "robots")
    out = {
        "url": url, "http_status": status, "location": location,
        "title": htmllib.unescape(p.titles[0]) if p.titles else None,
        "description": desc[0] if desc else None,
        "canonicals": p.canonicals,
        "robots_meta": robots[0] if robots else None,
        "h1_count": len(p.h1_parts), "h1_text": h1_text,
        "og": {k: (v[0] if v else None) for k, v in og.items()},
        "jsonld_types": types, "jsonld_valid": ld_ok,
        "images": len(p.images), "images_without_alt": sum(1 for i in p.images if "alt" not in i),
    }
    issues = []
    if status in (301, 302, 303, 307, 308):
        issues.append(f"canonical URL answers a redirect ({status}) to {location}")
    if not p.titles or not p.titles[0]:
        issues.append("missing title")
    if len(p.titles) > 1:
        issues.append("more than one title")
    if not out["description"]:
        issues.append("no meta description")
    if out["h1_count"] == 0:
        issues.append("no H1 in raw HTML")
    elif out["h1_count"] > 1:
        issues.append(f"{out['h1_count']} H1s (the site convention is one)")
    if any(re.search(r"[a-z][.!?,:][A-Za-z]", t) for t in h1_naive):
        issues.append("H1 words run together when tags are stripped")
    if len(p.canonicals) == 0:
        issues.append("no canonical")
    elif len(p.canonicals) > 1:
        issues.append(f"{len(p.canonicals)} canonical tags")
    elif p.canonicals[0] != url:
        issues.append(f"canonical {p.canonicals[0]} differs from {url}")
    for k, v in og.items():
        if not v:
            issues.append(f"missing og:{k}")
        elif not v[0].strip():
            issues.append(f"empty og:{k}")
        elif len(v) > 1:
            issues.append(f"{len(v)} og:{k} tags")
    if og["url"] and p.canonicals and og["url"][0] != p.canonicals[0]:
        issues.append("og:url differs from canonical")
    if out["robots_meta"] and "noindex" in out["robots_meta"].lower():
        issues.append("noindex")
    if not ld_ok:
        issues.append("JSON-LD does not parse")
    if out["images_without_alt"]:
        issues.append(f"{out['images_without_alt']} images without alt")
    out["issues"] = issues
    return out


def audit(base=APEX, fetcher=fetch):
    pages = []
    for path in PAGES:
        url = base + path
        status, headers, body = fetcher(url)
        if status is None:
            pages.append({"url": url, "http_status": None, "issues": ["no response"]})
        elif status == 200 or 300 <= status < 400:
            f = facts(body, url, status, headers.get("location"))
            f["raw_sha256"] = hashlib.sha256(body.encode()).hexdigest()
            xr = headers.get("x-robots-tag")
            if xr and "noindex" in xr.lower():
                f["issues"].append("X-Robots-Tag noindex header")
            pages.append(f)
        else:
            pages.append({"url": url, "http_status": status, "issues": [f"HTTP {status}"]})
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
