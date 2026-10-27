/**
 * Additional authority checks for non-interactive deployments from the dedicated
 * owner-approved GitHub Actions dispatch. This never replaces release:prepare,
 * PR provenance, version/fingerprint checks, or the --confirm SHA check.
 */
export function validateGithubDeployApproval({ env, commit, expectedRepo }) {
  const requiredWorkflow = `${expectedRepo}/.github/workflows/approved-production-deploy.yml@refs/heads/main`;
  const checks = [
    [env.GITHUB_ACTIONS === "true", "not running inside GitHub Actions"],
    [env.GITHUB_EVENT_NAME === "workflow_dispatch", "not a manual workflow_dispatch event"],
    [env.GITHUB_WORKFLOW_REF === requiredWorkflow, "not the approved production workflow on main"],
    [env.GITHUB_REPOSITORY === expectedRepo, "wrong GitHub repository"],
    [env.GITHUB_REF === "refs/heads/main", "not running on main"],
    [env.GITHUB_SHA === commit, "checked-out commit differs from workflow dispatch SHA"],
    [env.CI_DEPLOY_APPROVAL_SHA === commit, "the approved commit SHA does not match current HEAD"],
    [env.GITHUB_RUN_ATTEMPT === "1", "reruns require a fresh manual workflow dispatch"],
    [/^[a-f0-9]{40}$/.test(commit), "invalid Git commit SHA"],
  ];
  const problem = checks.find(([pass]) => !pass);
  return problem ? { ok: false, why: problem[1] } : { ok: true, why: "manual GitHub Actions dispatch for exact current main commit" };
}
