"""Hand-curated seed literals for the CC workbooks, each with provenance.

No markdown parsing: 03-competitors.md and 10-scorecard.md are prose, and a
parser would silently rot as the docs evolve. Every seed row below was typed
by reading the cited source file directly. verify_sources() below does a
best-effort staleness check by grepping for anchor substrings; it cannot
prove the data is still accurate, only that the source still contains text
resembling what was transcribed.

BUILD DATE for this seed set: 2026-10-18.
"""

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_DATE = "2026-10-18"

# ---------------------------------------------------------------------------
# Competitors — verbatim from docs/research/brand-exploration-2026-10-13/competitors.json
# Observed 2026-10-13. 14 companies total (not 15 -- the source file has 14).
# ---------------------------------------------------------------------------

_COMPETITORS_SOURCE = REPO_ROOT / "docs/research/brand-exploration-2026-10-13/competitors.json"


def load_competitors():
    data = json.loads(_COMPETITORS_SOURCE.read_text())
    assert len(data["companies"]) == 14, (
        f"Expected 14 competitors in {_COMPETITORS_SOURCE}, found {len(data['companies'])}. "
        "The source file changed -- update seed assumptions before building."
    )
    return data["observed_date"], data["method"], data["companies"]


# area -> best-guess town for the Directory tab's "Service Area" column.
# This is a display convenience over the same `area` field already in the JSON,
# not a new research claim.

# ---------------------------------------------------------------------------
# Lead enums — verbatim from schema.sql and migrations/0002_lead_operations.sql
# ---------------------------------------------------------------------------

LEAD_STATUSES = ["new", "contacted", "quoted", "booked", "lost"]  # schema.sql: leads.status
LEAD_STAGES = [  # migrations/0002_lead_operations.sql: lead_workflow.stage CHECK constraint
    "new", "contacted", "qualified", "consultation",
    "estimate_sent", "won", "lost", "not_a_fit",
]
NOTIFICATION_STATES = ["pending", "accepted", "failed", "unknown", "not_applicable"]

LEAD_SOURCES = ["Website form", "Phone", "Email", "Referral", "Partner", "Walk-in", "Other"]
PROJECT_TYPES = [
    "Custom Home", "Addition", "Kitchen Remodel", "Bathroom Remodel",
    "Whole-Home Renovation", "Deck / Outdoor Living", "Exterior / Siding / Roofing",
    "ADU", "Commercial", "Other",
]
BUDGET_BANDS = ["Under $25k", "$25k-$75k", "$75k-$150k", "$150k-$350k", "$350k-$750k", "Over $750k", "Unknown"]
LOSS_REASONS = ["Price", "Timeline mismatch", "Went with another contractor", "Project cancelled", "No response", "Out of service area", "Other"]
OUTCOMES = ["Won", "Lost", "Not a fit", "Pending"]
YES_NO = ["Yes", "No"]
YES_NO_UNKNOWN = ["Yes", "No", "Unknown"]

# ---------------------------------------------------------------------------
# Towns — verbatim from src/_data/towns.json
# ---------------------------------------------------------------------------

TOWNS = [
    {"slug": "belmont-ma", "name": "Belmont", "state": "MA", "county": "Middlesex", "region": "Greater Boston", "inServiceArea": False},
    {"slug": "carlisle-ma", "name": "Carlisle", "state": "MA", "county": "Middlesex", "region": "Greater Boston", "inServiceArea": False},
    {"slug": "dudley-ma", "name": "Dudley", "state": "MA", "county": "Worcester", "region": "Central Massachusetts", "inServiceArea": False},
    {"slug": "falmouth-ma", "name": "Falmouth", "state": "MA", "county": "Barnstable", "region": "Cape Cod", "inServiceArea": True},
    {"slug": "hingham-ma", "name": "Hingham", "state": "MA", "county": "Plymouth", "region": "South Shore", "inServiceArea": True},
    {"slug": "natick-ma", "name": "Natick", "state": "MA", "county": "Middlesex", "region": "Greater Boston", "inServiceArea": False},
    {"slug": "newton-ma", "name": "Newton", "state": "MA", "county": "Middlesex", "region": "Greater Boston", "inServiceArea": False},
    {"slug": "northampton-ma", "name": "Northampton", "state": "MA", "county": "Hampshire", "region": "Western Massachusetts", "inServiceArea": False},
    {"slug": "rockland-ma", "name": "Rockland", "state": "MA", "county": "Plymouth", "region": "South Shore", "inServiceArea": True},
]
TOWN_NAMES = [t["name"] for t in TOWNS]

