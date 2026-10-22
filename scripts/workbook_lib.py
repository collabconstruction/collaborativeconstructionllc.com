"""Shared styling, validation, and the safe-write/diff machinery used by
build-workbooks.py. See docs comment at the top of build-workbooks.py for the
overall architecture; this module has no CLI of its own.
"""

import shutil
import tempfile
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.defined_name import DefinedName

# --- Styling (Arial throughout; Google Sheets / LibreOffice / Excel safe) --------

FONT_NAME = "Arial"
HEADER_FONT = Font(name=FONT_NAME, bold=True, color="FFFFFF", size=10)
HEADER_FILL = PatternFill("solid", fgColor="182B49")  # CC brand navy, per src/_data/business.json theme-color
BODY_FONT = Font(name=FONT_NAME, size=10)
SEEDED_FONT = Font(name=FONT_NAME, size=10, color="444444")
ENTRY_FILL = PatternFill("solid", fgColor="FFFDE7")  # pale yellow: "type here"
EXAMPLE_FONT = Font(name=FONT_NAME, size=10, italic=True, color="888888")
WARNING_FONT = Font(name=FONT_NAME, size=10, bold=True, color="B00020")
TITLE_FONT = Font(name=FONT_NAME, size=14, bold=True, color="182B49")
THIN = Side(style="thin", color="CCCCCC")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")

ENTRY_ROWS = 300  # pre-filled rows per entry tab; see capacity guard below


def new_workbook():
    wb = Workbook()
    wb.remove(wb.active)
    return wb


def style_header_row(ws, columns, row=1):
    for i, header in enumerate(columns, start=1):
        cell = ws.cell(row=row, column=i, value=header)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        cell.border = BORDER
    ws.freeze_panes = ws.cell(row=row + 1, column=1).coordinate
    ws.row_dimensions[row].height = 30


def autosize(ws, columns, min_width=12, max_width=42):
    for i, header in enumerate(columns, start=1):
        ws.column_dimensions[get_column_letter(i)].width = max(min_width, min(max_width, len(header) + 4))


def write_readme(ws, title, sections):
    """sections: list of (heading, body_lines) tuples."""
    ws.sheet_view.showGridLines = False
    r = 1
    ws.cell(row=r, column=1, value=title).font = TITLE_FONT
    r += 2
    for heading, lines in sections:
        ws.cell(row=r, column=1, value=heading).font = Font(name=FONT_NAME, bold=True, size=11)
        r += 1
        for line in lines:
            c = ws.cell(row=r, column=1, value=line)
            c.font = BODY_FONT
            c.alignment = WRAP
            r += 1
        r += 1
    ws.column_dimensions["A"].width = 110


def add_list_sheet(wb, name="Lists"):
    ws = wb.create_sheet(name)
    ws.sheet_view.showGridLines = False
    return ws


def write_list_column(ws, col_letter, header, values):
    ws[f"{col_letter}1"] = header
    ws[f"{col_letter}1"].font = Font(name=FONT_NAME, bold=True, size=10)
    for i, v in enumerate(values, start=2):
        ws[f"{col_letter}{i}"] = v
    return f"{ws.title}!${col_letter}$2:${col_letter}${max(len(values) + 1, 2)}"


def define_name(wb, name, formula):
    """formula like "'Lists'!$A$2:$A$10" (sheet-qualified, absolute)."""
    safe_name = name.replace(" ", "_").replace("/", "_").replace("?", "").replace("(", "").replace(")", "").replace("-", "_")
    wb.defined_names[safe_name] = DefinedName(safe_name, attr_text=formula)
    return safe_name


def apply_list_validation(ws, cell_range, defined_name, allow_blank=True):
    dv = DataValidation(type="list", formula1=f"={defined_name}", allow_blank=allow_blank, showDropDown=False)
    dv.error = "Choose a value from the dropdown list."
    dv.errorTitle = "Invalid entry"
    ws.add_data_validation(dv)
    dv.add(cell_range)
    return dv


def style_entry_tab(ws, columns, rows=ENTRY_ROWS, example_row_values=None, exclude_col_letter=None):
    """Lay out an ENTRY tab: header + styled blank rows + optional example row.

    example_row_values: dict {header: value} for one illustrative row written
    at row 2. If exclude_col_letter is given and that header exists in
    example_row_values, "Yes" is forced there regardless of what was passed,
    per the standing rule that example rows must never pollute real counts.
    """
    style_header_row(ws, columns)
    autosize(ws, columns)
    n = len(columns)

    start_row = 2
    if example_row_values:
        for i, header in enumerate(columns, start=1):
            val = example_row_values.get(header, "")
            cell = ws.cell(row=2, column=i, value=val)
            cell.font = EXAMPLE_FONT
            cell.border = BORDER
            cell.alignment = WRAP
        start_row = 3

    for r in range(start_row, rows + 2):
        for c in range(1, n + 1):
            cell = ws.cell(row=r, column=c)
            cell.fill = ENTRY_FILL
            cell.font = BODY_FONT
            cell.border = BORDER

    # Capacity guard banner just past the data area.
    banner_row = rows + 3
    banner_col_letter = get_column_letter(n + 1)
    ws[f"{banner_col_letter}2"] = (
        f'=IF(COUNTA(A2:A{rows + 1})>{int(rows * 0.93)},'
        f'"Approaching row capacity ({rows} rows prepared) -- see ReadMe before adding more","")'
    )
    ws[f"{banner_col_letter}2"].font = WARNING_FONT
    return start_row


