# Evidence schema, `finding/1`

One JSON object per finding. Built and checked by `scripts/autonomy/evidence.py`.

| Field | Meaning |
|---|---|
| `schema` | Always `finding/1` |
| `finding_id` | First 20 hex characters of a SHA 256 of subject, claim and source. Same problem, same id |
| `observed_at_utc` | ISO time |
| `subject` | Short name, for example `www redirect` |
| `claim` | One sentence, cleaned and capped at 600 characters |
| `source_url` | Where it was seen. Required and must start with `http` when the label is `verified-source` |
| `source_type` | `site-response`, `github-run`, `official-page`, `competitor-page`, `owner-statement`, `other` |
| `label` | `verified-source`, `reported`, `estimate`, `owner-confirmation-needed` |
| `severity` | `P0` site down or contact form broken, `P1` public fault with a clear fix, `P2` worth fixing, `P3` note |
| `confidence` | `high`, `medium`, `low`, `unknown` |
| `owner` | Who must act: `owner` or `engineering` |
| `repro` | Up to 8 short steps |
| `recommended_test` | The test that would prove a fix |
| `needs_owner_approval` | True when an account or public claim is involved |
| `blocked_reason` | Why work cannot start, or null |
| `flags` | `instruction-like-text` when outside text tried to give orders |

Rules: unknown is written as `unknown`, never zero. Unreadable sources are reported as unreadable, not as nothing found. Labels follow the repository's evidence rules in `docs/research/00-INDEX.md`.