# ---------------------------------------------------------------------------
# Portfolio projects — verbatim titles/locations/categories from src/_data/projects.json
# ---------------------------------------------------------------------------

PROJECTS = [
    {"title": "Custom Residence", "category": "Residential", "location": "Belmont, MA",
     "shows": "Exterior and site, living room, hallway, bath, and stair."},
    {"title": "Commercial Dispensary", "category": "Commercial", "location": "Dudley, MA",
     "shows": "Retail floor, lobby, and express pick-up."},
    {"title": "Residential Exterior", "category": "Residential", "location": "Falmouth, MA",
     "shows": "Front and side exteriors, entry walkway, deck, and gazebo."},
    {"title": "Custom Bath Suite", "category": "Residential", "location": "Newton, MA",
     "shows": "Soaking tub, double vanity, and glass shower enclosure."},
    {"title": "Modern Custom Residence", "category": "Residential", "location": "Carlisle, MA",
     "shows": "Exterior, skylit hallway, and kitchen."},
    {"title": "Lovell Dormitory", "category": "Commercial", "location": "Rockland, MA",
     "shows": "Front and rear elevations, cafe and dining commons, recreation room."},
    {"title": "CubeSmart Self Storage", "category": "Commercial", "location": "Hingham, MA",
     "shows": "Street-front exterior, storage corridors, and leasing office."},
]
assert len(PROJECTS) == 7

# ---------------------------------------------------------------------------
# Scorecard metric definitions — verbatim from docs/research/10-scorecard.md
# "Current Value" column reproduces that file's own stated value as of its
# last update; most are "Unknown" by the repo's own account.
# ---------------------------------------------------------------------------

SCORECARD_METRICS = [
    ("Organic discovery", "GSC clicks/impressions for specified property, search type and date",
     "Connected 2026-10-12. 90-day: 32 clicks / 1,594 impr. / 2.01% CTR / pos. 11.0",
     "docs/research/16-gsc-seo-baseline.md"),
    ("GBP discovery/actions", "Profile impressions and each action metric, separately", "Unknown", "docs/research/10-scorecard.md"),
    ("Web inquiries", "Unique legitimate accepted/stored web inquiries; exclude known tests/spam; notification delivery reported separately",
     "Unknown (2 D1 rows exist but both excluded: 1 historical, 1 flagged test)", "docs/research/10-scorecard.md"),
    ("All inquiries", "Deduplicated web, phone, email, partner and direct inquiries", "Unknown", "docs/research/10-scorecard.md"),
    ("Qualified leads", "Owner-approved service/geography/budget/timing fit; definition frozen per report", "Unknown", "docs/research/10-scorecard.md"),
    ("First response time", "First human response timestamp minus received timestamp; median, p90 and overdue count", "Unknown", "docs/research/10-scorecard.md"),
    ("Consultations / proposals", "Counts reaching stage; preserve stage dates and report cohort", "Unknown", "docs/research/10-scorecard.md"),
    ("Signed wins", "Signed contracts in period, with original inquiry cohort; repeat jobs count as contracts", "Unknown", "docs/research/10-scorecard.md"),
    ("New customers", "Unique first-time contracted customers, deduplicated privately; distinct from signed-job count", "Unknown", "docs/research/10-scorecard.md"),
    ("Notification exceptions", "Stored inquiries with unsuccessful email notification; human follow-up checked separately", "Unknown", "docs/research/10-scorecard.md"),
    ("Win rate", "Wins / decided opportunities (wins + losses), with pending separately; cohort version also reported", "Unknown", "docs/research/10-scorecard.md"),
    ("Qualified-lead close rate", "Eventual wins / qualified leads from mature inquiry cohort", "Unknown", "docs/research/10-scorecard.md"),
    ("Acquisition cost", "Attributed acquisition spend / new wins; distinguish media-only from fully loaded", "Unknown", "docs/research/10-scorecard.md"),
    ("Booked value", "Signed scope value; separate changes and cancellations", "Unknown", "docs/research/10-scorecard.md"),
    ("Contribution", "Revenue basis defined by owner minus consistently defined direct/variable job costs", "Unknown", "docs/research/10-scorecard.md"),
    ("Cash collected", "Accounting-reconciled receipts, not quote/contract value", "Unknown", "docs/research/10-scorecard.md"),
    ("Backlog/capacity", "Committed work and available starts/supervision by period", "Unknown", "docs/research/10-scorecard.md"),
    ("Delivery quality", "Schedule exceptions, rework, open punch items and client feedback", "Unknown", "docs/research/10-scorecard.md"),
]
assert len(SCORECARD_METRICS) == 18