def mark_seeded_tab(ws):
    """Visual cue only (no functional effect): seeded tabs get a grey tab color."""
    ws.sheet_properties.tabColor = "9E9E9E"


def mark_entry_tab(ws):
    ws.sheet_properties.tabColor = "F9A825"


# --- Safe write: build into a temp copy, diff ENTRY tabs, swap only if clean ----

ENTRY_TAB_NAMES_BY_WORKBOOK = {
    "CC-Competitor-Research.xlsx": {"ResearchLog"},
    "CC-Lead-Pipeline.xlsx": {"LeadRegister", "ReviewRequests"},
    "CC-Subcontractor-Directory.xlsx": {"Subcontractors", "VerificationLog"},
    "CC-Growth-Dashboard.xlsx": {"BudgetPlan", "Checklist", "Projects"},
}


def _norm_color(rgb):
    """LibreOffice re-saving a workbook commonly rewrites a color's alpha
    byte (e.g. openpyxl's 'FF182B49' becomes 'FF' -> '00' on LibreOffice
    resave) without changing how it looks. Compare only the RGB bytes so a
    harmless recalc/open-and-save round trip doesn't look like a change to
    owner-entered formatting.
    """
    if not rgb or not isinstance(rgb, str):
        return rgb
    return rgb[-6:].upper()


def _norm_formula(formula):
    """Tolerate whitespace/case/quote normalization a different tool (e.g.
    LibreOffice) applies to a validation formula without changing what it
    actually references.
    """
    if not formula:
        return formula
    return formula.replace(" ", "").replace("'", "").upper()


def _cell_signature(cell):
    return (
        cell.value,
        cell.number_format,
        cell.font.name,
        cell.font.bold,
        _norm_color(cell.font.color.rgb if cell.font.color else None),
        _norm_color(cell.fill.fgColor.rgb if cell.fill and cell.fill.fgColor else None),
    )


def _sheet_signature(ws):
    sig = {
        "dims": (ws.max_row, ws.max_column),
        "cells": {},
        "merges": sorted(str(m) for m in ws.merged_cells.ranges),
        "validations": sorted(
            (_norm_formula(str(dv.sqref)), _norm_formula(dv.formula1))
            for dv in ws.data_validations.dataValidation
        ),
    }
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is not None:
                sig["cells"][cell.coordinate] = _cell_signature(cell)
    return sig


def diff_entry_tabs(old_path, new_path, entry_tab_names):
    """Compare every ENTRY tab between old_path and new_path. Returns a list
    of human-readable difference strings; empty list means identical.
    """
    diffs = []
    old_wb = load_workbook(old_path, data_only=False)
    new_wb = load_workbook(new_path, data_only=False)
    for name in entry_tab_names:
        if name not in old_wb.sheetnames:
            diffs.append(f"{name}: missing from existing workbook (cannot verify safety, aborting)")
            continue
        if name not in new_wb.sheetnames:
            diffs.append(f"{name}: generator no longer produces this tab")
            continue
        old_sig = _sheet_signature(old_wb[name])
        new_sig = _sheet_signature(new_wb[name])
        if old_sig["dims"] != new_sig["dims"]:
            diffs.append(f"{name}: dimensions changed {old_sig['dims']} -> {new_sig['dims']}")
        if old_sig["merges"] != new_sig["merges"]:
            diffs.append(f"{name}: merged ranges changed")
        if old_sig["validations"] != new_sig["validations"]:
            diffs.append(f"{name}: data validation ranges/formulas changed")
        all_coords = set(old_sig["cells"]) | set(new_sig["cells"])
        for coord in sorted(all_coords):
            if old_sig["cells"].get(coord) != new_sig["cells"].get(coord):
                diffs.append(f"{name}!{coord}: changed ({old_sig['cells'].get(coord)!r} -> {new_sig['cells'].get(coord)!r})")
    return diffs


def safe_write(build_fn, target_path: Path, backup_dir: Path):
    """build_fn(path) must write a complete workbook to `path`.

    If target_path doesn't exist, build_fn writes directly to it.
    If it exists: build into a temp file, diff every ENTRY tab against the
    existing file, and only replace the original if every ENTRY tab is
    byte-identical in the comparison above. On any difference, abort and
    leave the original untouched, printing what differed.
    """
    target_path = Path(target_path)
    backup_dir = Path(backup_dir)
    entry_tabs = ENTRY_TAB_NAMES_BY_WORKBOOK.get(target_path.name, set())

    if not target_path.exists():
        build_fn(target_path)
        return {"action": "created", "diffs": []}

    lock_file = target_path.parent / f"~${target_path.name}"
    if lock_file.exists():
        return {"action": "refused", "reason": f"{target_path.name} appears open (lock file present): {lock_file}"}

    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    backup_path = backup_dir / f"{target_path.stem}-{stamp}{target_path.suffix}"
    shutil.copy2(target_path, backup_path)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp) / target_path.name
        build_fn(tmp_path)
        diffs = diff_entry_tabs(target_path, tmp_path, entry_tabs)
        if diffs:
            return {"action": "aborted", "diffs": diffs, "backup": str(backup_path)}
        shutil.copy2(tmp_path, target_path)
        return {"action": "refreshed", "diffs": [], "backup": str(backup_path)}


def build_fresh_copy(build_fn, target_path: Path):
    stamp = datetime.now().strftime("%Y%m%d")
    fresh_path = target_path.parent / f"{target_path.stem}-REBUILD-{stamp}{target_path.suffix}"
    build_fn(fresh_path)
    return fresh_path
