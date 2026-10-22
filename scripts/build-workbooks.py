#!/usr/bin/env python3
"""Generate the four Collaborative Construction business workbooks.

    .venv-workbooks/bin/python scripts/build-workbooks.py [--only NAME] [--fresh]
                                                           [--strict] [--rows N]

Architecture (see /Users/marcusbehn/.claude/plans/can-you-look-into-greedy-hoare.md
for the full design rationale):

  - This script makes ZERO network calls. It reads committed JSON snapshots
    under docs/research/data/ for live-ish figures (GSC/GA4) and otherwise
    uses the hand-curated, source-cited literals in scripts/seed_data.py.
  - D1 lead data is never read here. It is PII; the owner enters aggregate
    counts by hand after running `node scripts/leads.mjs report`.
  - No Excel column letter is hand-typed anywhere in this file. Every
    formula is built through scripts/workbook_schema.py's ref() resolver.
  - Every tab is SEEDED (generator-owned, rewritten every run) or ENTRY
    (owner-owned; rewriting an existing workbook never touches these tabs
    unless every single cell matches -- see workbook_lib.safe_write).

Output: ~/Desktop/CC-Workbooks/*.xlsx
"""

import argparse
import sys
from pathlib import Path

from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import seed_data as seed
import workbook_lib as lib
from workbook_schema import (
    BUDGET_PLAN, CHANNEL_PRIORITY, CHECKLIST, DIRECTORY, LEAD_REGISTER,
    PROJECTS as PROJECTS_COLS, REVIEW_REQUESTS, RESEARCH_LOG, SCORECARD,
    SEARCH_BASELINE, SITE_STATUS, SOURCE_MANIFEST, SUBCONTRACTORS,
    VERIFICATION_LOG, WEBSITE_TEARDOWN, ref,
)

OUTPUT_DIR = Path.home() / "Desktop" / "CC-Workbooks"
BACKUP_DIR = Path.home() / "Desktop" / "CC-Workbooks-backups"


# ============================================================================
# 1. CC-Competitor-Research.xlsx
# ============================================================================

def build_competitor_research(path: Path, rows: int):
    wb = lib.new_workbook()
    observed_date, method, companies = seed.load_competitors()

    readme = wb.create_sheet("ReadMe")
    lib.write_readme(readme, "Collaborative Construction — Competitor Research", [
        ("What this is", [
            f"{len(companies)} local/regional competitors, observed {observed_date}.",
            f"Method: {method}",
            "Source: docs/research/brand-exploration-2026-10-13/competitors.json (repo research, not re-derived here).",
        ]),
        ("How to use it", [
            "Directory tab: grey columns (Company, Website, Service Area, Positioning) are seeded from repo research -- don't edit.",
            "Yellow columns are for you to fill in: Google Rating, Review Count, Date Checked, Services Offered, Price Tier, Serves Falmouth?, Priority, Notes.",
            "WebsiteTeardown tab: the full design/positioning notes behind each competitor. Reference only.",
            "ResearchLog tab: add a dated row whenever you notice a competitor change something (new page, new reviews, price shift, etc).",
        ]),
        ("Assumptions", [
            f"Exactly {len(companies)} companies are tracked -- the source research file has {len(companies)}, not more. Don't pad the list; add a new row with its own research when you find a new competitor.",
            "Ratings and review counts are NOT seeded. This repo has no verified rating data; filling them in is the most valuable thing you can do with this workbook.",
        ]),
        ("Capacity", [f"{rows} rows are pre-formatted on ResearchLog. A warning appears automatically if you fill past ~93% of them."]),
    ])

    dir_ws = wb.create_sheet("Directory")
    lib.mark_seeded_tab(dir_ws)  # mixed tab; grey as default, yellow entry columns override visually via fill below
    lib.style_header_row(dir_ws, DIRECTORY)
    lib.autosize(dir_ws, DIRECTORY)
    seeded_cols = {"Company", "Website", "Service Area", "Positioning"}
    for r, c in enumerate(companies, start=2):
        values = {"Company": c["company"], "Website": c["url"], "Service Area": c["area"], "Positioning": c["positioning"]}
        for i, header in enumerate(DIRECTORY, start=1):
            cell = dir_ws.cell(row=r, column=i)
            if header in values:
                cell.value = values[header]
                cell.font = lib.SEEDED_FONT
            else:
                cell.fill = lib.ENTRY_FILL
                cell.font = lib.BODY_FONT
            cell.border = lib.BORDER
    # Validation for the entry columns
    lists_ws = lib.add_list_sheet(wb)
    priority_rng = lib.write_list_column(lists_ws, "A", "Priority", ["High", "Watch", "Inspiration"])
    tier_rng = lib.write_list_column(lists_ws, "B", "Price Tier", ["Budget", "Mid-market", "Premium", "Unknown"])
    yn_rng = lib.write_list_column(lists_ws, "C", "Yes/No", seed.YES_NO)
    town_rng = lib.write_list_column(lists_ws, "D", "Towns", seed.TOWN_NAMES)
    priority_name = lib.define_name(wb, "PriorityList", f"={priority_rng}")
    tier_name = lib.define_name(wb, "PriceTierList", f"={tier_rng}")
    yn_name = lib.define_name(wb, "YesNoList", f"={yn_rng}")
    c_dir = ref(DIRECTORY)
    last = len(companies) + 1
    lib.apply_list_validation(dir_ws, f"{c_dir('Priority')}2:{c_dir('Priority')}{last}", priority_name)
    lib.apply_list_validation(dir_ws, f"{c_dir('Price Tier')}2:{c_dir('Price Tier')}{last}", tier_name)
    lib.apply_list_validation(dir_ws, f"{c_dir('Serves Falmouth?')}2:{c_dir('Serves Falmouth?')}{last}", yn_name)

    teardown = wb.create_sheet("WebsiteTeardown")
    lib.mark_seeded_tab(teardown)
    lib.style_header_row(teardown, WEBSITE_TEARDOWN)
    lib.autosize(teardown, WEBSITE_TEARDOWN, max_width=34)
    field_map = {"URL": "url", "Area": "area", "Positioning": "positioning", "Logo": "logo", "Colors": "colors",
                 "Typography": "typography", "Hero": "hero", "Navigation": "navigation", "Motion": "motion",
                 "CTA": "cta", "Trust Signals": "trust", "Exceptional": "exceptional", "Generic": "generic",
                 "Lesson For CC": "lesson", "Avoid": "avoid"}
    for r, c in enumerate(companies, start=2):
        for i, header in enumerate(WEBSITE_TEARDOWN, start=1):
            key = "company" if header == "Company" else field_map[header]
            cell = teardown.cell(row=r, column=i, value=c[key])
            cell.font = lib.SEEDED_FONT
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER

    log = wb.create_sheet("ResearchLog")
    lib.mark_entry_tab(log)
    example = {"Date": "2026-10-18", "Company": "exclude-example", "What Changed": "Example row -- delete or overwrite",
               "Where Seen": "Google search results", "Action For CC": "n/a", "Owner": "n/a"}
    lib.style_entry_tab(log, RESEARCH_LOG, rows=rows, example_row_values=example)

    wb.move_sheet("ReadMe", offset=-len(wb.sheetnames))
    wb.save(path)


