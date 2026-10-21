import importlib.util
import pathlib
import tempfile
import unittest

src = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'site_health.py'
spec = importlib.util.spec_from_file_location('site_health', src)
sh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sh)

PAGE = '<html><head><title>T</title><meta name="description" content="d"></head><body>x</body></html>'


def resp(status=200, headers=None, body=PAGE, error=None, ms=100):
    return sh.Response(status, headers or {}, body, '', error, ms)


def fake(table, default=None):
    """table maps (method, url) or url to a Response."""
    def f(url, method="GET", follow=True, timeout=18):
        return table.get((method, url)) or table.get(url) or default or resp(404, body="")
    return f


class PageTests(unittest.TestCase):
    def test_ok_200(self):
        self.assertEqual(sh.check_page('/', fake({sh.APEX + '/': resp()}))['status'], 'ok')

    def test_missing_title_is_degraded(self):
        r = sh.check_page('/', fake({sh.APEX + '/': resp(body='<html></html>')}))
        self.assertEqual(r['status'], 'degraded')

    def test_403_and_522_and_timeout_fail_the_page(self):
        for r_ in (resp(403), resp(522), resp(None, error='timed out')):
            self.assertEqual(sh.check_page('/about/', fake({sh.APEX + '/about/': r_}))['status'], 'failed')

    def test_429_is_degraded_not_failed(self):
        self.assertEqual(sh.check_page('/', fake({sh.APEX + '/': resp(429)}))['status'], 'degraded')

    def test_slow_page_is_degraded(self):
        self.assertEqual(sh.check_page('/', fake({sh.APEX + '/': resp(ms=9000)}))['status'], 'degraded')


class WwwTests(unittest.TestCase):
    url = sh.WWW + '/about/?monitor=1'
    good = sh.APEX + '/about/?monitor=1'

    def test_301_to_apex_keeping_path_and_query_is_ok(self):
        r = sh.check_www(fetcher=fake({self.url: resp(301, {'Location': self.good}, '')}))
        self.assertEqual(r['status'], 'ok')

    def test_522_is_degraded_and_says_why(self):
        r = sh.check_www(fetcher=fake({self.url: resp(522, {}, '')}))
        self.assertEqual(r['status'], 'degraded')
        self.assertIn('522', r['note'])

    def test_redirect_that_drops_the_query_is_degraded(self):
        r = sh.check_www(fetcher=fake({self.url: resp(301, {'Location': sh.APEX + '/about/'}, '')}))
        self.assertEqual(r['status'], 'degraded')

    def test_temporary_redirect_is_degraded(self):
        r = sh.check_www(fetcher=fake({self.url: resp(302, {'Location': self.good}, '')}))
        self.assertEqual(r['status'], 'degraded')

    def test_www_serving_the_site_is_degraded(self):
        self.assertEqual(sh.check_www(fetcher=fake({self.url: resp(200)}))['status'], 'degraded')

    def test_timeout_is_degraded(self):
        self.assertEqual(sh.check_www(fetcher=fake({self.url: resp(None, error='timed out')}))['status'], 'degraded')


class ContactEndpointTests(unittest.TestCase):
    url = sh.APEX + '/api/contact'

    def test_405_with_allow_post_is_ok(self):
        r = sh.check_contact_endpoint(fake({('GET', self.url): resp(405, {'Allow': 'POST'}, '')}))
        self.assertEqual(r['status'], 'ok')

    def test_get_that_succeeds_is_a_failure(self):
        r = sh.check_contact_endpoint(fake({('GET', self.url): resp(200)}))
        self.assertEqual(r['status'], 'failed')

    def test_429_is_degraded(self):
        self.assertEqual(sh.check_contact_endpoint(fake({('GET', self.url): resp(429)}))['status'], 'degraded')

    def test_never_posts(self):
        seen = []

        def f(url, method="GET", follow=True, timeout=18):
            seen.append(method)
            return resp(405, {'Allow': 'POST'}, '')
        sh.check_contact_endpoint(f)
        self.assertEqual(set(seen), {'GET'})


class RunTests(unittest.TestCase):
    def healthy(self):
        table = {sh.APEX + p: resp() for p in sh.PAGES}
        table.update({sh.APEX + p: resp(body='x') for p in sh.FILES + sh.ASSETS})
        table[sh.WWW + '/about/?monitor=1'] = resp(301, {'Location': sh.APEX + '/about/?monitor=1'}, '')
        table[('GET', sh.APEX + '/api/contact')] = resp(405, {'Allow': 'POST'}, '')
        return table

    def test_all_healthy(self):
        results = sh.run_all(fake(self.healthy()))
        self.assertEqual(sh.overall(results), 'ok')
        self.assertEqual(len(results), len(sh.PAGES) + len(sh.FILES) + len(sh.ASSETS) + 2)

    def test_www_522_alone_is_degraded_so_the_job_stays_up_but_the_report_says_so(self):
        table = self.healthy()
        table[sh.WWW + '/about/?monitor=1'] = resp(522, {}, '')
        report = sh.build_report(sh.run_all(fake(table)))
        self.assertEqual(report['overall'], 'degraded')
        self.assertTrue(any(a.startswith('::warning') and 'www' in a for a in sh.github_annotations(report)))

    def test_homepage_down_is_failed(self):
        table = self.healthy()
        table[sh.APEX + '/'] = resp(500, {}, '')
        self.assertEqual(sh.overall(sh.run_all(fake(table))), 'failed')

    def test_main_writes_files_and_never_includes_form_data(self):
        with tempfile.TemporaryDirectory() as d:
            report = sh.main(out_dir=d, fetcher=fake(self.healthy()))
            self.assertEqual(report['overall'], 'ok')
            self.assertTrue((pathlib.Path(d) / 'health.json').exists())
            self.assertIn('No form data is sent', (pathlib.Path(d) / 'health.json').read_text())


if __name__ == '__main__':
    unittest.main()
