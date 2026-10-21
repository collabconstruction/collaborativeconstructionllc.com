# Accounts & integrations — Collaborative Construction LLC

**Security rule (binding on every future edit of this file): never store actual passwords, API tokens, OAuth client secrets, or refresh tokens in this document. Record their location and permission scope only.** This file exists to answer "where does this credential live and what can it do," never "what is the credential."

Everything below was either directly inspected this session (git, `wrangler` config, Gmail connector identity, Drive file/permission metadata) or carried over from the owner's own account notes where I had no tool-based way to verify it independently. Items in the second category are marked **unverified, per owner**. Where the evidence I could gather has a real limit — see Section 6 on Drive — that limit is stated explicitly rather than rounded up to "verified."

## 1. Cloudflare

- **Account:** `Wesleighb@gmail.com`.
- **Worker:** `collaborativeconstructionllc-com`, serving `collaborativeconstructionllc.com` and `collaborativeconstructionllc-com.wesleighb.workers.dev`.
- **Services in use:** Workers (the site itself), DNS, D1 (`cc-leads`), R2 (`cc-lead-attachments`), Turnstile (bot-check on the contact form), Email Routing/Sending (`SEND_EMAIL` binding), Web Analytics (automatic edge injection, not a template tag — see `src/_data/analytics.json`'s `_cloudflareAlreadyOnComment`), Security/WAF.
- **Local credential:** not a classic dashboard-issued static API token. Local `wrangler` is authenticated via its own OAuth session at `~/.wrangler/config/default.toml` (file mode `600`, i.e. owner-read-only). That file's non-secret fields were inspected directly this session:
  - `expiration_time = "2026-10-14T01:48:17.575Z"` — the access token is short-lived and auto-refreshes via the stored refresh token; this is not a long-lived static key.
  - `scopes`: `user:read, offline_access, account:read, workers:write, workers_kv:write, workers_routes:write, workers_scripts:write, workers_tail:read, d1:write, pages:write, zone:read, ssl_certs:write, ai:write, ai-search:write, ai-search:run, websearch.run, agent-memory:write, queues:write, pipelines:write, secrets_store:write, artifacts:write, flagship:write, containers:write, cloudchamber:write, connectivity:admin, email_routing:write, email_sending:write, browser:write`.
  - **Notably absent: any `dns_records:read` or `dns_records:write` scope.** This directly confirms the draft's own note that DNS records were inaccessible with the existing token — it's not a UI bug or permission glitch, the OAuth grant simply never included DNS. Security settings (WAF rules, firewall) are also not covered by any scope in this list.
  - The actual `oauth_token` / `refresh_token` / `api_token` values exist in that same file and were deliberately excluded from inspection, consistent with the security rule above.
- **To extend Cloudflare access** (DNS reads, security/WAF settings): the owner would need to either re-run `wrangler login` with a broader scope grant, or issue a separate dashboard API token scoped explicitly to `Zone:DNS:Read` / `Zone:Firewall Services:Read` and hand it to the agent session as an environment variable — never pasted into a file in this repo.

## 2. Google Analytics 4

- **Account:** `collaborativeconstructiongc@gmail.com` (company-owned).
- **Property:** `558903217` ("Collaborative Construction LLC").
- **Stream:** `16124097872`, stream URL `https://collaborativeconstructionllc.com`.
- **Measurement ID:** `G-PNS7LJP5QB`.
- **Status as of 2026-10-14 (updated from the draft, which predates this):** this is no longer "needs final confirmation" — it is **deployed to production**. Worker version `2df7f1c9-d140-45cb-91d3-1ef65f78f42e`, deployed `2026-10-14T01:42:33Z`. All 9 canonical pages serve `G-PNS7LJP5QB` live; `G-13DBV8V3BE` (the prior, school-email-associated stream) appears nowhere in production. Consent gating, tag initialization, and correct destination ID were verified in a real Chrome browser against the live site. Full detail: `docs/releases/2026-10-14-ga4-measurement-id-activation.md` and `docs/research/19-ga4-connection-and-diagnosis.md`.
- **One honest open item carried forward:** end-to-end delivery into GA4 Realtime was **not** independently confirmed by tooling in this session (no `/g/collect` beacon captured, two `runRealtimeReport` calls returned zero active users). This is most likely Realtime propagation lag or a browser-extension artifact, but it is not proven. The owner is best positioned to resolve it directly: sign in to the GA4 console as `collaborativeconstructiongc@gmail.com`, open Realtime for property `558903217`, visit the live site in a plain browser window, and accept the consent banner.
- **GA4 Data API access:** working, used this session via `gcloud auth application-default print-access-token` against the same `collaborativeconstructiongc@gmail.com`-authorized credentials set up for Search Console (see below) — no separate OAuth client needed.

## 3. Google Search Console

- **Primary account:** `collaborativeconstructiongc@gmail.com` — Full/Owner permission on `sc-domain:collaborativeconstructionllc.com`.
- **Additional verified owners on the property:** `EthanBehn@gmail.com`, `mbehn@mail.endicott.edu`, `marcusbehn10@gmail.com`.
- **OAuth scope used by the connector:** `webmasters.readonly` — read-only by design; this agent cannot submit sitemaps, request indexing, or remove owners through this credential.
- **Local credential location:** `~/.cc-private/gsc/` (outside this repo, outside version control).
- **Backing Google Cloud project:** `collaborative-construction-ai` (see next section).

## 4. Google Cloud Console

- **Project:** `collaborative-construction-ai`, project number `497707730594`.
- **APIs enabled:** Search Console API, Google Analytics Data API, Google Analytics Admin API.
- **OAuth client type:** Desktop app client (appropriate for a locally-run CLI/agent flow, not a web-redirect flow).
- **Credential storage:** local to the machine, outside this repository — not committed, not in `~/.cc-private` either; kept wherever the `gcloud`/Google API client libraries store their own application-default credential cache.

## 5. Gmail

- **Company email:** `collaborativeconstructiongc@gmail.com`. Website contact-form integration is confirmed working — a real production inquiry has been received through it.
- **Claude Code Gmail connector identity — verified this session, no longer "pending":** queried `search_threads` (`in:sent`) and inspected the returned thread. The Gmail API's `threads`/`messages` endpoints are inherently scoped to the authenticated mailbox itself (`userId=me`) — there is no way to list or read "Sent" items belonging to a mailbox other than the one the connector is authenticated as. The sent message's sender is `collaborativeconstructiongc@gmail.com`, and the Gmail web `viewUrl` Google returns is explicitly scoped `authuser=collaborativeconstructiongc@gmail.com`. Because the API call itself is mailbox-scoped (not a shared/delegated-access result), this is direct evidence of connector identity, not just resource ownership. **The connector is authenticated as the company account**, not `marcusbehn10@gmail.com`. The draft's concern about a prior mismatch does not describe the connector's current state.
- **Permission posture:** read-only by standing instruction — this agent will not send, forward, archive, or change messages without separate explicit approval in chat, consistent with the repo's general approval rules for customer communication.

## 6. Google Drive

- **Intended company account:** `collaborativeconstructiongc@gmail.com`.
- **Claude Code Drive connector identity — partially checked this session, with a real limitation; do not overstate this as "verified":**
  - `list_recent_files` returned 5 files; every one has `"owner": "collaborativeconstructiongc@gmail.com"`.
  - `get_file_permissions` on one of those files returned two grantees: `collaborativeconstructiongc@gmail.com` (`role: owner`) and `EthanBehn@gmail.com` (`role: writer`) — no self-referential "me" flag was present in the response.
  - **This is weaker evidence than the Gmail check above, and the distinction matters.** Unlike Gmail's mailbox-scoped API, Drive's `files.list`/"recent files" endpoint returns files the *authenticated identity has access to and has recently interacted with* — it does not require that identity to be the owner. If the connector were instead authenticated as, say, `EthanBehn@gmail.com` or another account with shared/writer access to this same company Drive content, `list_recent_files` could plausibly return an identical result set, because the files themselves are still owned by `collaborativeconstructiongc@gmail.com` regardless of who is asking.
  - No "whoami"/`about`-style tool is exposed by this Drive MCP connector (checked via `ToolSearch`: the available tool set is `copy_file`, `create_file`, `download_file_content`, `get_file_metadata`, `get_file_permissions`, `list_recent_files`, `read_file_content`, `search_files`, `share_file`, `trash_file`, `update_file` — none of which surface the authenticated principal's own identity).
  - **Net conclusion, stated honestly:** the files this connector can see are owned by the company account, which is consistent with (but does not prove) the connector itself being authenticated as `collaborativeconstructiongc@gmail.com`. Direct confirmation would require either the owner checking the Drive connector's linked account directly in Claude's own connector/integrations settings UI, or a future Drive MCP update that exposes an identity/`about` call.
- **Still open:** no dedicated "knowledge folder" has been confirmed to exist yet for this agent to treat as a canonical shared reference location. Access remains read-only by standing instruction until the owner asks otherwise.

## 7. Google Business Profile

- **Intended management account:** `collaborativeconstructiongc@gmail.com` — **unverified, per owner; not independently checked this session** (no GBP-capable tool/connector was available to inspect this directly).
- **Status:** the business listing has been identified, but company-account management access and API access are both not yet confirmed.
- **Standing warning, repeated here on purpose: do not create a duplicate business listing under any circumstance.** If management access cannot be confirmed, the correct next step is requesting/accepting a transfer or manager invite on the existing listing — never creating a new one.

## 8. GitHub

- **Remote (verified this session via `git remote -v`):** `origin` → `https://github.com/collabconstruction/collaborativeconstructionllc.com.git` (fetch and push).
- **Branch state (verified this session via `git branch -vv` / `git ls-remote`):**
  - `main` (local) and `origin/main` are identical at `e2ba56b`.
  - `design/site-refresh-2026-10` — the branch carrying all current release work, including the GA4 production fix — **has no upstream and has never been pushed to `origin`** (`git rev-parse ...@{upstream}` → `fatal: no upstream configured`; confirmed absent from `git ls-remote --heads origin`). Every production deploy from this branch so far has been built from an isolated local cherry-pick/worktree, not a merge or push.
  - `codex/phase1-recovery` exists locally as a linked worktree (`/Users/marcusbehn/.codex/worktrees/intake-release/...`) — this is the backed-up production recovery code the draft refers to.
  - Other local branches present: `claude/romantic-vaughan-381ed4`, `feature/live-parity-and-features`, `phase1-release-prep`.
- **Standing rule (unchanged):** no pushing secrets or customer data. Production deployment and any merge into `main` require explicit owner approval — this session's GA4 deploy was done via an isolated worktree precisely so it could reach production without touching `main` or `origin` at all.

## 9. Claude Code / AI agent

- **Project path:** `~/Desktop/Software/Wesbite/CollaberativeConstructionWebsite`.
- **Default permission posture (standing, repo-wide):** read-only research by default. Separate explicit approval is required in chat for: publishing/public-facing changes, customer communication (sending, forwarding, archiving email), production deployments, and any spending.
- **Per-service status, consolidated from sections 1–8 above:**

  | Service | Connector/credential | Verified this session? |
  |---|---|---|
  | Cloudflare | `wrangler` OAuth session (`~/.wrangler/config/default.toml`) | Yes — scopes read, DNS gap confirmed |
  | GA4 Data API | Google API credentials under `collaborativeconstructiongc@gmail.com` | Yes — used live for Realtime checks |
  | Search Console | OAuth, `webmasters.readonly`, `~/.cc-private/gsc/` | Carried over, not re-verified this session |
  | Gmail | MCP connector | Yes — mailbox-scoped API confirms company account |
  | Drive | MCP connector | Partial — returned files are company-owned; connector identity itself not directly provable with available tools |
  | Google Business Profile | none yet | Not verified — no tool available |
  | GitHub | local git, no stored token inspected | Yes — remote/branch state confirmed |

## Connection checklist

- [x] Confirm Cloudflare token scope and DNS-access gap (done this session — DNS scope confirmed absent).
- [ ] Confirm GA4 tag is live and receiving data in Realtime/DebugView (tag confirmed live and correctly configured in production; Realtime receipt specifically still needs the owner's own direct check — see Section 2).
- [x] Verify Claude's Gmail connector uses the company account (confirmed `collaborativeconstructiongc@gmail.com`).
- [ ] Verify Claude's Drive connector uses the company account (partially checked — returned files are owned by `collaborativeconstructiongc@gmail.com`, but no available tool directly confirms the connector's own authenticated identity; see Section 6 for the limitation).
- [ ] Confirm Google Business Profile manager access under the company account.
- [ ] Complete Cloudflare read-only monitoring permissions (DNS read, WAF/security read) — current token lacks these scopes entirely.
- [x] Verify GitHub main-branch/release status (confirmed: `main` == `origin/main`; `design/site-refresh-2026-10` never pushed).
- [ ] Establish a unified weekly reporting cadence (GSC + GA4 + GBP + Gmail/D1) — not started; GA4 and GSC data access now both work, GBP does not yet.

## Rule for future agents

Inspect existing connections before creating accounts, APIs, OAuth clients, or new services. Reuse verified company infrastructure wherever possible. This document exists so that check can be a read, not a rediscovery — update it in place when a status above changes, rather than letting a second, conflicting account-status document accumulate elsewhere in `docs/`.

## Cross-references

- `docs/research/19-ga4-connection-and-diagnosis.md` — full GA4 connection and diagnosis history.
- `docs/releases/2026-10-14-ga4-measurement-id-activation.md` — the production deploy referenced in Section 2.
- `docs/research/06-data-access.md` — broader data-access notes (GSC/GA4), predates this file.
