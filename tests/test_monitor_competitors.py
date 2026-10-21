import importlib.util
import pathlib
import unittest

src = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'monitor_competitors.py'
spec = importlib.util.spec_from_file_location('monitor_competitors', src)
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)


class CompetitorWatcherTests(unittest.TestCase):
    def test_extract_ignores_navigation_script_and_footer(self):
        html = '<html><head><title>Builder</title><meta name="description" content="Homes"></head><body><nav>Navigation</nav><main><h1>New Projects</h1><p>Residential additions</p><script>tracking()</script></main><footer>Copyright</footer></body></html>'
        result = monitor.extract(html)
        self.assertEqual(result['title'], 'Builder')
        self.assertEqual(result['description'], 'Homes')
        self.assertEqual(result['h1'], ['New Projects'])
        self.assertIn('Residential additions', result['preview'])
        self.assertNotIn('tracking', result['preview'])
        self.assertNotIn('Copyright', result['preview'])

    def test_diffs_are_not_business_claims(self):
        old = [{'name': 'Example', 'url': 'https://example.com/', 'ok': True,
                'title': 'Old', 'description': 'Homes', 'h1': ['Homes'], 'content_sha256': 'a'}]
        new = [{'name': 'Example', 'url': 'https://example.com/', 'ok': True,
                'title': 'New', 'description': 'Homes', 'h1': ['Homes'], 'content_sha256': 'b'}]
        changes = monitor.compare(new, old)
        self.assertEqual(new[0]['comparison'], 'changed')
        self.assertEqual(changes[0]['fields'], ['title', 'content_sha256'])

    def test_new_website_means_baseline_not_new_company(self):
        new = [{'name': 'Builder', 'url': 'https://example.org/', 'ok': True}]
        self.assertEqual(monitor.compare(new, []), [])
        self.assertEqual(new[0]['comparison'], 'baseline')


if __name__ == '__main__':
    unittest.main()
