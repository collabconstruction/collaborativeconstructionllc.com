import importlib.util
import pathlib
import unittest

src = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'cloudflare_ruleset_watch.py'
spec = importlib.util.spec_from_file_location('cloudflare_ruleset_watch', src)
crw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crw)

BASELINE = {
    "zone_id": "ZONE123",
    "managed_ruleset_ids": ["managed-a", "managed-b"],
    "zone_rulesets": [
        {
            "id": "zone-a",
            "name": "Redirect rules ruleset",
            "phase": "http_request_dynamic_redirect",
            "rules": [
                {"id": "rule-1", "ref": "redirect_www_to_apex", "action": "redirect",
                 "expression": 'http.host eq "www.example.com"', "enabled": True},
            ],
        }
    ],
}


def listing(entries):
    return {"success": True, "result": entries}


def detail(rules):
    return {"success": True, "result": {"rules": rules}}


def fake_getter(table):
    def g(path, token):
        return table[path]
    return g


class NoTokenTests(unittest.TestCase):
    def test_no_token_is_skipped_not_a_failure(self):
        r = crw.check(token=None, baseline=BASELINE)
        self.assertEqual(r["status"], "skipped")
        self.assertEqual(r["findings"], [])


class CleanStateTests(unittest.TestCase):
    def test_exact_match_is_ok(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail(BASELINE["zone_rulesets"][0]["rules"]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "ok")
        self.assertEqual(r["findings"], [])


class DriftTests(unittest.TestCase):
    def test_unexpected_zone_ruleset_is_an_alert(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "zone-mystery", "kind": "zone", "name": "Someone else's rule", "phase": "http_request_firewall_custom"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail(BASELINE["zone_rulesets"][0]["rules"]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "alert")
        kinds = {f["kind"] for f in r["findings"]}
        self.assertIn("unexpected_zone_ruleset", kinds)

    def test_unexpected_managed_ruleset_is_an_alert(self):
        """This is the exact shape of the transient anomaly observed on 2026-10-21:
        an unrecognized managed ruleset id appearing in the zone's ruleset list."""
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
                {"id": "managed-pytest-mystery", "kind": "managed", "name": "rulesets-pdx-production-pytest-x", "phase": "http_response_firewall_custom"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail(BASELINE["zone_rulesets"][0]["rules"]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "alert")
        kinds = {f["kind"] for f in r["findings"]}
        self.assertIn("unexpected_managed_ruleset", kinds)

    def test_missing_zone_ruleset_is_an_alert(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "alert")
        self.assertEqual(r["findings"][0]["kind"], "missing_zone_ruleset")

    def test_modified_zone_ruleset_rule_is_an_alert(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail([
                {"id": "rule-1", "ref": "redirect_www_to_apex", "action": "redirect",
                 "expression": 'http.host eq "www.example.com" or http.host eq "evil.example.com"', "enabled": True},
            ]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "alert")
        self.assertEqual(r["findings"][0]["kind"], "modified_zone_ruleset")

    def test_missing_managed_ruleset_is_degraded_not_alert(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail(BASELINE["zone_rulesets"][0]["rules"]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "degraded")
        self.assertEqual(r["findings"][0]["kind"], "missing_managed_ruleset")


class BaselineFileTests(unittest.TestCase):
    def test_real_baseline_file_loads_and_matches_the_live_schema(self):
        baseline = crw.load_baseline()
        self.assertTrue(baseline["zone_id"])
        self.assertTrue(baseline["zone_rulesets"])
        self.assertTrue(baseline["managed_ruleset_ids"])
        for r in baseline["zone_rulesets"]:
            self.assertIn("id", r)
            self.assertIn("rules", r)


if __name__ == "__main__":
    unittest.main()