# ---------------------------------------------------------------------------
# GSC baselines — BOTH documented figures, preserved as conflicting, labelled
# rows. 10-scorecard.md:17 and 16-gsc-seo-baseline.md:50 disagree about the
# direction of the clicks delta for the same date. Do not reconcile.
# ---------------------------------------------------------------------------

SEARCH_BASELINE_ROWS = [
    # (window, date_range, clicks, impressions, ctr, avg_position, source_file, line, date_observed, reconciliation_status)
    ("90-day", "2026-07-12 to 2026-10-09", 32, 1594, 0.0201, 10.99,
     "docs/research/16-gsc-seo-baseline.md", "~80", "2026-10-12", "reconciled (single source)"),
    ("28-day", "2026-09-12 to 2026-10-09", 9, 405, 0.0222, 7.10,
     "docs/research/16-gsc-seo-baseline.md", "~79", "2026-10-12", "reconciled (single source)"),
    ("28-day, as of 2026-10-13 (version A)", "ending 2026-10-13", 8, 383, 0.0209, 7.0,
     "docs/research/10-scorecard.md", "17", "2026-10-13",
     "UNRECONCILED -- conflicts with version B below; do not average or pick one, see ReadMe"),
    ("28-day, prior period (version A)", "28 days before version A above", 9, 527, 0.0171, 9.5,
     "docs/research/10-scorecard.md", "17", "2026-10-13",
     "UNRECONCILED -- conflicts with version B below"),
    ("28-day, as of 2026-10-13 (version B)", "ending 2026-10-13", 9, 398, None, None,
     "docs/research/16-gsc-seo-baseline.md", "50", "2026-10-13",
     "UNRECONCILED -- clicks delta direction (8->9) runs opposite to version A (9->8)"),
    ("28-day, prior period (version B)", "28 days before version B above", 8, 534, None, None,
     "docs/research/16-gsc-seo-baseline.md", "50", "2026-10-13",
     "UNRECONCILED -- position improved 10.7 -> 6.9 and CTR 1.50% -> 2.26% per this source"),
]

# Live pull, fetched this session via the connected GSC MCP tool (not a
# documented historical figure -- this is a fresh, separately-dated reading).
SEARCH_BASELINE_LIVE = {
    "window": "28-day (live pull)",
    "date_range": "2026-09-19 to 2026-10-16",
    "clicks": 15,
    "impressions": 418,
    "ctr": 0.036,
    "avg_position": 9.4,
    "source_file": "live GSC MCP connector",
    "line": "",
    "date_observed": "2026-10-18",
    "reconciliation_status": "live reading, not directly comparable to prior windows (different date range; site was in maintenance mode for part of this window)",
}

# ---------------------------------------------------------------------------
# GA4 — identity re-verified live via Admin API this session.
# Account 411958882 ("Collaborative Construction llc") has exactly one
# property: 558903217. G-13DBV8V3BE is NOT in this account; it is the
# owner's separate school-email property, confirmed superseded by owner
# decision 2026-10-13 and never to be treated as equivalent.
# ---------------------------------------------------------------------------

GA4_PROPERTY_ID = "558903217"
GA4_MEASUREMENT_ID = "G-PNS7LJP5QB"
GA4_STREAM_ID = "16124097872"
GA4_LEGACY_MEASUREMENT_ID = "G-13DBV8V3BE"  # owner's school account; never merge with the above

# ---------------------------------------------------------------------------
# Site status — production is in deliberate maintenance mode. Confirmed live
# this session: HTTP 503, "We're Making Some Improvements", retry-after 3600.
# ---------------------------------------------------------------------------

SITE_STATUS_ROWS = [
    ("Status", "Maintenance mode (HTTP 503, intentional)", "Live curl check, 2026-10-18"),
    ("Page shown", '"We\'re Making Some Improvements"', "Live curl check, 2026-10-18"),
    ("Retry-After header", "3600 seconds", "Live curl check, 2026-10-18"),
    ("Worker version", "e93485d0-6bd4-4c70-8745-98225614a7dc", "docs/releases/2026-10-14-maintenance-name-centering.md"),
    ("Branch", "ops/maintenance-mode", "docs/releases/2026-10-14-maintenance-name-centering.md"),
    ("Impact on this dashboard", "GA4 sessions/events and GSC impressions in this window reflect a site in maintenance, not marketing performance. Do not read traffic drops in this period as a channel or content problem.", "Analysis for this workbook"),
]