# ============================================================================
# 2. CC-Lead-Pipeline.xlsx  (code-only, no customer PII)
# ============================================================================

def build_lead_pipeline(path: Path, rows: int):
    wb = lib.new_workbook()
    c = ref(LEAD_REGISTER)
    last = rows + 1  # last data row number (row 2 is first data row after a header at row 1, example lives at row 2 pushing data to row 3)

    readme = wb.create_sheet("ReadMe")
    lib.write_readme(readme, "Collaborative Construction — Lead Pipeline", [
        ("No customer data in this file", [
            "This workbook never contains customer names, emails, phone numbers or addresses.",
            "Every lead is identified only by a Lead Code (e.g. L-2026-001) that you choose when you create it.",
            "To look up who a Lead Code actually is, use the private Cloudflare database: node scripts/leads.mjs export --remote --out <private path outside this repo>.",
            "If this workbook and the database ever disagree, the database (D1 / lead_workflow.stage) is the source of truth -- this sheet is a thin ledger for planning and reporting, not a replacement for it.",
        ]),
        ("The 'Ever ...?' columns matter", [
            "Current Stage is a snapshot: a lead now at 'won' no longer shows that it once passed through 'qualified'.",
            "Ever Qualified? / Ever Consultation? / Ever Estimate Sent? record that history yourself, the first time a lead reaches that stage. Every rate on PipelineSummary reads these columns, never the current-stage column, for exactly this reason.",
        ]),
        ("Exclude From Reporting", [
            "Set to 'Yes' for known tests, spam, or duplicates. Every formula on PipelineSummary ignores excluded rows.",
            "The example row on this tab is pre-marked excluded -- leave it that way, or delete the row entirely.",
        ]),
        ("Two assumptions this workbook makes (the repo's own rules don't settle these)", [
            "'not_a_fit' is treated as a disqualification, not a loss -- it's excluded from the win-rate denominator (wins / (wins+losses)).",
            "Estimated Value, Booked Value, Contribution and Cash Collected are four different things and are never added together. Booked value is not revenue, profit, or cash in hand.",
        ]),
        ("Review-request policy (ReviewRequests tab)", [
            "Log a request for every completed job, not only the ones you expect to go well.",
            "Never offer an incentive for a review, never skip a request because you expect a bad one, never ask a customer to withhold negative feedback. Google's own policy prohibits all three.",
            "Public Review Exists? only records whether something was posted publicly -- it is not a satisfaction score.",
        ]),
        ("Capacity", [f"{rows} rows are pre-formatted with formulas and dropdowns on LeadRegister and ReviewRequests. A warning appears automatically past ~93% full."]),
    ])

    reg = wb.create_sheet("LeadRegister")
    lib.mark_entry_tab(reg)
    example = {
        "Lead Code": "exclude-example", "Received Date": "2026-01-01", "Source": "Website form",
        "Current Stage": "won", "Outcome": "Won", "Ever Qualified?": "Yes", "Ever Consultation?": "Yes",
        "Ever Estimate Sent?": "Yes", "Exclude From Reporting": "Yes", "Notes": "Example row -- shows expected format",
    }
    start_row = lib.style_entry_tab(reg, LEAD_REGISTER, rows=rows, example_row_values=example)

    # Lists + validation
    lists_ws = lib.add_list_sheet(wb)
    rngs = {}
    rngs["stage"] = lib.write_list_column(lists_ws, "A", "Stage", seed.LEAD_STAGES)
    rngs["source"] = lib.write_list_column(lists_ws, "B", "Source", seed.LEAD_SOURCES)
    rngs["project_type"] = lib.write_list_column(lists_ws, "C", "Project Type", seed.PROJECT_TYPES)
    rngs["town"] = lib.write_list_column(lists_ws, "D", "Town", seed.TOWN_NAMES)
    rngs["budget"] = lib.write_list_column(lists_ws, "E", "Budget Range", seed.BUDGET_BANDS)
    rngs["outcome"] = lib.write_list_column(lists_ws, "F", "Outcome", seed.OUTCOMES)
    rngs["loss_reason"] = lib.write_list_column(lists_ws, "G", "Loss Reason", seed.LOSS_REASONS)
    rngs["yn"] = lib.write_list_column(lists_ws, "H", "Yes/No", seed.YES_NO)
    names = {k: lib.define_name(wb, f"Lead_{k}", f"={v}") for k, v in rngs.items()}

    data_range = lambda header: f"{c(header)}{start_row}:{c(header)}{last + 1}"
    lib.apply_list_validation(reg, data_range("Current Stage"), names["stage"])
    lib.apply_list_validation(reg, data_range("Source"), names["source"])
    lib.apply_list_validation(reg, data_range("Project Type"), names["project_type"])
    lib.apply_list_validation(reg, data_range("Town"), names["town"])
    lib.apply_list_validation(reg, data_range("Budget Range"), names["budget"])
    lib.apply_list_validation(reg, data_range("Outcome"), names["outcome"])
    lib.apply_list_validation(reg, data_range("Loss Reason"), names["loss_reason"])
    for h in ("Ever Qualified?", "Ever Consultation?", "Ever Estimate Sent?", "Exclude From Reporting"):
        lib.apply_list_validation(reg, data_range(h), names["yn"])

    # Formulas: Hours To First Response, Days Overdue -- every data row including the example row's own row (2)
    for r in range(2, last + 2):
        reg[f"{c('Hours To First Response')}{r}"] = (
            f'=IF(OR({c("First Response At")}{r}="",{c("Received Date")}{r}=""),"",'
            f'ROUND(({c("First Response At")}{r}-{c("Received Date")}{r})*24,1))'
        )
        reg[f"{c('Days Overdue')}{r}"] = (
            f'=IF({c("Follow-Up Due")}{r}="","",'
            f'IF({c("Outcome")}{r}<>"",0,MAX(0,TODAY()-{c("Follow-Up Due")}{r})))'
        )

    rev = wb.create_sheet("ReviewRequests")
    lib.mark_entry_tab(rev)
    rev_example = {"Lead Code": "exclude-example", "Project Description": "Example row -- delete or overwrite",
                   "Public Review Exists?": "No"}
    rev_start = lib.style_entry_tab(rev, REVIEW_REQUESTS, rows=rows, example_row_values=rev_example)
    c_rev = ref(REVIEW_REQUESTS)
    rev_range = lambda header: f"{c_rev(header)}{rev_start}:{c_rev(header)}{rows + 2}"
    for h in ("Permission To Publish", "Public Review Exists?", "Reply Drafted", "Reply Posted", "Testimonial Approved For Site"):
        lib.apply_list_validation(rev, rev_range(h), names["yn"])

    # PipelineSummary
    summary = wb.create_sheet("PipelineSummary")
    lib.mark_seeded_tab(summary)  # seeded = formula structure; the formulas read owner-entered data live
    summary.sheet_view.showGridLines = False
    summary["A1"] = "Pipeline Summary"
    summary["A1"].font = lib.TITLE_FONT
    summary["A2"] = "All counts exclude rows marked Exclude From Reporting = Yes (including the example row)."
    summary["A2"].font = lib.BODY_FONT

    excl_range = f"LeadRegister!${c('Exclude From Reporting')}${start_row}:${c('Exclude From Reporting')}${last + 1}"
    stage_range = f"LeadRegister!${c('Current Stage')}${start_row}:${c('Current Stage')}${last + 1}"
    outcome_range = f"LeadRegister!${c('Outcome')}${start_row}:${c('Outcome')}${last + 1}"
    ever_q_range = f"LeadRegister!${c('Ever Qualified?')}${start_row}:${c('Ever Qualified?')}${last + 1}"
    ever_c_range = f"LeadRegister!${c('Ever Consultation?')}${start_row}:${c('Ever Consultation?')}${last + 1}"
    ever_e_range = f"LeadRegister!${c('Ever Estimate Sent?')}${start_row}:${c('Ever Estimate Sent?')}${last + 1}"

    row = 4
    summary.cell(row=row, column=1, value="Counts by current stage").font = lib.Font(name=lib.FONT_NAME, bold=True)
    row += 1
    summary.cell(row=row, column=1, value="Stage").font = lib.HEADER_FONT
    summary.cell(row=row, column=1).fill = lib.HEADER_FILL
    summary.cell(row=row, column=2, value="Count").font = lib.HEADER_FONT
    summary.cell(row=row, column=2).fill = lib.HEADER_FILL
    header_row = row
    row += 1
    first_stage_row = row
    for stage in seed.LEAD_STAGES:
        summary.cell(row=row, column=1, value=stage)
        summary.cell(row=row, column=2, value=(
            f'=COUNTIFS({stage_range},$A{row},{excl_range},"<>Yes")'
        ))
        row += 1
    total_leads_row = row
    summary.cell(row=row, column=1, value="Total (non-excluded)")
    summary.cell(row=row, column=1).font = lib.Font(name=lib.FONT_NAME, bold=True)
    summary.cell(row=row, column=2, value=f"=SUM(B{first_stage_row}:B{row - 1})")
    summary.cell(row=row, column=2).font = lib.Font(name=lib.FONT_NAME, bold=True)
    row += 2

    summary.cell(row=row, column=1, value="Win rate (Won / (Won + Lost), not_a_fit excluded from denominator)").font = lib.Font(name=lib.FONT_NAME, bold=True)
    row += 1
    wins_row = row
    summary.cell(row=row, column=1, value="Won")
    summary.cell(row=row, column=2, value=f'=COUNTIFS({outcome_range},"Won",{excl_range},"<>Yes")')
    row += 1
    losses_row = row
    summary.cell(row=row, column=1, value="Lost")
    summary.cell(row=row, column=2, value=f'=COUNTIFS({outcome_range},"Lost",{excl_range},"<>Yes")')
    row += 1
    winrate_row = row
    summary.cell(row=row, column=1, value="Win rate")
    summary.cell(row=row, column=2, value=(
        f'=IF((B{wins_row}+B{losses_row})=0,"not calculable",B{wins_row}/(B{wins_row}+B{losses_row}))'
    ))
    summary.cell(row=row, column=2).number_format = "0.0%"
    row += 2

    summary.cell(row=row, column=1, value="Ever-reached-stage rates (use these, never current-stage, for conversion rates)").font = lib.Font(name=lib.FONT_NAME, bold=True)
    row += 1
    for label, rng in (("Ever Qualified", ever_q_range), ("Ever Consultation", ever_c_range), ("Ever Estimate Sent", ever_e_range)):
        cnt_row = row
        summary.cell(row=row, column=1, value=f"{label} -- count")
        summary.cell(row=row, column=2, value=f'=COUNTIFS({rng},"Yes",{excl_range},"<>Yes")')
        row += 1
        summary.cell(row=row, column=1, value=f"{label} -- rate of total")
        summary.cell(row=row, column=2, value=(
            f'=IF(B{total_leads_row}=0,"not calculable",B{cnt_row}/B{total_leads_row})'
        ))
        summary.cell(row=row, column=2).number_format = "0.0%"
        row += 1
    summary.column_dimensions["A"].width = 46
    summary.column_dimensions["B"].width = 16

    wb.move_sheet("ReadMe", offset=-len(wb.sheetnames))
    wb.save(path)


