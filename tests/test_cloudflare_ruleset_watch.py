import importlib.util
import json
import pathlib
import unittest

src = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'cloudflare_ruleset_watch.py'
spec = importlib.util.spec_from_file_location('cloudflare_ruleset_watch', src)
crw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crw)


def redirect_rule(expression='http.host eq "www.example.com"', status_code=301,
                   preserve_query_string=True, target_expression='concat("https://example.com", http.request.uri.path)',
                   enabled=True, rule_id="rule-1", ref="redirect_www_to_apex"):
    return {
        "id": rule_id,
        "ref": ref,
        "action": "redirect",
        "expression": expression,
        "enabled": enabled,
        "action_parameters": {
            "from_value": {
                "target_url": {"expression": target_expression},
                "status_code": status_code,
                "preserve_query_string": preserve_query_string,
            }
        },
    }


def baseline_with(rules):
    return {
        "zone_id": "ZONE123",
        "managed_ruleset_ids": ["managed-a", "managed-b"],
        "zone_rulesets": [
            {"id": "zone-a", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect", "kind": "zone", "rules": rules},
        ],
    }


BASELINE = baseline_with([redirect_rule()])


def listing(entries):
    return {"success": True, "result": entries}


def detail(rules):
    return {"success": True, "result": {"rules": rules}}


def live_listing_entries(extra=()):
    return [
        {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
        {"id": "managed-a", "kind": "managed", "name": "A"},
        {"id": "managed-b", "kind": "managed", "name": "B"},
        *extra,
    ]


def fake_getter(table):
    def g(path, token):
        if path not in table:
            raise AssertionError(f"unexpected path requested: {path}")
        return table[path]
    return g


def run(rules, baseline=None, extra_live=()):
    baseline = baseline or baseline_with([redirect_rule()])
    table = {
        "/zones/ZONE123/rulesets": listing(live_listing_entries(extra_live)),
        "/zones/ZONE123/rulesets/zone-a": detail(rules),
    }
    return crw.check(token="t", baseline=baseline, getter=fake_getter(table))


class ExitCodeTests(unittest.TestCase):
    def test_all_five_states_have_distinct_or_documented_exit_codes(self):
        self.assertEqual(crw.EXIT_CODES["ok"], 0)
        self.assertEqual(crw.EXIT_CODES["not_checked"], 0)
        self.assertEqual(crw.EXIT_CODES["degraded"], 1)
        self.assertEqual(crw.EXIT_CODES["drift_detected"], 2)
        self.assertEqual(crw.EXIT_CODES["error"], 3)


class NoCredentialTests(unittest.TestCase):
    def test_no_token_is_not_checked_not_a_failure(self):
        r = crw.check(token=None, baseline=BASELINE)
        self.assertEqual(r["status"], "not_checked")
        self.assertEqual(r["findings"], [])

    def test_empty_string_token_is_also_not_checked(self):
        r = crw.check(token="", baseline=BASELINE)
        self.assertEqual(r["status"], "not_checked")


class CredentialAndApiErrorTests(unittest.TestCase):
    def test_expired_or_invalid_credential_is_error_not_ok(self):
        table = {"/zones/ZONE123/rulesets": {"success": False, "_http_status": 401, "errors": [{"message": "Invalid API Token"}]}}
        r = crw.check(token="bad", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "error")
        self.assertIn("401", r["note"])

    def test_403_is_also_treated_as_a_credential_error(self):
        table = {"/zones/ZONE123/rulesets": {"success": False, "_http_status": 403, "errors": [{"message": "Forbidden"}]}}
        r = crw.check(token="scoped-wrong", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "error")

    def test_cloudflare_5xx_is_error_not_a_silent_pass(self):
        table = {"/zones/ZONE123/rulesets": {"success": False, "_http_status": 500, "errors": [{"message": "internal_error"}]}}
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "error")

    def test_unreadable_individual_ruleset_is_critical_not_silently_skipped(self):
        table = {
            "/zones/ZONE123/rulesets": listing(live_listing_entries()),
            "/zones/ZONE123/rulesets/zone-a": {"success": False, "errors": ["boom"]},
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "zone_ruleset_unreadable")
        self.assertEqual(r["findings"][0]["severity"], "critical")

    def test_malformed_json_from_getter_is_error_not_a_crash(self):
        def getter(path, token):
            raise json.JSONDecodeError("Expecting value", "not json", 0)
        r = crw.check(token="t", baseline=BASELINE, getter=getter)
        self.assertEqual(r["status"], "error")
        self.assertEqual(r["findings"], [])

    def test_connection_failure_is_error_not_a_crash(self):
        def getter(path, token):
            raise OSError("Name or service not known")
        r = crw.check(token="t", baseline=BASELINE, getter=getter)
        self.assertEqual(r["status"], "error")


class MissingBaselineDataTests(unittest.TestCase):
    def test_baseline_without_zone_id_is_error(self):
        r = crw.check(token="t", baseline={"zone_rulesets": [{}]})
        self.assertEqual(r["status"], "error")
        self.assertIn("baseline", r["note"].lower())

    def test_baseline_without_zone_rulesets_is_error(self):
        r = crw.check(token="t", baseline={"zone_id": "ZONE123"})
        self.assertEqual(r["status"], "error")

    def test_load_baseline_with_a_nonexistent_path_raises_and_is_caught_as_error(self):
        with self.assertRaises(FileNotFoundError):
            crw.load_baseline(pathlib.Path("/nonexistent/path/baseline.json"))

    def test_load_baseline_missing_file_raises_and_is_caught_as_error(self):
        def boom_baseline_loader():
            raise FileNotFoundError("no such file")
        # Exercise check()'s own try/except by making baseline resolution itself fail.
        original = crw.load_baseline
        crw.load_baseline = boom_baseline_loader
        try:
            r = crw.check(token="t", baseline=None, getter=lambda path, token: listing([]))
            self.assertEqual(r["status"], "error")
        finally:
            crw.load_baseline = original


class CleanStateTests(unittest.TestCase):
    def test_exact_match_is_ok(self):
        r = run([redirect_rule()])
        self.assertEqual(r["status"], "ok")
        self.assertEqual(r["findings"], [])


class RedirectFieldDriftTests(unittest.TestCase):
    """Task requirement: changing only the target, only preserve_query_string, or only the
    status code must each be caught as drift on its own."""

    def test_target_url_change_alone_is_detected(self):
        r = run([redirect_rule(target_expression='concat("https://evil.example.com", http.request.uri.path)')])
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "modified_zone_ruleset")

    def test_preserve_query_string_change_alone_is_detected(self):
        r = run([redirect_rule(preserve_query_string=False)])
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "modified_zone_ruleset")

    def test_status_code_change_alone_is_detected(self):
        r = run([redirect_rule(status_code=302)])
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "modified_zone_ruleset")

    def test_enabled_false_is_detected(self):
        r = run([redirect_rule(enabled=False)])
        self.assertEqual(r["status"], "drift_detected")

    def test_expression_change_is_detected(self):
        r = run([redirect_rule(expression='http.host eq "www.evil.com"')])
        self.assertEqual(r["status"], "drift_detected")

    def test_whitespace_only_expression_reformatting_is_not_drift(self):
        """Normalization requirement: cosmetic reformatting must not cause a false positive."""
        r = run([redirect_rule(expression='http.host   eq  "www.example.com"  ')])
        self.assertEqual(r["status"], "ok")

    def test_default_status_code_omitted_equals_301(self):
        rule = redirect_rule()
        del rule["action_parameters"]["from_value"]["status_code"]
        r = run([rule])
        self.assertEqual(r["status"], "ok")

    def test_default_preserve_query_string_omitted_equals_false(self):
        rule = redirect_rule(preserve_query_string=False)
        del rule["action_parameters"]["from_value"]["preserve_query_string"]
        baseline = baseline_with([redirect_rule(preserve_query_string=False)])
        r = run([rule], baseline=baseline)
        self.assertEqual(r["status"], "ok")


