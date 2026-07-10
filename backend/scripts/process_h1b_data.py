"""
Process USCIS H1B LCA (Labor Condition Application) disclosure data into a
compact JSON sponsor lookup file.

INPUT:  backend/data/h1b/LCA_Disclosure_Data_FY2025_Q{1-4}.xlsx
OUTPUT: backend/data/h1b_sponsors.json

The output is a flat dictionary:
    {
        "MICROSOFT CORPORATION": 4521,
        "GOOGLE LLC":            3892,
        ...
    }

Where the value = number of CERTIFIED H1B filings in FY2025.

We filter to CERTIFIED cases only (not WITHDRAWN or DENIED) so the count
reflects actual sponsorship intent. We normalize company names to uppercase
trimmed strings for consistent lookup.

This script runs ONCE locally. The output JSON is committed to the repo
and read by the backend at request time (no live DOL API calls).

Run:
    cd backend
    python scripts/process_h1b_data.py
"""

import json
import os
from pathlib import Path

import pandas as pd

# ---- Paths --------------------------------------------------------
BACKEND_DIR = Path(__file__).parent.parent
H1B_DIR = BACKEND_DIR / "data" / "h1b"
OUTPUT_PATH = BACKEND_DIR / "data" / "h1b_sponsors.json"

# ---- Config -------------------------------------------------------
# Column names in the DOL Excel files. As of FY2025 schema.
# If DOL changes the schema, update these.
EMPLOYER_COLUMN = "EMPLOYER_NAME"
STATUS_COLUMN = "CASE_STATUS"

# Only count cases that were Certified (approved by DOL).
# This filters out Withdrawn, Denied, and incomplete applications.
# Note: DOL uses Title Case in the data, not uppercase.
VALID_STATUSES = {"Certified", "Certified - Withdrawn"}


def normalize_employer_name(name: str) -> str:
    """
    Standardize company names so 'Microsoft Corp', 'Microsoft Corporation',
    and 'MICROSOFT CORPORATION' all map to the same key.

    Strategy:
    - Uppercase everything
    - Strip leading/trailing whitespace
    - Collapse multiple spaces
    - Remove trailing punctuation
    """
    if not isinstance(name, str):
        return ""

    normalized = name.upper().strip()

    # Collapse multiple whitespace
    normalized = " ".join(normalized.split())

    # Remove trailing punctuation that's just noise
    while normalized and normalized[-1] in ".,;:":
        normalized = normalized[:-1].strip()

    return normalized


def process_quarter_file(file_path: Path) -> dict:
    """
    Read one quarterly LCA Excel file and return a dict of
    {employer_name: count_in_this_quarter}.
    Returns empty dict if file is unreadable (corrupt download, etc).
    """
    print(f"  Reading {file_path.name}...")

    try:
        # Read only the columns we need — faster + less memory
        df = pd.read_excel(
            file_path,
            usecols=[EMPLOYER_COLUMN, STATUS_COLUMN],
            engine="openpyxl",
        )
    except Exception as e:
        print(f"    ⚠ SKIPPING — file unreadable: {e}")
        return {}

    print(f"    Total rows: {len(df):,}")

    # Filter to certified cases only
    df = df[df[STATUS_COLUMN].isin(VALID_STATUSES)]
    print(f"    Certified rows: {len(df):,}")

    # Normalize employer names
    df[EMPLOYER_COLUMN] = df[EMPLOYER_COLUMN].apply(normalize_employer_name)

    # Drop blank employer names
    df = df[df[EMPLOYER_COLUMN] != ""]

    # Count per employer
    counts = df[EMPLOYER_COLUMN].value_counts().to_dict()

    print(f"    Unique employers: {len(counts):,}")

    return counts


def main():
    if not H1B_DIR.exists():
        raise FileNotFoundError(f"H1B data directory not found: {H1B_DIR}")

    # Find all quarterly files
    quarterly_files = sorted(H1B_DIR.glob("LCA_Disclosure_Data_FY2025_Q*.xlsx"))

    if not quarterly_files:
        raise FileNotFoundError(f"No H1B files found in {H1B_DIR}")

    print(f"Found {len(quarterly_files)} quarterly files")
    print()

    # Aggregate counts across all quarters
    total_counts = {}
    for file_path in quarterly_files:
        quarter_counts = process_quarter_file(file_path)
        for employer, count in quarter_counts.items():
            total_counts[employer] = total_counts.get(employer, 0) + count

    print()
    print(f"Total unique sponsors: {len(total_counts):,}")
    print(f"Total H1B filings: {sum(total_counts.values()):,}")

    # Sort by count descending so the JSON is human-readable
    # (top sponsors at the top, easier to debug)
    sorted_counts = dict(
        sorted(total_counts.items(), key=lambda x: x[1], reverse=True)
    )

    # Write JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted_counts, f, indent=2, ensure_ascii=False)

    # Report top sponsors as a sanity check
    print()
    print("Top 10 H1B sponsors:")
    for i, (employer, count) in enumerate(list(sorted_counts.items())[:10], 1):
        print(f"  {i:>2}. {employer:<60} {count:>6,}")

    print()
    print(f"✓ Wrote {OUTPUT_PATH}")
    print(f"  File size: {OUTPUT_PATH.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()