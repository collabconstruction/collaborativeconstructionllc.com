import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGithubDeployApproval } from "../scripts/lib/production-approval.mjs";

const repo = "collabconstruction/collaborativeconstructionllc.com";
const sha = "a".repeat(40);
const validEnv = {
  GITHUB_ACTIONS: "true",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_WORKFLOW_REF: `${repo}/.github/workflows/approved-production-deploy.yml@refs/heads/main`,
  GITHUB_REPOSITORY: repo,
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
  CI_DEPLOY_APPROVAL_SHA: sha,
  GITHUB_RUN_ATTEMPT: "1",
};
const validate = (over = {}, head = sha) => validateGithubDeployApproval({
  env: { ...validEnv, ...over }, commit: head, expectedRepo: repo,
});

test("only the dedicated exact-SHA manually dispatched GitHub workflow can skip a local TTY", () => {
  assert.equal(validate().ok, true);
});

test("every CI identity, dispatch, SHA and rerun guard fails closed", () => {
  for (const [key, value] of [
    ["GITHUB_ACTIONS", "false"],
    ["GITHUB_EVENT_NAME", "push"],
    ["GITHUB_WORKFLOW_REF", `${repo}/.github/workflows/release-check.yml@refs/heads/main`],
    ["GITHUB_REPOSITORY", "other/repo"],
    ["GITHUB_REF", "refs/heads/feature"],
    ["GITHUB_SHA", "b".repeat(40)],
    ["CI_DEPLOY_APPROVAL_SHA", "b".repeat(40)],
    ["CI_DEPLOY_APPROVAL_SHA", ""],
    ["GITHUB_RUN_ATTEMPT", "2"],
  ]) assert.equal(validate({ [key]: value }).ok, false, key);
  assert.equal(validate({}, "c".repeat(40)).ok, false, "HEAD mismatch");
  assert.equal(validate({ GITHUB_SHA: "not-a-sha", CI_DEPLOY_APPROVAL_SHA: "not-a-sha" }, "not-a-sha").ok, false, "invalid SHA");
});