# ============================================================================
# 3. CC-Subcontractor-Directory.xlsx
# ============================================================================

def build_subcontractor_directory(path: Path, rows: int):
    wb = lib.new_workbook()
    c = ref(SUBCONTRACTORS)

    readme = wb.create_sheet("ReadMe")
    lib.write_readme(readme, "Collaborative Construction — Subcontractor Directory", [
        ("Standing rule", [
            "A directory listing is not an approval, and current insurance/license paperwork is not an approval either.",
            "Documentation Status is computed automatically from the dates you enter. Approval Status is a judgment call you make and type in yourself -- it is never set by a formula.",
            "Conflict Flag warns you when a subcontractor is marked Approved but their documentation is expired or missing. It does not change Approval Status for you; you decide what to do.",
        ]),
        ("Sourcing", [
            "See the Sourcing tab for the HBRA of Cape Cod member directory and the Massachusetts license-verification lookup.",
            "Both are starting points for finding and checking subcontractors, not sources of truth about whether a given company is currently licensed and insured -- verify directly before approving anyone.",
        ]),
        ("Capacity", [f"{rows} rows are pre-formatted with formulas and dropdowns. A warning appears automatically past ~93% full."]),
    ])

    subs = wb.create_sheet("Subcontractors")
    lib.mark_entry_tab(subs)
    example = {
        "Company": "exclude-example", "Trade": "Plumbing", "Insurance Expires": "2026-01-01",
        "Approval Status": "Not Reviewed", "Notes": "Example row -- delete or overwrite",
    }
    start_row = lib.style_entry_tab(subs, SUBCONTRACTORS, rows=rows, example_row_values=example)
    last = rows + 2

    lists_ws = lib.add_list_sheet(wb)
    rngs = {}
    rngs["trade"] = lib.write_list_column(lists_ws, "A", "Trade", seed.TRADES)
    rngs["town"] = lib.write_list_column(lists_ws, "B", "Town", seed.TOWN_NAMES)
    rngs["approval"] = lib.write_list_column(lists_ws, "C", "Approval Status", seed.APPROVAL_STATUSES)
    rngs["license"] = lib.write_list_column(lists_ws, "D", "License Type", seed.LICENSE_TYPES)
    rngs["yn"] = lib.write_list_column(lists_ws, "E", "Yes/No", seed.YES_NO)
    names = {k: lib.define_name(wb, f"Sub_{k}", f"={v}") for k, v in rngs.items()}

    data_range = lambda header: f"{c(header)}{start_row}:{c(header)}{last}"
    lib.apply_list_validation(subs, data_range("Trade"), names["trade"])
    lib.apply_list_validation(subs, data_range("Secondary Trade"), names["trade"])
    lib.apply_list_validation(subs, data_range("License Type"), names["license"])
    lib.apply_list_validation(subs, data_range("Approval Status"), names["approval"])
    lib.apply_list_validation(subs, data_range("W-9 On File"), names["yn"])

    for r in range(2, last + 1):
        subs[f"{c('Days To Insurance Expiry')}{r}"] = (
            f'=IF({c("Insurance Expires")}{r}="","",{c("Insurance Expires")}{r}-TODAY())'
        )
        subs[f"{c('Documentation Status')}{r}"] = (
            f'=IF({c("Insurance Expires")}{r}="","No insurance date on file",'
            f'IF({c("Insurance Expires")}{r}<TODAY(),"EXPIRED",'
            f'IF({c("Insurance Expires")}{r}-TODAY()<=30,"Expiring soon","Current")))'
        )
        subs[f"{c('Conflict Flag')}{r}"] = (
            f'=IF(AND({c("Approval Status")}{r}="Approved",'
            f'OR({c("Documentation Status")}{r}="EXPIRED",{c("Documentation Status")}{r}="No insurance date on file")),'
            f'"REVIEW -- approved with expired/missing documentation","")'
        )

    vlog = wb.create_sheet("VerificationLog")
    lib.mark_entry_tab(vlog)
    v_example = {"Date": "2026-10-18", "Company": "exclude-example", "What Was Verified": "Example row -- delete or overwrite"}
    lib.style_entry_tab(vlog, VERIFICATION_LOG, rows=rows, example_row_values=v_example)

    sourcing = wb.create_sheet("Sourcing")
    lib.mark_seeded_tab(sourcing)
    sourcing.sheet_view.showGridLines = False
    sourcing["A1"] = "Sourcing & verification links"
    sourcing["A1"].font = lib.TITLE_FONT
    sourcing["A2"] = "Neither of these constitutes approval -- they are starting points for verification, not a source of truth."
    sourcing["A2"].font = lib.Font(name=lib.FONT_NAME, italic=True)
    r = 4
    for name, url, note in seed.SOURCING_LINKS:
        sourcing.cell(row=r, column=1, value=name).font = lib.Font(name=lib.FONT_NAME, bold=True)
        sourcing.cell(row=r + 1, column=1, value=url)
        sourcing.cell(row=r + 2, column=1, value=note).alignment = lib.WRAP
        r += 4
    sourcing.column_dimensions["A"].width = 110

    wb.move_sheet("ReadMe", offset=-len(wb.sheetnames))
    wb.save(path)


