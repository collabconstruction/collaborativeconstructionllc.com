import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seo_audit', ROOT / 'scripts' / 'seo_audit.py')
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)

URL = 'https://collaborativeconstructionllc.com/about/'


def page(title='<title>Company | X</title>', canon=None, og=None, h1='<h1>Residential building. <br>Clear project coordination.</h1>',
         extra='', ld='{"@graph":[{"@type":"AboutPage"}]}', img='<img src="a" alt="x">'):
    canon = f'<link rel="canonical" href="{URL}">' if canon is None else canon
    og = og if og is not None else ''.join(f'<meta property="og:{k}" content="{v}">' for k, v in
         (('title', 'T'), ('description', 'D'), ('image', URL + 'i.jpg'), ('url', URL)))
    return f'<html><head>{title}<meta name="description" content="d">{canon}{og}{extra}<script type="application/ld+json">{ld}</script></head><body>{h1}{img}</body></html>'


class FactsTests(unittest.TestCase):
    def test_clean_page_has_no_issues(self):
        f = seo.facts(page(), URL)
        self.assertEqual(f['issues'], [])
        self.assertEqual(f['h1_text'], ['Residential building. Clear project coordination.'])
        self.assertEqual(f['jsonld_types'], ['AboutPage'])

    def test_attribute_order_and_single_quotes_are_parsed(self):
        html = f"""<html><head><title>T</title><meta content='d' name='description'>
        <link href='{URL}' rel='canonical'><meta content='T' property='og:title'><meta content='D' property='og:description'>
        <meta content='{URL}i.jpg' property='og:image'><meta content='{URL}' property='og:url'></head><body><h1>Hi there</h1></body></html>"""
        f = seo.facts(html, URL)
        self.assertEqual(f['issues'], [])
        self.assertEqual(f['canonicals'], [URL])

    def test_missing_title_and_empty_og_value(self):
        self.assertIn('missing title', seo.facts(page(title=''), URL)['issues'])
        empty = page(og=''.join(f'<meta property="og:{k}" content="{v}">' for k, v in
                    (('title', ' '), ('description', 'D'), ('image', 'i'), ('url', URL))))
        self.assertIn('empty og:title', seo.facts(empty, URL)['issues'])
        self.assertIn('missing og:title', seo.facts(page(og=''), URL)['issues'])

    def test_two_canonicals_two_h1s_and_wrong_canonical(self):
        two = page(canon=f'<link rel="canonical" href="{URL}"><link rel="canonical" href="{URL}x">')
        self.assertIn('2 canonical tags', seo.facts(two, URL)['issues'])
        self.assertTrue(any('2 H1s' in i for i in seo.facts(page(h1='<h1>A one</h1><h1>B two</h1>'), URL)['issues']))
        self.assertTrue(any('differs from' in i for i in seo.facts(page(), URL + 'x/')['issues']))

    def test_run_together_h1_missing_h1_noindex(self):
        self.assertIn('H1 words run together when tags are stripped', seo.facts(page(h1='<h1>building.<br>Clear</h1>'), URL)['issues'])
        self.assertIn('no H1 in raw HTML', seo.facts(page(h1='<div>x</div>'), URL)['issues'])
        self.assertIn('noindex', seo.facts(page(extra='<meta name="robots" content="noindex,follow">'), URL)['issues'])

    def test_invalid_jsonld_and_missing_alt(self):
        self.assertIn('JSON-LD does not parse', seo.facts(page(ld='{"@graph":'), URL)['issues'])
        self.assertIn('1 images without alt', seo.facts(page(img='<img src="a">'), URL)['issues'])

    def test_redirect_on_a_canonical_url_is_reported(self):
        f = seo.facts('', URL, 301, URL.rstrip('/') + '/other/')
        self.assertTrue(any('answers a redirect (301)' in i for i in f['issues']))


class AuditRunTests(unittest.TestCase):
    def test_audit_reports_http_errors_redirects_headers_and_hash(self):
        def fake(url):
            if url.endswith('/about/'):
                return 200, {'x-robots-tag': 'noindex'}, page().replace(URL, url)
            if url.endswith('/gallery/'):
                return 301, {'location': url + 'x'}, ''
            return 522, {}, ''
        report = seo.audit(fetcher=fake)
        by = {p['url'].rsplit('.com', 1)[1]: p for p in report['pages']}
        self.assertIn('X-Robots-Tag noindex header', by['/about/']['issues'])
        self.assertEqual(len(by['/about/']['raw_sha256']), 64)
        self.assertTrue(any('redirect' in i for i in by['/gallery/']['issues']))
        self.assertIn('HTTP 522', by['/']['issues'])


if __name__ == '__main__':
    unittest.main()