# ---------------------------------------------------------------------------
# Growth plan work items — verbatim IDs/descriptions from docs/research/08-growth-plan.md
# ---------------------------------------------------------------------------

GROWTH_ITEMS = [
    # (id, phase, priority_owner, work_item, success_criteria)
    ("G01", "Phase 1 (Days 1-14)", "P0 / owner", "Confirm preferred jobs, towns, budget bands, available starts and supervision capacity", "Written decisions in company facts; no guessed financial targets"),
    ("G02", "Phase 1 (Days 1-14)", "P0 / owner + analyst", "Inventory GBP, GSC, GA4, Cloudflare and lead access", "Exact account/property identifiers privately recorded; first dated exports or documented blocker"),
    ("G03", "Phase 1 (Days 1-14)", "P0 / operations", "Establish a complete inquiry queue including calls and referrals", "Every new inquiry has owner, stage, next action and received/response time; failed email visible"),
    ("G04", "Phase 1 (Days 1-14)", "P1 / web agent", "Fix attribution through redirects and internal contact navigation", "Tests cover UTM redirects/navigation; privacy behavior reviewed; implementation separately reviewed before deployment"),
    ("G05", "Phase 1 (Days 1-14)", "P1 / owner + researcher", "Verify credentials, business address eligibility and portfolio roles", "Evidence recorded; approved publishable wording distinct from private records"),
    ("G06", "Phase 1 (Days 1-14)", "P1 / analyst", "First weekly scorecard", "Report distinguishes unavailable, zero, partial, and observed results; reconcile D1 and notifications"),
    ("G07", "Phase 2 (Days 15-30)", "P1 / owner + content", "Two approved residential case studies", "Actual scope/role, local relevance, photo release, specific process proof; owner approves facts"),
    ("G08", "Phase 2 (Days 15-30)", "P1 / web + content", "Improve the highest-priority service page and contact journey", "Clear scope, process, relevant proof and next step; mobile review and functional checks"),
    ("G09", "Phase 2 (Days 15-30)", "P1 / profile owner", "Complete GBP audit and proposed edits", "Before/after evidence, eligible address/categories, correct contact/hours; edits executed only under explicit account authorization"),
    ("G10", "Phase 2 (Days 15-30)", "P1 / sales", "Standard intake and follow-up process", "Pilot response target agreed by owner; follow-ups appear in private queue; no automatic messages without authorization"),
    ("G11", "Phase 2 (Days 15-30)", "P2 / researcher", "Ten suitable local partner cards and capabilities sheet draft", "Why each partner fits, source, owner of relationship, next proposed action; no unsolicited sending"),
    ("G12", "Phase 2 (Days 15-30)", "P2 / estimator", "Review available completed jobs and estimate variance", "Redacted service-level margin/capacity lessons; no fabricated average project value"),
    ("E01", "Phase 3 (Days 31-60)", "Content + analyst", "Local case-study proof on one service page", "Compare 28-day windows, relevant traffic and qualified inquiries; account for low sample and seasonality"),
    ("E02", "Phase 3 (Days 31-60)", "Sales + owner", "Defined response ownership and follow-up", "Compare response distribution and stage progression; aim for zero unassigned overdue inquiries"),
    ("E03", "Phase 3 (Days 31-60)", "Owner + researcher", "ADU feasibility offer with current official references", "Qualified consultations versus poor-fit demand, estimating time and capacity consumed"),
    ("E04", "Phase 3 (Days 31-60)", "Owner", "Approved partner outreach pilot", "Track actual conversations/referrals by partner; stop repeated outreach when declined"),
    ("E05", "Phase 3 (Days 31-60)", "Operations", "Milestone photo/decision capture on one active job", "Usable proof collected without disrupting delivery or disclosing client details"),
]

# ---------------------------------------------------------------------------
# Channel priority — evidence-ranked, from docs/research/14-phase2-execution-plan.md
# ---------------------------------------------------------------------------