# ============================================================================
# 4. CC-Growth-Dashboard.xlsx
# ============================================================================

def load_gsc_live_snapshot():
    import json
    path = seed.REPO_ROOT / "docs/research/data/gsc-snapshot.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def build_growth_dashboard(path: Path, rows: int):
    wb = lib.new_workbook()

    readme = wb.create_sheet("ReadMe")
    lib.write_readme(readme, "Collaborative Construction — Growth Dashboard", [
        ("Start here", [
            "Check the SiteStatus tab first. Production is in deliberate maintenance mode as of this build -- any low traffic numbers in this window reflect that, not marketing performance.",
            "Scorecard reproduces the 18 metrics this business tracks, with real documented values where they exist and 'Unknown' everywhere they don't. Filling in weekly columns is the main ongoing use of this tab.",
        ]),
        ("The Search Console discrepancy is intentional", [
            "SearchBaseline lists two different documented figures for the same date (2026-10-13) that disagree about which direction clicks moved. This is not a mistake in this workbook -- it's a real discrepancy in the source research, preserved rather than guessed at. Both rows are marked 'UNRECONCILED'. Resolve it by re-checking the original GSC export dates before trusting either one for a decision.",
        ]),
        ("BudgetPlan is a proposal, not a quote", [
            "The $600/month split is editable. Change the numbers to match what you actually decide to spend; the formulas recompute automatically.",
            "The external $166-per-lead benchmark on SourceManifest is a published industry average (LocaliQ), not Collaborative Construction data -- it is never used in a formula here.",
        ]),
        ("D1 lead data", [
            "This dashboard does not read the lead database directly (it's PII). Run `node scripts/leads.mjs report --remote --from ISO --to ISO` yourself and type the resulting counts into Scorecard.",
        ]),
        ("Capacity", [f"BudgetPlan, Checklist and Projects have {rows} rows pre-formatted where relevant."]),
    ])

    # --- SiteStatus ---
    status_ws = wb.create_sheet("SiteStatus")
    lib.mark_seeded_tab(status_ws)
    lib.style_header_row(status_ws, SITE_STATUS)
    lib.autosize(status_ws, SITE_STATUS, max_width=70)
    for r, row in enumerate(seed.SITE_STATUS_ROWS, start=2):
        for i, val in enumerate(row, start=1):
            cell = status_ws.cell(row=r, column=i, value=val)
            cell.font = lib.WARNING_FONT if i == 1 else lib.SEEDED_FONT
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER

    # --- Scorecard ---
    scorecard = wb.create_sheet("Scorecard")
    lib.mark_seeded_tab(scorecard)
    lib.style_header_row(scorecard, SCORECARD)
    lib.autosize(scorecard, SCORECARD, max_width=46)
    for r, (metric, definition, value, source) in enumerate(seed.SCORECARD_METRICS, start=2):
        row_vals = [metric, definition, value, source, "", "", ""]
        for i, v in enumerate(row_vals, start=1):
            cell = scorecard.cell(row=r, column=i, value=v)
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER
            if i <= 4:
                cell.font = lib.SEEDED_FONT
            else:
                cell.fill = lib.ENTRY_FILL
                cell.font = lib.BODY_FONT

    # --- SearchBaseline ---
    sb = wb.create_sheet("SearchBaseline")
    lib.mark_seeded_tab(sb)
    lib.style_header_row(sb, SEARCH_BASELINE)
    lib.autosize(sb, SEARCH_BASELINE, max_width=34)
    r = 2
    live = load_gsc_live_snapshot()
    if live and live.get("status") == "ok":
        row_vals = [
            f"{live['window']} (live pull, fetched {live['fetched_at'][:10]})",
            f"{live['date_range']['start']} to {live['date_range']['end']}",
            live["clicks"], live["impressions"], live["ctr"], live["avg_position"],
            "live GSC MCP connector", "", live["fetched_at"][:10],
            live.get("caveat", "live reading"),
        ]
        for i, v in enumerate(row_vals, start=1):
            cell = sb.cell(row=r, column=i, value=v)
            cell.font = lib.Font(name=lib.FONT_NAME, bold=True, size=10)
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER
        r += 1
    else:
        sb.cell(row=r, column=1, value="Live GSC pull unavailable at build time -- see docs/research/data/gsc-snapshot.json for status/reason.").font = lib.WARNING_FONT
        r += 1
    for row_tuple in seed.SEARCH_BASELINE_ROWS:
        for i, v in enumerate(row_tuple, start=1):
            cell = sb.cell(row=r, column=i, value=("" if v is None else v))
            cell.font = lib.SEEDED_FONT
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER
            if i == len(row_tuple) and isinstance(v, str) and "UNRECONCILED" in v:
                cell.font = lib.WARNING_FONT
        r += 1
    for col in ("C", "D"):
        for row_n in range(2, r):
            cell = sb[f"{col}{row_n}"]
            if isinstance(cell.value, int):
                cell.number_format = "#,##0"
    sb["E2"].number_format = "0.00%"

    # --- BudgetPlan ---
    bp = wb.create_sheet("BudgetPlan")
    lib.mark_entry_tab(bp)
    c_bp = ref(BUDGET_PLAN)
    n_seed = len(seed.BUDGET_PLAN_SEED)
    lib.style_header_row(bp, BUDGET_PLAN)
    lib.autosize(bp, BUDGET_PLAN)
    for r, (channel, monthly, months) in enumerate(seed.BUDGET_PLAN_SEED, start=2):
        bp.cell(row=r, column=1, value=channel).font = lib.BODY_FONT
        bp[f"{c_bp('Monthly Budget')}{r}"] = monthly
        bp[f"{c_bp('Months')}{r}"] = months
        bp[f"{c_bp('Total')}{r}"] = f"={c_bp('Monthly Budget')}{r}*{c_bp('Months')}{r}"
        for col in ("Leads Attributed", "Qualified Leads", "Jobs Won"):
            bp[f"{c_bp(col)}{r}"].fill = lib.ENTRY_FILL
        bp[f"{c_bp('Cost Per Qualified Lead')}{r}"] = (
            f'=IF({c_bp("Qualified Leads")}{r}=0,"not calculable",'
            f'{c_bp("Total")}{r}/{c_bp("Qualified Leads")}{r})'
        )
        for col_letter in (c_bp("Monthly Budget"), c_bp("Months"), c_bp("Total"), c_bp("Cost Per Qualified Lead")):
            bp[f"{col_letter}{r}"].font = lib.SEEDED_FONT if col_letter != c_bp("Months") else lib.BODY_FONT
        for i in range(1, len(BUDGET_PLAN) + 1):
            bp.cell(row=r, column=i).border = lib.BORDER
    total_row = n_seed + 2
    bp.cell(row=total_row, column=1, value="Total proposed budget").font = lib.Font(name=lib.FONT_NAME, bold=True)
    bp[f"{c_bp('Total')}{total_row}"] = f"=SUM({c_bp('Total')}2:{c_bp('Total')}{n_seed + 1})"
    bp[f"{c_bp('Total')}{total_row}"].font = lib.Font(name=lib.FONT_NAME, bold=True)
    # Extra blank entry rows below for additional channels the owner adds later
    extra_start = n_seed + 4
    for r in range(extra_start, extra_start + rows):
        for i in range(1, len(BUDGET_PLAN) + 1):
            cell = bp.cell(row=r, column=i)
            cell.fill = lib.ENTRY_FILL
            cell.border = lib.BORDER
        bp[f"{c_bp('Total')}{r}"] = f"=IF({c_bp('Monthly Budget')}{r}=\"\",\"\",{c_bp('Monthly Budget')}{r}*{c_bp('Months')}{r})"
        bp[f"{c_bp('Cost Per Qualified Lead')}{r}"] = (
            f'=IF(OR({c_bp("Qualified Leads")}{r}="",{c_bp("Qualified Leads")}{r}=0),"not calculable",'
            f'{c_bp("Total")}{r}/{c_bp("Qualified Leads")}{r})'
        )

    # --- ChannelPriority ---
    cp = wb.create_sheet("ChannelPriority")
    lib.mark_seeded_tab(cp)
    lib.style_header_row(cp, CHANNEL_PRIORITY)
    lib.autosize(cp, CHANNEL_PRIORITY, max_width=60)
    for r, row_tuple in enumerate(seed.CHANNEL_PRIORITY, start=2):
        for i, v in enumerate(row_tuple, start=1):
            cell = cp.cell(row=r, column=i, value=v)
            cell.font = lib.SEEDED_FONT
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER

    # --- Checklist ---
    chk = wb.create_sheet("Checklist")
    lib.mark_entry_tab(chk)
    lib.style_header_row(chk, CHECKLIST)
    lib.autosize(chk, CHECKLIST, max_width=50)
    lists_ws = lib.add_list_sheet(wb)
    status_rng = lib.write_list_column(lists_ws, "A", "Status", ["Not Started", "In Progress", "Blocked", "Done"])
    yn_rng = lib.write_list_column(lists_ws, "B", "Yes/No", seed.YES_NO)
    status_name = lib.define_name(wb, "Checklist_Status", f"={status_rng}")
    yn_name = lib.define_name(wb, "Checklist_YN", f"={yn_rng}")
    c_chk = ref(CHECKLIST)
    for r, (iid, phase, priority_owner, item, criteria) in enumerate(seed.GROWTH_ITEMS, start=2):
        row_vals = {"ID": iid, "Phase": phase, "Priority / Owner Role": priority_owner, "Work Item": item, "Success Criteria": criteria}
        for i, header in enumerate(CHECKLIST, start=1):
            cell = chk.cell(row=r, column=i)
            cell.border = lib.BORDER
            cell.alignment = lib.WRAP
            if header in row_vals:
                cell.value = row_vals[header]
                cell.font = lib.SEEDED_FONT
            elif header == "Status":
                cell.value = "Not Started"
                cell.fill = lib.ENTRY_FILL
                cell.font = lib.BODY_FONT
            else:
                cell.fill = lib.ENTRY_FILL
                cell.font = lib.BODY_FONT
    last_item_row = len(seed.GROWTH_ITEMS) + 1
    lib.apply_list_validation(chk, f"{c_chk('Status')}2:{c_chk('Status')}{last_item_row}", status_name)
    lib.apply_list_validation(chk, f"{c_chk('Done?')}2:{c_chk('Done?')}{last_item_row}", yn_name)

    # --- Projects ---
    proj = wb.create_sheet("Projects")
    lib.mark_entry_tab(proj)
    c_proj = ref(PROJECTS_COLS)
    lib.style_header_row(proj, PROJECTS_COLS)
    lib.autosize(proj, PROJECTS_COLS, max_width=40)
    town_lookup = {t["name"]: t["inServiceArea"] for t in seed.TOWNS}
    for r, p in enumerate(seed.PROJECTS, start=2):
        town = p["location"].split(",")[0].strip()
        in_area = town_lookup.get(town)
        row_vals = {
            "Title": p["title"], "Category": p["category"], "Location": p["location"], "Shows": p["shows"],
            "In Service Area?": ("Yes" if in_area else "No" if in_area is False else "Unknown"),
        }
        for i, header in enumerate(PROJECTS_COLS, start=1):
            cell = proj.cell(row=r, column=i)
            cell.border = lib.BORDER
            cell.alignment = lib.WRAP
            if header in row_vals:
                cell.value = row_vals[header]
                cell.font = lib.SEEDED_FONT
            else:
                cell.fill = lib.ENTRY_FILL
                cell.font = lib.BODY_FONT
    last_proj_row = len(seed.PROJECTS) + 1
    yn_u_rng = lib.write_list_column(lists_ws, "C", "Yes/No/Unknown", seed.YES_NO_UNKNOWN)
    ynu_name = lib.define_name(wb, "Projects_YNU", f"={yn_u_rng}")
    for header in ("Photos Usable?", "Written Permission?", "Case Study Written?"):
        lib.apply_list_validation(proj, f"{c_proj(header)}2:{c_proj(header)}{last_proj_row}", ynu_name)

    # --- SourceManifest ---
    manifest = wb.create_sheet("SourceManifest")
    lib.mark_seeded_tab(manifest)
    lib.style_header_row(manifest, SOURCE_MANIFEST)
    lib.autosize(manifest, SOURCE_MANIFEST, max_width=50)
    r = 2
    manifest_rows = [
        ("GSC 90-day baseline", "32 clicks / 1,594 impr / 2.01% CTR / pos 11.0", "docs/research/16-gsc-seo-baseline.md", "2026-10-12", "documented, >14 days old", "documented"),
        ("GSC 28-day live pull", f"{live['clicks']} clicks / {live['impressions']} impr" if live else "unavailable", "live GSC MCP connector", live["fetched_at"][:10] if live else "", "fresh" if live else "not available at build time", "live"),
        ("GA4 property identity", f"property {seed.GA4_PROPERTY_ID}, {seed.GA4_MEASUREMENT_ID}", "live GA4 MCP connector (account_summaries)", "2026-10-18", "fresh", "live, identity-only"),
        ("GA4 legacy ID (not used)", seed.GA4_LEGACY_MEASUREMENT_ID, "docs/research/19-ga4-connection-and-diagnosis.md:53", "2026-10-13", "documented", "documented, explicitly excluded"),
        ("Site status", "Maintenance mode, HTTP 503", "live curl check", "2026-10-18", "fresh", "live"),
        ("Competitor count", "14 companies", "docs/research/brand-exploration-2026-10-13/competitors.json", "2026-10-13", "documented", "documented"),
        *[(name, "$166/lead" if "166" in str(val) else val, src, "", "external, unverified locally", kind)
          for name, val, src, note, kind in seed.EXTERNAL_BENCHMARKS],
    ]
    for row_tuple in manifest_rows:
        for i, v in enumerate(row_tuple, start=1):
            cell = manifest.cell(row=r, column=i, value=v)
            cell.font = lib.SEEDED_FONT
            cell.alignment = lib.WRAP
            cell.border = lib.BORDER
        r += 1

    wb.move_sheet("ReadMe", offset=-len(wb.sheetnames))
    wb.save(path)