class RuleOrderingTests(unittest.TestCase):
    def test_two_rules_reordered_is_detected(self):
        rule_a = redirect_rule(rule_id="rule-a", ref="a", expression='http.host eq "a.example.com"')
        rule_b = redirect_rule(rule_id="rule-b", ref="b", expression='http.host eq "b.example.com"')
        baseline = baseline_with([rule_a, rule_b])
        r = run([rule_b, rule_a], baseline=baseline)
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "modified_zone_ruleset")

    def test_same_order_is_ok(self):
        rule_a = redirect_rule(rule_id="rule-a", ref="a", expression='http.host eq "a.example.com"')
        rule_b = redirect_rule(rule_id="rule-b", ref="b", expression='http.host eq "b.example.com"')
        baseline = baseline_with([rule_a, rule_b])
        r = run([rule_a, rule_b], baseline=baseline)
        self.assertEqual(r["status"], "ok")


class RulesetAndIdentityDriftTests(unittest.TestCase):
    def test_unexpected_zone_ruleset_is_critical(self):
        r = run([redirect_rule()], extra_live=[{"id": "zone-mystery", "kind": "zone", "name": "Someone else's rule", "phase": "http_request_firewall_custom"}])
        self.assertEqual(r["status"], "drift_detected")
        kinds = {f["kind"] for f in r["findings"]}
        self.assertIn("unexpected_zone_ruleset", kinds)

    def test_unexpected_managed_ruleset_is_review_only_not_drift_detected(self):
        """This is the exact shape of the transient anomaly observed on 2026-10-21: an
        unrecognized MANAGED ruleset id appearing. A zone-scoped API token cannot create a
        managed ruleset, so this is lower priority than a zone-kind surprise."""
        r = run([redirect_rule()], extra_live=[{"id": "managed-pytest-mystery", "kind": "managed", "name": "rulesets-pdx-production-pytest-x", "phase": "http_response_firewall_custom"}])
        self.assertEqual(r["status"], "degraded")
        self.assertEqual(r["findings"][0]["kind"], "unexpected_managed_ruleset")
        self.assertEqual(r["findings"][0]["severity"], "review")

    def test_missing_zone_ruleset_is_critical(self):
        table = {"/zones/ZONE123/rulesets": listing([
            {"id": "managed-a", "kind": "managed", "name": "A"},
            {"id": "managed-b", "kind": "managed", "name": "B"},
        ])}
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "drift_detected")
        self.assertEqual(r["findings"][0]["kind"], "missing_zone_ruleset")
        self.assertEqual(r["findings"][0]["severity"], "critical")

    def test_missing_managed_ruleset_is_review_only(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail([redirect_rule()]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "degraded")
        self.assertEqual(r["findings"][0]["kind"], "missing_managed_ruleset")
        self.assertEqual(r["findings"][0]["severity"], "review")

    def test_ruleset_moved_to_a_different_phase_is_critical(self):
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "Redirect rules ruleset", "phase": "http_request_firewall_custom"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail([redirect_rule()]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "drift_detected")
        kinds = {f["kind"] for f in r["findings"]}
        self.assertIn("modified_zone_ruleset_metadata", kinds)

    def test_ruleset_renamed_only_is_review_not_critical(self):
        """Normalization requirement: a cosmetic rename is irrelevant metadata, not a
        security-relevant change, so it must not be escalated to drift_detected."""
        table = {
            "/zones/ZONE123/rulesets": listing([
                {"id": "zone-a", "kind": "zone", "name": "My Renamed Ruleset", "phase": "http_request_dynamic_redirect"},
                {"id": "managed-a", "kind": "managed", "name": "A"},
                {"id": "managed-b", "kind": "managed", "name": "B"},
            ]),
            "/zones/ZONE123/rulesets/zone-a": detail([redirect_rule()]),
        }
        r = crw.check(token="t", baseline=BASELINE, getter=fake_getter(table))
        self.assertEqual(r["status"], "degraded")
        self.assertEqual(r["findings"][0]["kind"], "zone_ruleset_renamed")
        self.assertEqual(r["findings"][0]["severity"], "review")


class BaselineFileTests(unittest.TestCase):
    def test_real_baseline_file_loads_and_matches_the_live_schema(self):
        baseline = crw.load_baseline()
        self.assertTrue(baseline["zone_id"])
        self.assertTrue(baseline["zone_rulesets"])
        self.assertTrue(baseline["managed_ruleset_ids"])
        for r in baseline["zone_rulesets"]:
            self.assertIn("id", r)
            self.assertIn("phase", r)
            self.assertIn("rules", r)
            for rule in r["rules"]:
                self.assertIn("action_parameters", rule)


if __name__ == "__main__":
    unittest.main()
