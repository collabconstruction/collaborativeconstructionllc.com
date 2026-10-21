# Cloudflare `www` Redirect Rule — applied 2026-10-21

Status: **Applied and verified live.** This closes the `www` 522 finding from the October 21 audit (`collaborative-hq` PR #7) and completes Change B from `docs/releases/2026-10-12-seo-redirect-release.md`, which was blocked at the time because the available API credential returned `401` on this write. This time the connection (Cloudflare MCP plugin) had write access, and the owner explicitly authorized this specific, narrowly scoped change in chat before anything was applied.

No DNS record, SSL/TLS setting, Turnstile config, WAF policy, Worker, secret, or customer data was touched. This was a single new Cloudflare Rulesets object (one Redirect Rule) at the zone level.

## Preflight (before changing anything)

Reverified against account `0fadcd0965374caa75a44c3aa9784042`, zone `5a7f4b95bbd85c1ec0931a6fdd3e1e6d` (`collaborativeconstructionllc.com`):

- **DNS**: `www.collaborativeconstructionllc.com` is a proxied `CNAME` to the apex (record `0a45318706e056634d9b5760e1b899c6`), unchanged since the audit.
- **Workers Custom Domains** (`GET /accounts/{id}/workers/domains`): only three hostnames bound — the apex (→ `collaborativeconstructionllc-com`), `tinkerloop.collaborativeconstructionllc.com` (→ `tinkerloopworker`), `admin-staging.collaborativeconstructionllc.com` (→ `collaborative-hq-admin-staging`). `www` is not, and was not, one of them.
- **Workers Routes** (`GET /zones/{id}/workers/routes`): empty.
- **Existing rulesets** (`GET /zones/{id}/rulesets`): only Cloudflare's four managed rulesets (Normalization, Managed Response Firewall Default, Managed Free Ruleset, DDoS L7). No custom WAF rule, cache rule, or redirect rule existed.
- **`http_request_dynamic_redirect` phase entry point** (`GET /zones/{id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`): `404 — could not find entrypoint ruleset`. Confirmed no redirect rule existed yet, so this was a **create**, not an update that risked clobbering another rule.
- Live `curl`: `www` returned `522`; apex returned `200`.

## Change applied

One API call, `POST /zones/5a7f4b95bbd85c1ec0931a6fdd3e1e6d/rulesets`, created a new zone-level ruleset in the `http_request_dynamic_redirect` phase with exactly one rule:

```json
{
  "name": "Redirect rules ruleset",
  "kind": "zone",
  "phase": "http_request_dynamic_redirect",
  "rules": [
    {
      "ref": "redirect_www_to_apex",
      "description": "301 redirect www.collaborativeconstructionllc.com to the apex, preserving path and query string",
      "expression": "http.host eq \"www.collaborativeconstructionllc.com\"",
      "action": "redirect",
      "action_parameters": {
        "from_value": {
          "target_url": { "expression": "concat(\"https://collaborativeconstructionllc.com\", http.request.uri.path)" },
          "status_code": 301,
          "preserve_query_string": true
        }
      }
    }
  ]
}
```

**Result:**
- Ruleset ID: `d7977d447080408da25ad377f1249d41`
- Rule ID: `008b4ff7e3cb4092811556e2e4f5a07a` (ref `redirect_www_to_apex`)
- Created: 2026-10-21T20:50:32.458351Z

The match expression (`http.host eq "www.collaborativeconstructionllc.com"`) is an exact-string match. It cannot match the apex, `tinkerloop.*`, `admin-staging.*`, or any other hostname — there is no wildcard and no subdomain-inclusive matching. The target (`https://collaborativeconstructionllc.com`, no `www`) never matches the rule's own expression, so there is no possibility of a redirect loop.

## Post-change verification (live `curl`, 2026-10-21 ~20:51–20:55 UTC)

**Before → after, root case:**
| | Before | After |
|---|---|---|
| `https://www.collaborativeconstructionllc.com/` | `522` | `301` → `https://collaborativeconstructionllc.com/`, then `200` |

**Path and query preserved:**
```
https://www.collaborativeconstructionllc.com/services/kitchens?x=1
  -> 301, Location: https://collaborativeconstructionllc.com/services/kitchens?x=1
```

**Other hostnames unaffected (not touched by this rule, confirmed live):**
| Hostname | Result |
|---|---|
| Apex `collaborativeconstructionllc.com` | `200`, unchanged |
| `admin-staging.collaborativeconstructionllc.com` | `302` (its own pre-existing Access/auth redirect — unrelated, this hostname never matches the new rule's expression since it isn't `www...`) |
| `tinkerloop.collaborativeconstructionllc.com` | `200`, unchanged |

**Regression pass, every real page from the live sitemap, via `www` (following the new redirect) and directly on the apex (sanity control):**
| Path | via `www` (final) | apex direct |
|---|---|---|
| `/` | 200 | 200 |
| `/about/` | 200 | 200 |
| `/gallery/` | 200 | 200 |
| `/construction-advisory/` | 200 | 200 |
| `/home-renovation-cape-cod/` | 200 | 200 |
| `/adu-builder-cape-cod/` | 200 | 200 |
| `/general-contractor-falmouth-ma/` | 200 | 200 |
| `/home-additions-cape-cod/` | 200 | 200 |
| `/custom-home-builder-cape-cod/` | 200 | 200 |
| `/sitemap.xml` | 200 | 200 |
| `/robots.txt` | 200 | 200 |
| `/api/contact` (`GET`, no submission) | 405 (unchanged — expected, `POST`-only endpoint) | not retested, unaffected by routing |

No path returned a different status via `www` than it does directly on the apex, other than the intended one extra redirect hop. No test contact-form submission was made.

## An unrelated, transient anomaly observed and cleared

Immediately after creating the rule, one `GET /zones/{id}/rulesets` listing showed a second, unexpected entry in the `http_response_firewall_custom` phase (`kind: "managed"`, name containing `rulesets-pdx-production-...-pytest-...`) that was not created by this change. It could not be fetched by ID (`404`), was not present as that phase's entry point ruleset, and was absent from an immediate re-listing. Treated as transient noise on Cloudflare's side (most likely their own managed-ruleset infrastructure, which updates on its own schedule independent of anything in this zone — the three pre-existing managed rulesets also show recent independent `last_updated` timestamps). Re-confirmed the zone's ruleset list afterward: exactly the original four managed rulesets plus this one new redirect ruleset, nothing else.

## Rollback

Delete the ruleset (removes the single rule; does not affect DNS, the Worker, or anything else):

```sh
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/5a7f4b95bbd85c1ec0931a6fdd3e1e6d/rulesets/d7977d447080408da25ad377f1249d41" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```
or in the dashboard: Rules → Redirect Rules → the one rule named `redirect_www_to_apex` → delete. `www` would return to `522` afterward (back to the pre-change state), nothing else would change.

## Still open, from the original audit

- `www` is not in the Turnstile widget's allowed-domains list (`collaborativeconstructionllc.com` only). Low risk now that `www` redirects before reaching any page, but not yet fixed — separate change, not applied here, not authorized in this task.
- Minimum TLS version (`1.0`) and HSTS (disabled) remain as documented in the audit — separate changes, not touched by this task.

## Cross-references

`docs/releases/2026-10-12-seo-redirect-release.md` (Change B — the earlier blocked attempt at this same fix). `collaborative-hq` PR #7 (`docs/audits/2026-10-21-cloudflare-optimization-audit.md`) — the audit that identified and root-caused this issue.