# ============================================================================
# CLI
# ============================================================================

BUILDERS = {
    "CC-Competitor-Research.xlsx": build_competitor_research,
    "CC-Lead-Pipeline.xlsx": build_lead_pipeline,
    "CC-Subcontractor-Directory.xlsx": build_subcontractor_directory,
    "CC-Growth-Dashboard.xlsx": build_growth_dashboard,
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", choices=list(BUILDERS), help="Build only this workbook")
    parser.add_argument("--fresh", action="store_true", help="Write a separate -REBUILD-<date> file, never touch the original")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero if any seed source is missing/stale")
    parser.add_argument("--rows", type=int, default=lib.ENTRY_ROWS, help="Entry rows per tab (default 300)")
    args = parser.parse_args()

    warnings = seed.verify_sources()
    if warnings:
        print(f"WARNING: {len(warnings)} seed-data source issue(s):", file=sys.stderr)
        for w in warnings:
            print(f"  - {w}", file=sys.stderr)
        if args.strict:
            print("Aborting (--strict).", file=sys.stderr)
            return 1

    targets = {args.only: BUILDERS[args.only]} if args.only else BUILDERS
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    exit_code = 0
    for name, builder in targets.items():
        target_path = OUTPUT_DIR / name
        build_fn = lambda p, b=builder: b(p, args.rows)

        if args.fresh:
            fresh_path = lib.build_fresh_copy(build_fn, target_path)
            print(f"{name}: wrote fresh copy to {fresh_path.name} (original untouched)")
            continue

        result = lib.safe_write(build_fn, target_path, BACKUP_DIR)
        if result["action"] == "created":
            print(f"{name}: created")
        elif result["action"] == "refreshed":
            print(f"{name}: refreshed (seeded tabs updated, entry tabs unchanged; backup at {result['backup']})")
        elif result["action"] == "aborted":
            print(f"{name}: ABORTED -- entry-tab differences detected, original left untouched. Backup saved at {result['backup']} in case you want it anyway.")
            for d in result["diffs"][:20]:
                print(f"    {d}")
            if len(result["diffs"]) > 20:
                print(f"    ... and {len(result['diffs']) - 20} more")
            exit_code = 1
        elif result["action"] == "refused":
            print(f"{name}: REFUSED -- {result['reason']}")
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
