#!/usr/bin/env python3
"""Public competitor website changes. No credentials, customer data, or AI claims."""
import concurrent.futures
import csv
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
import pathlib
import re
import ssl
import urllib.error
import urllib.request

CONFIG = pathlib.Path('config/competitor-watch.json')
PREVIOUS = pathlib.Path('previous/snapshot.json')
OUT = pathlib.Path('monitoring-output/competitors')
MAX_BYTES = 400_000
SKIP = {'script', 'style', 'nav', 'footer', 'header', 'noscript', 'svg'}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.main_depth = 0
        self.in_title = False
        self.in_h1 = False
        self.title = []
        self.headings = []
        self.current_heading = []
        self.description = ''
        self.main_text = []
        self.body_text = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = dict(attrs)
        if tag in SKIP:
            self.skip_depth += 1
        if tag in ('main', 'article'):
            self.main_depth += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'h1' and not self.skip_depth:
            self.in_h1 = True
            self.current_heading = []
        if tag == 'meta' and attrs.get('name', '').lower() == 'description':
            self.description = attrs.get('content', '')

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == 'title':
            self.in_title = False
        if tag == 'h1' and self.in_h1:
            heading = clean(' '.join(self.current_heading))
            if heading:
                self.headings.append(heading)
            self.in_h1 = False
        if tag in ('main', 'article'):
            self.main_depth = max(0, self.main_depth - 1)
        if tag in SKIP:
            self.skip_depth = max(0, self.skip_depth - 1)

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.in_h1:
            self.current_heading.append(data)
        if not self.skip_depth:
            self.body_text.append(data)
            if self.main_depth:
                self.main_text.append(data)


def clean(value):
    return re.sub(r'\s+', ' ', value).strip()


def extract(html):
    parser = PageParser()
    parser.feed(html)
    text = clean(' '.join(parser.main_text or parser.body_text))[:12000]
    return {
        'title': clean(' '.join(parser.title))[:200],
        'description': clean(parser.description)[:300],
        'h1': parser.headings[:4],
        'content_sha256': hashlib.sha256(text.encode('utf-8')).hexdigest(),
        'preview': text[:220],
    }


def fetch(site):
    result = {k: site[k] for k in ('name', 'town', 'url', 'category')}
    request = urllib.request.Request(site['url'], headers={
        'User-Agent': 'CollaborativeConstructionCompetitorWatch/1.0 (+public-pages-only)',
        'Accept': 'text/html,application/xhtml+xml',
    })
    try:
        with urllib.request.urlopen(request, timeout=16, context=ssl.create_default_context()) as response:
            status = response.status
            raw = response.read(MAX_BYTES + 1)
            result['status'] = status
            result['final_url'] = response.url
            result['truncated'] = len(raw) > MAX_BYTES
            if 'html' not in response.headers.get('Content-Type', '').lower():
                raise ValueError('Not an HTML response')
            encoding = response.headers.get_content_charset() or 'utf-8'
            result.update(extract(raw[:MAX_BYTES].decode(encoding, errors='replace')))
            result['ok'] = status == 200
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, UnicodeError) as exc:
        result['ok'] = False
        result['error'] = str(exc)[:220]
    return result


def compare(current, previous):
    previous_by_url = {p['url']: p for p in previous}
    changes = []
    for page in current:
        before = previous_by_url.get(page['url'])
        if not before:
            page['comparison'] = 'baseline'  # New to tracker, NOT a newly formed company
        elif not page.get('ok'):
            page['comparison'] = 'unavailable'
        elif not before.get('ok'):
            page['comparison'] = 'recovered'
        else:
            fields = [f for f in ('title', 'description', 'h1', 'content_sha256') if page.get(f) != before.get(f)]
            page['comparison'] = 'changed' if fields else 'unchanged'
            if fields:
                changes.append({'name': page['name'], 'url': page['url'], 'fields': fields,
                                'previous_title': before.get('title', ''), 'current_title': page.get('title', '')})
    return changes


def main():
    sites = json.loads(CONFIG.read_text(encoding='utf-8'))
    urls = [s['url'] for s in sites]
    if len(set(urls)) != len(urls) or not all(u.startswith('https://') for u in urls):
        raise ValueError('Config must contain distinct HTTPS URLs')
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        pages = list(pool.map(fetch, sites))
    previous = []
    previous_present = PREVIOUS.is_file()
    if previous_present:
        previous = json.loads(PREVIOUS.read_text(encoding='utf-8')).get('pages', [])
    changes = compare(pages, previous)
    stamp = dt.datetime.now(dt.timezone.utc).isoformat()
    OUT.mkdir(parents=True, exist_ok=True)
    snapshot = {'timestamp_utc': stamp, 'pages': pages}
    stats = {
        'monitored': len(pages), 'accessible': sum(bool(p.get('ok')) for p in pages),
        'unavailable': sum(not p.get('ok') for p in pages),
        'changed': len(changes), 'prior_baseline_found': previous_present,
    }
    report = {'timestamp_utc': stamp, 'summary': stats, 'changes': changes,
              'notes': 'Observed public HTML changes are NOT verified company news. Dynamic pages can cause false positives. No private APIs or AI research performed.'}
    (OUT / 'snapshot.json').write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + '\n')
    (OUT / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    lines = ['# Falmouth & Upper Cape competitor watch', '', f'Checked: {stamp}',
             f"Public websites: {stats['monitored']} | Accessible: {stats['accessible']} | Unavailable: {stats['unavailable']}",
             f"Observed changes: {stats['changed']} | Previous baseline: {'yes' if previous_present else 'no'}", '',
             '**Interpretation:** A website change is a lead to investigate, not proof of a project, hire, expansion, or business performance.', '',
             '## Observed changes', '']
    if changes:
        for item in changes:
            lines.append(f"- **{item['name']}** — {item['url']} — changed fields: {', '.join(item['fields'])}")
    else:
        lines.append('No changes detected against the available baseline.' if previous_present else 'First scan establishes a baseline; comparison begins next run.')
    lines.extend(['', '## Full monitored list', '', '| Company | Area | Status | Comparison | Website |', '|---|---|---|---|---|'])
    for p in pages:
        status = 'HTTP 200' if p.get('ok') else ('HTTP ' + str(p['status']) if p.get('status') else 'Unavailable')
        lines.append(f"| {p['name']} | {p['town']} | {status} | {p['comparison']} | {p['url']} |")
    lines.extend(['', '## Limitations', '',
                  '- Pages with JavaScript-rendered content may not be fully visible to this monitor.',
                  '- Some sites may block automated requests; that does not imply the business is unavailable.',
                  '- Reports are saved as GitHub Actions artifacts for 30 days; baselines are best-effort within artifact retention.',
                  '- This does not provide GA4, Search Console, social-media, reviews, or verified business-growth claims.', ''])
    (OUT / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    with (OUT / 'report.csv').open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['name', 'town', 'category', 'url', 'ok', 'status', 'comparison', 'title'])
        for p in pages:
            w.writerow([p['name'], p['town'], p['category'], p['url'], p.get('ok'), p.get('status', ''), p['comparison'], p.get('title', '')])
    print('\n'.join(lines[:18]))


if __name__ == '__main__':
    main()
