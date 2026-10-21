"""Task states, who may move them, spend limits and the Builder simulator.

Everything is plain data and pure functions so it can be tested without a network.
Legal moves are enforced by code. Agents can propose, only the owner can approve, accept,
release or cancel. No function here merges, deploys, posts or spends.
"""
import json
import pathlib

STATES = ["discovered", "needs-evidence", "needs-owner", "approved-for-proposal", "implementing",
          "awaiting-review", "accepted", "released", "measuring", "closed", "blocked", "cancelled"]

TRANSITIONS = {
    "discovered": {"needs-evidence", "needs-owner", "cancelled"},
    "needs-evidence": {"discovered", "needs-owner", "cancelled"},
    "needs-owner": {"approved-for-proposal", "cancelled", "blocked"},
    "approved-for-proposal": {"implementing", "blocked", "cancelled"},
    "implementing": {"awaiting-review", "blocked"},
    "awaiting-review": {"accepted", "implementing", "cancelled"},
    "accepted": {"released", "blocked"},
    "released": {"measuring"},
    "measuring": {"closed"},
    "blocked": {"needs-owner", "cancelled"},
    "closed": set(),
    "cancelled": set(),
}
OWNER_ONLY_TARGETS = {"approved-for-proposal", "accepted", "released", "cancelled"}
AGENT_ACTORS = {"scout", "builder"}


class IllegalTransition(Exception):
    pass


def advance(task, to_state, actor):
    cur = task["state"]
    if to_state not in TRANSITIONS.get(cur, set()):
        raise IllegalTransition(f"{cur} -> {to_state} is not a legal move")
    if to_state in OWNER_ONLY_TARGETS and actor != "owner":
        raise IllegalTransition(f"only the owner can move a task to {to_state}")
    if actor in AGENT_ACTORS and to_state in {"released", "measuring", "closed"}:
        raise IllegalTransition("agents cannot release or close work")
    task = dict(task)
    task["state"] = to_state
    task.setdefault("history", []).append({"from": cur, "to": to_state, "by": actor})
    return task


# --- Builder simulator -------------------------------------------------------------------

DENIED_PATHS = ["wrangler.jsonc", "migrations/", ".github/workflows/", "schema.sql", "worker/"]


def path_allowed(path, allowed_prefixes):
    path = str(path).lstrip("./")
    if any(path == d or path.startswith(d) for d in DENIED_PATHS):
        return False
    return any(path.startswith(p) for p in allowed_prefixes)


def plan_change(task, proposed_files):
    """Dry run only. Returns what a draft pull request would contain, or why it is refused."""
    if task.get("state") != "approved-for-proposal" and task.get("state") != "implementing":
        return {"ok": False, "reason": "task is not approved by the owner"}
    if "agent:ready" not in task.get("labels", []):
        return {"ok": False, "reason": "task lacks the agent:ready label"}
    if task.get("flags"):
        return {"ok": False, "reason": "task text carries instruction-like content and needs a human read"}
    allowed = task.get("allowed_paths", [])
    refused = [p for p in proposed_files if not path_allowed(p, allowed)]
    if refused:
        return {"ok": False, "reason": "paths outside the task's allowed list or on the deny list", "paths": refused}
    return {"ok": True, "draft_pr": {"title": task["title"], "files": list(proposed_files), "draft": True,
                                     "auto_merge": False, "deploy": False,
                                     "checks": ["npm test", "npm run build", "node scripts/verify-release-build.mjs",
                                                "python3 -m unittest discover -s tests"]}}


# --- Cost and safety controls ------------------------------------------------------------

class Budget:
    """Counts model calls and failures. Nothing runs without a positive cap set by the owner."""

    def __init__(self, daily_calls=0, monthly_calls=0, max_failures=3, stop_file="autonomy.STOP"):
        self.daily_cap, self.monthly_cap, self.max_failures = daily_calls, monthly_calls, max_failures
        self.daily_used = self.monthly_used = self.failures = 0
        self.stop_file = pathlib.Path(stop_file)

    def allowed(self):
        if self.stop_file.exists():
            return False, "emergency stop file present"
        if self.daily_cap <= 0 or self.monthly_cap <= 0:
            return False, "no spending cap set by the owner"
        if self.failures >= self.max_failures:
            return False, "paused after repeated failures"
        if self.daily_used >= self.daily_cap:
            return False, "daily call cap reached"
        if self.monthly_used >= self.monthly_cap:
            return False, "monthly call cap reached"
        return True, "ok"

    def record(self, ok):
        self.daily_used += 1
        self.monthly_used += 1
        self.failures = 0 if ok else self.failures + 1


def load_tasks(path):
    return json.loads(pathlib.Path(path).read_text())
