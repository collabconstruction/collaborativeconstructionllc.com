import importlib.util
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('seo_audit', ROOT / 'scripts' / 'seo_audit.py')
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)

URL = 'https://collaborativeconstructionllc.com/about/'
GOOD = f'''<html><head><title>Company | X</title><meta name="description" content="d">
<link rel="canonical" href="{URL}"><meta property="og:url" content="{URL}">
<script type="application/ld+json">{{"@graph":[{{"@type":"AboutPage"}}]}}</script></head>
<body><h1>Residential building. <br>Clear project coordination.</h1><img src="a" alt="x"></body></html>'''


class SeoAuditTests(unittest.TestCase):
    def test_clean_page_has_no_issues(self):
        f = seo.facts(GOOD, URL)
        self.assertEqual(f['issues'], [])
        self.assertEqual(f['h1_text'], ['Residential building. Clear project coordination.'])
        self.assertEqual(f['jsonld_types'], ['AboutPage'])

    def test_run_together_h1_missing_h1_noindex_and_bad_canonical_are_reported(self):
        bad = GOOD.replace('building. <br>', 'building.<br>')
        self.assertIn('H1 words run together when tags are stripped', seo.facts(bad, URL)['issues'])
        self.assertIn('no H1 in raw HTML', seo.facts(GOOD.replace('h1', 'div'), URL)['issues'])
        noindex = GOOD.replace('<head>', '<head><meta name="robots" content="noindex">')
        self.assertIn('noindex', seo.facts(noindex, URL)['issues'])
        self.assertTrue(any('canonical' in i for i in seo.facts(GOOD, URL + 'x/')['issues']))

    def test_image_without_alt_and_bad_jsonld(self):
        f = seo.facts(GOOD.replace('alt="x"', '').replace('"AboutPage"}]}', '"AboutPage"'), URL)
        self.assertIn('1 images without alt', f['issues'])
        self.assertIn('JSON-LD does not parse', f['issues'])


if __name__ == '__main__':
    unittest.main()


class AuditRunTests(unittest.TestCase):
    def test_audit_uses_canonical_urls_and_reports_http_errors(self):
        def fake(url):
            return (200, GOOD.replace(URL, url)) if url.endswith('/about/') else (522, '')
        report = seo.audit(fetcher=fake)
        about = [p for p in report['pages'] if p['url'].endswith('/about/')][0]
        self.assertEqual(about['issues'], [])
        self.assertIn('HTTP 522', report['pages'][0]['issues'])
