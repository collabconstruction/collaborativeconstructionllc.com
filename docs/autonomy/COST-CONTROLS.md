# Cost controls

Today: nothing calls a paid model. The health check and the Scout prototype are free and deterministic.

Before any paid model runs, the owner sets these. Until all are set, `workflow.Budget.allowed()` returns false.

1. Daily call cap and monthly call cap (a number of model calls).
2. A money cap per month at the provider, set in the provider's own billing page, so the limit holds even if code is wrong.
3. Maximum new issues per day and maximum draft pull requests per day (suggested start: 3 and 1).
4. One Builder task at a time.
5. Finite retries with waiting between them. Pause after 3 failures in a row.
6. An emergency stop: create a file named `autonomy.STOP`, or disable the workflow in GitHub. Either stops all runs.
7. A weekly line in the report with calls used and any charges the provider shows.

Which product can run unattended: a Claude Code or ChatGPT subscription conversation is not an always on service. Unattended runs need an API account billed by usage, with a key stored as a GitHub secret. Which provider and model is an owner choice. Recurring cost is calls per day times cost per call. The cost per call depends on the model and the size of the prompt, so no figure is given here. Measure it in a one week pilot with a low cap before raising it.
