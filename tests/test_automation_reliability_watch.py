"""Offline behavior tests for the GitHub Actions reliability watchdog."""
import datetime as dt
import unittest
from unittest.mock import patch

from scripts import automation_reliability_watch as watch


def stamp(value):
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def target():
    return {
        "name": "Falmouth Contractor Watch",
        "file": "falmouth-competitor-watch.yml",
        "hours": (8,), "minute": 13, "weekdays": (0,),
        "timezone": "America/New_York",
        "grace_minutes": 240, "artifact_prefix": "competitor-watch-",
    }


def scheduled_run(run_id=42, created="2026-10-26T12:20:00Z",
                  updated="2026-10-26T12:30:00Z",
                  conclusion="success", status="completed"):
    return {
        "id": run_id, "event": "schedule",
        "created_at": created, "updated_at": updated,
        "status": status, "conclusion": conclusion,
        "html_url": "https://github.com/example/repo/actions/runs/42",
    }


class ReliabilityScheduleTests(unittest.TestCase):
    def test_latest_due_honors_eastern_daylight_saving(self):
        due = watch.latest_due(stamp("2026-10-26T14:00:00Z"), target())
        self.assertEqual(due, stamp("2026-10-26T12:13:00Z"))

    def test_latest_due_honors_standard_time(self):
        due = watch.latest_due(stamp("2026-11-02T15:00:00Z"), target())
        self.assertEqual(due, stamp("2026-11-02T13:13:00Z"))

    def test_push_cannot_satisfy_scheduled_slot(self):
        due = stamp("2026-10-26T12:13:00Z")
        manual = dict(scheduled_run(), event="push")
        self.assertIsNone(watch.run_for_slot([manual], due))

    def test_prior_week_schedule_cannot_satisfy_current_slot(self):
        due = stamp("2026-10-26T12:13:00Z")
        old = scheduled_run(created="2026-10-19T12:20:00Z")
        self.assertIsNone(watch.run_for_slot([old], due))

    def test_success_requires_matching_named_artifact(self):
        now = stamp("2026-10-26T15:00:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-21T00:00:00Z"),
            {"state": "active"}, [scheduled_run()],
            [{"name": "competitor-watch-42", "expired": False}],
        )
        self.assertEqual(item["status"], "ok")

    def test_missing_artifact_after_grace_is_critical(self):
        now = stamp("2026-10-26T15:00:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-21T00:00:00Z"),
            {"state": "active"}, [scheduled_run()], [],
        )
        self.assertEqual(item["status"], "critical")

    def test_missing_artifact_just_after_run_is_pending(self):
        now = stamp("2026-10-26T12:38:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-21T00:00:00Z"),
            {"state": "active"}, [scheduled_run()], [],
        )
        self.assertEqual(item["status"], "pending")

    def test_no_scheduled_run_within_grace_is_pending(self):
        now = stamp("2026-10-26T14:00:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-21T00:00:00Z"),
            {"state": "active"}, [], [],
        )
        self.assertEqual(item["status"], "pending")

    def test_no_scheduled_run_after_grace_is_critical(self):
        now = stamp("2026-10-26T18:00:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-21T00:00:00Z"),
            {"state": "active"}, [], [],
        )
        self.assertEqual(item["status"], "critical")

    def test_first_activation_never_retroactively_claims_missed_run(self):
        now = stamp("2026-10-26T14:00:00Z")
        item = watch.check_scheduled(
            target(), now, stamp("2026-10-26T13:00:00Z"),
            {"state": "active"}, [], [],
        )
        self.assertEqual(item["status"], "pending")

    def test_disabled_workflow_is_critical(self):
        item = watch.check_scheduled(
            target(), stamp("2026-10-26T15:00:00Z"),
            stamp("2026-10-21T00:00:00Z"), {"state": "disabled_manually"}, [], [],
        )
        self.assertEqual(item["status"], "critical")

    def test_scheduled_failure_is_critical(self):
        item = watch.check_scheduled(
            target(), stamp("2026-10-26T15:00:00Z"),
            stamp("2026-10-21T00:00:00Z"), {"state": "active"},
            [scheduled_run(conclusion="failure")], [],
        )
        self.assertEqual(item["status"], "critical")

    def test_on_demand_workflow_need_not_run_daily(self):
        item = watch.check_manual(
            {"state": "active"}, [],
            {"name": "Release Check", "file": "release-check.yml"},
            stamp("2026-10-26T15:00:00Z"),
        )
        self.assertEqual(item["status"], "info")

    def test_scheduled_fails_closed_on_missing_artifact_access(self):
        item = watch.check_scheduled(
            target(), stamp("2026-10-26T15:00:00Z"),
            stamp("2026-10-21T00:00:00Z"), {"state": "active"},
            [scheduled_run()], None,
        )
        self.assertEqual(item["status"], "unknown")


if __name__ == "__main__":
    unittest.main()
