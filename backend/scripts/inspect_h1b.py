"""
Quick diagnostic: show what columns and status values exist in the LCA file.
Run this to figure out the right schema before processing all 4 files.
"""

import pandas as pd
from pathlib import Path

H1B_DIR = Path(__file__).parent.parent / "data" / "h1b"

# Just read the first file's first 100 rows
file_path = H1B_DIR / "LCA_Disclosure_Data_FY2025_Q1.xlsx"

print(f"Reading {file_path.name} (first 1000 rows for inspection)...")
df = pd.read_excel(file_path, engine="openpyxl", nrows=1000)

print()
print(f"Total columns: {len(df.columns)}")
print()
print("All column names:")
for i, col in enumerate(df.columns):
    print(f"  {i+1:>3}. {col}")

print()

# Find the status column (might be named differently)
print("Looking for status-related columns...")
for col in df.columns:
    if "STATUS" in col.upper() or "CASE" in col.upper():
        print(f"  Found: {col}")
        print(f"    Unique values: {df[col].unique().tolist()[:20]}")
        print()

# Find the employer column
print("Looking for employer-related columns...")
for col in df.columns:
    if "EMPLOYER" in col.upper() or "COMPANY" in col.upper():
        print(f"  Found: {col}")
        print(f"    Sample values: {df[col].dropna().head(5).tolist()}")
        print()