"""Single source of truth for every tab's column order.

No Excel column letter is ever typed by hand anywhere else in this project.
Every formula is built by calling ref(tab_name) to get a resolver, then
resolver("Header Text") to get back the letter. This exists because a
hand-typed column letter desynchronises silently the moment a column is
inserted or reordered -- exactly the bug a review of an earlier draft of
this generator caught (a formula referenced column X when the intended
column, after the real header order, was Y).
"""

from openpyxl.utils import get_column_letter

# --- CC-Competitor-Research.xlsx -------------------------------------------------

DIRECTORY = [
    "Company", "Website", "Service Area", "Positioning",          # seeded
    "Google Rating", "Review Count", "Date Checked",               # entry
    "Services Offered", "Price Tier", "Serves Falmouth?",
    "Priority", "Notes",
]

WEBSITE_TEARDOWN = [
    "Company", "URL", "Area", "Positioning", "Logo", "Colors", "Typography",
    "Hero", "Navigation", "Motion", "CTA", "Trust Signals",
    "Exceptional", "Generic", "Lesson For CC", "Avoid",
]

RESEARCH_LOG = ["Date", "Company", "What Changed", "Where Seen", "Action For CC", "Owner"]

# --- CC-Lead-Pipeline.xlsx (code-only, no PII) ------------------------------------

LEAD_REGISTER = [
    "Lead Code", "Received Date", "Source", "Source Detail",          # A-D
    "Project Type", "Town", "Budget Range", "Desired Timeline",       # E-H
    "Current Stage",                                                  # I
    "First Response At", "Hours To First Response",                  # J-K (K = formula)
    "Last Contact", "Next Action", "Follow-Up Due", "Days Overdue",  # L-O (O = formula)
    "Estimated Value", "Booked Value", "Contribution", "Cash Collected",  # P-S
    "Outcome", "Loss Reason",                                         # T-U
    "Ever Qualified?", "Ever Consultation?", "Ever Estimate Sent?",   # V-X
    "Exclude From Reporting",                                         # Y
    "Notes",                                                          # Z
]

REVIEW_REQUESTS = [
    "Lead Code", "Project Description", "Completed Date", "Permission To Publish",
    "Request Sent Date", "Channel", "Reminder Sent Date", "Public Review Exists?",
    "Review Received Date", "Rating", "Public Review URL",
    "Reply Drafted", "Reply Posted", "Testimonial Approved For Site", "Notes",
]

# --- CC-Subcontractor-Directory.xlsx ----------------------------------------------

SUBCONTRACTORS = [
    "Company", "Trade", "Secondary Trade", "Contact Name", "Phone", "Email", "Website",
    "Service Towns", "License Type", "License #", "License Verified Date",
    "Insurance Carrier", "Insurance Expires", "Insurance Verified Date",
    "Days To Insurance Expiry", "Documentation Status",                 # formulas
    "W-9 On File", "Typical Availability", "Pricing Notes",
    "Quality Rating (1-5)", "Projects Worked", "Last Contacted",
    "Approval Status", "Approved By", "Approval Date", "Conflict Flag",  # Conflict Flag = formula
    "Notes",
]

VERIFICATION_LOG = ["Date", "Company", "What Was Verified", "Source", "Verified By", "Expires", "Result"]

# --- CC-Growth-Dashboard.xlsx ------------------------------------------------------

SCORECARD = ["Metric", "Definition", "Current Value (documented)", "Source", "This Week", "Last Week", "Notes"]

SEARCH_BASELINE = [
    "Window", "Date Range", "Clicks", "Impressions", "CTR", "Avg Position",
    "Source File", "Line", "Date Observed", "Reconciliation Status",
]

BUDGET_PLAN = [
    "Channel", "Monthly Budget", "Months", "Total",                 # Total = formula
    "Leads Attributed", "Qualified Leads",
    "Cost Per Qualified Lead",                                       # formula
    "Jobs Won", "Notes",
]

CHANNEL_PRIORITY = ["Rank", "Channel", "Evidence", "Status", "Source"]

CHECKLIST = ["ID", "Phase", "Priority / Owner Role", "Work Item", "Success Criteria", "Status", "Owner", "Due", "Done?", "Notes"]

PROJECTS = [
    "Title", "Category", "Location", "Shows", "In Service Area?",
    "Photos Usable?", "Written Permission?", "Permission Date",
    "Case Study Written?", "Notes",
]

SOURCE_MANIFEST = ["Metric / Figure", "Value", "Source", "Date Observed", "Freshness", "Type"]

SITE_STATUS = ["Field", "Value", "Source"]


def ref(columns):
    """Bind a column list, returning a function mapping header text -> letter.

    Usage: c = ref(LEAD_REGISTER); c("Exclude From Reporting") -> "Y"
    """
    index = {name: i + 1 for i, name in enumerate(columns)}

    def resolver(header):
        if header not in index:
            raise KeyError(f"Column {header!r} not in schema {columns!r}")
        return get_column_letter(index[header])

    resolver.columns = columns
    resolver.count = len(columns)
    return resolver


def assert_no_hardcoded_refs(formula_strings, known_letters):
    """Defense-in-depth check used by tests: every !$<LETTER>$ in a formula
    must correspond to a letter that was actually produced by a resolver
    call recorded in known_letters, not typed directly into the f-string.
    This can't prove a letter was resolver-derived (both look identical in
    the final string), so the real guarantee comes from code review plus
    the header-match test in verify_schema.py. This is a sanity net for
    letters that don't appear in any tab's current schema at all.
    """
    import re
    all_valid = set(known_letters)
    bad = []
    for formula in formula_strings:
        for m in re.finditer(r"!\$([A-Z]{1,2})\$", formula):
            if m.group(1) not in all_valid:
                bad.append((formula, m.group(1)))
    return bad