CHANNEL_PRIORITY = [
    (1, "ADU content / local SEO", "Highest demand signal found: 2,084 statewide ADU approvals since 2025, active state regulation; content already drafted and locally verified", "Ready to deploy", "docs/research/14-phase2-execution-plan.md"),
    (2, "Google Business Profile optimization", "Unknown current demand (owner access pending), likely high ROI once access is granted; checklist prepared", "Blocked on owner access", "docs/research/14-phase2-execution-plan.md"),
    (3, "Case studies / referrals", "Highest trust value but gated on owner worksheet return (Falmouth exterior project, attribution unconfirmed)", "Blocked on owner input", "docs/research/14-phase2-execution-plan.md"),
    (4, "Paid ads", "Explicitly NOT ranked for spend until lead-response ownership and real capacity are known", "Deferred by design", "docs/research/14-phase2-execution-plan.md"),
]

# ---------------------------------------------------------------------------
# Budget plan — proposed, not quoted. Explicitly an editable input set.
# ---------------------------------------------------------------------------

BUDGET_PLAN_SEED = [
    ("Google Search Ads", 350, 3),
    ("Project photography / content", 100, 3),
    ("Local networking / referral materials", 100, 3),
    ("Experiment reserve", 50, 3),
]

EXTERNAL_BENCHMARKS = [
    ("Contractor avg. cost-per-lead (Google Search)", "$166",
     "LocaliQ published benchmark", "external benchmark, NOT Collaborative Construction data, unverified for the Falmouth/Cape Cod market", "external, unverified locally"),
]

# ---------------------------------------------------------------------------
# Subcontractor trades (new -- industry-standard list, not from the repo)
# ---------------------------------------------------------------------------

TRADES = [
    "Plumbing", "Electrical", "HVAC", "Framing", "Roofing", "Foundation / Concrete",
    "Excavation", "Finish Carpentry", "Cabinetry", "Tile", "Painting", "Landscaping",
    "Siding", "Windows / Doors", "Insulation", "Drywall", "Flooring", "Masonry",
    "Septic", "Surveying",
]

APPROVAL_STATUSES = ["Not Reviewed", "Under Review", "Approved", "Declined", "Inactive"]
LICENSE_TYPES = ["CSL (Construction Supervisor License)", "HIC (Home Improvement Contractor)", "Trade-specific MA license", "Not Required", "Unknown"]

SOURCING_LINKS = [
    ("Home Builders & Remodelers Association of Cape Cod", "https://members.capecodbuilders.org", "Searchable member directory by trade. A listing is a lead to verify, not an approval."),
    ("Massachusetts construction license verification", "https://madpl.mylicense.com/Verification/", "Official state license lookup. Verify, don't assume a prior check is still current."),
]

BUSINESS_FACTS = {
    "name": "Collaborative Construction, LLC",
    "phone": "(508) 440-6981",
    "address": "16 Terry Lou Ave, East Falmouth, MA 02536",
    "areaServed": ["Cape Cod, Massachusetts", "South Shore, Massachusetts"],
    "gbp_url": "https://www.google.com/maps?cid=10110650788670469074",
}


def verify_sources():
    """Best-effort staleness check: confirm anchor substrings still exist in
    the cited source files. Returns a list of warning strings (empty = clean).
    Cannot prove correctness, only that the sources haven't visibly moved.
    """
    warnings = []
    checks = [
        ("docs/research/10-scorecard.md", "Booked value is not earned revenue"),
        ("docs/research/10-scorecard.md", "Pipeline stage counts from different cohorts cannot be multiplied"),
        ("docs/research/16-gsc-seo-baseline.md", "position 10.7"),
        ("docs/research/19-ga4-connection-and-diagnosis.md", "G-PNS7LJP5QB"),
        ("migrations/0002_lead_operations.sql", "not_a_fit"),
        ("schema.sql", "booked"),
        ("src/_data/towns.json", "falmouth-ma"),
        ("src/_data/projects.json", "Lovell Dormitory"),
        ("docs/research/08-growth-plan.md", "G12"),
        ("docs/research/14-phase2-execution-plan.md", "2,084"),
    ]
    for relpath, anchor in checks:
        path = REPO_ROOT / relpath
        if not path.exists():
            warnings.append(f"MISSING SOURCE FILE: {relpath} (seed data citing it may be stale)")
            continue
        if anchor not in path.read_text(errors="ignore"):
            warnings.append(f"ANCHOR NOT FOUND: {relpath!r} no longer contains {anchor!r} -- re-verify the seed row(s) that cite it")
    try:
        load_competitors()
    except AssertionError as e:
        warnings.append(str(e))
    return warnings


if __name__ == "__main__":
    issues = verify_sources()
    if issues:
        print(f"{len(issues)} source-verification warning(s):")
        for w in issues:
            print(f" - {w}")
    else:
        print("All seed-data source anchors verified OK.")
