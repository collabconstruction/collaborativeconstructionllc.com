"""Evidence records ("findings") shared by the Scout and the Builder simulator.

Rules baked in:
- Strict, versioned shape. Unknown is the word "unknown", never zero or an empty guess.
- finding_id is a hash of the subject, the claim and the source, not of the time, so the
  same problem seen twice is one finding.
- Text that came from the outside world is data. It is length capped, stripped of control
  characters and checked for instruction-like phrases. It is never run, never obeyed.
"""
import datetime
import hashlib
import re

SCHEMA = "finding/1"
LABELS = {"verified-source", "reported", "estimate", "owner-confirmation-needed"}
SEVERITIES = {"P0", "P1", "P2", "P3"}
CONFIDENCE = {"high", "medium", "low", "unknown"}
SOURCE_TYPES = {"site-response", "github-run", "official-page", "competitor-page", "owner-statement", "other"}
REQUIRED = ["schema", "finding_id", "observed_at_utc", "subject", "claim", "source_url", "source_type",
            "label", "severity", "confidence", "needs_owner_approval"]
MAX_TEXT = 600

# Phrases that try to give an agent orders. A match is recorded as a flag, never followed.
INSTRUCTION_PATTERNS = [
    r"ignore (all |any )?(previous|prior|above) (instructions|rules)",
    r"\b(you must|you should|please) (now )?(run|execute|delete|deploy|merge|send|post|email|disable)\b",
    r"\b(system|developer) (prompt|message)\b",
    r"reveal (your |the )?(secret|token|password|key)",
    r"<\s*script\b",
]


def clean_text(value, limit=MAX_TEXT):
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", " ", str(value))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def looks_like_instruction(text):
    return any(re.search(p, str(text), re.I) for p in INSTRUCTION_PATTERNS)


def finding_id(subject, claim, source_url):
    norm = "|".join(re.sub(r"\s+", " ", str(x)).strip().lower() for x in (subject, claim, source_url))
    return hashlib.sha256(norm.encode()).hexdigest()[:20]


def make_finding(subject, claim, source_url, source_type, label, severity, confidence="unknown",
                 needs_owner_approval=True, owner="engineering", repro=None, recommended_test=None,
                 blocked_reason=None, observed_at=None):
    claim_clean = clean_text(claim)
    finding = {
        "schema": SCHEMA,
        "finding_id": finding_id(subject, claim_clean, source_url),
        "observed_at_utc": (observed_at or datetime.datetime.now(datetime.timezone.utc)).isoformat(),
        "subject": clean_text(subject, 120),
        "claim": claim_clean,
        "source_url": clean_text(source_url, 300),
        "source_type": source_type,
        "label": label,
        "severity": severity,
        "confidence": confidence,
        "owner": clean_text(owner, 60),
        "repro": [clean_text(r, 200) for r in (repro or [])][:8],
        "recommended_test": clean_text(recommended_test or "unknown", 300),
        "needs_owner_approval": bool(needs_owner_approval),
        "blocked_reason": clean_text(blocked_reason, 300) if blocked_reason else None,
        "flags": ["instruction-like-text"] if looks_like_instruction(claim) else [],
    }
    validate(finding)
    return finding


def validate(f):
    errors = []
    for key in REQUIRED:
        if key not in f or f[key] in (None, ""):
            errors.append(f"missing {key}")
    if f.get("schema") != SCHEMA:
        errors.append("wrong schema")
    if f.get("label") not in LABELS:
        errors.append("bad label")
    if f.get("severity") not in SEVERITIES:
        errors.append("bad severity")
    if f.get("confidence") not in CONFIDENCE:
        errors.append("bad confidence")
    if f.get("source_type") not in SOURCE_TYPES:
        errors.append("bad source_type")
    try:
        datetime.datetime.fromisoformat(f.get("observed_at_utc", ""))
    except ValueError:
        errors.append("bad timestamp")
    if f.get("label") == "verified-source" and not str(f.get("source_url", "")).startswith("http"):
        errors.append("verified-source needs a source url")
    if errors:
        raise ValueError("invalid finding: " + "; ".join(errors))
    return True


def dedupe(findings, known_ids):
    """Keep one finding per id, and drop any id already recorded."""
    seen, fresh = set(known_ids), []
    for f in findings:
        if f["finding_id"] not in seen:
            seen.add(f["finding_id"])
            fresh.append(f)
    return fresh
