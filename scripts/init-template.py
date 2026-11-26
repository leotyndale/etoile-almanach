#!/usr/bin/env python3
"""Initialize a forked ÉTOILE Almanach template with a clean starter dataset and custom branding."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import shutil


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reset ÉTOILE bootstrap data to the 3-restaurant starter sample and customize branding."
    )
    parser.add_argument("--title", default="ÉTOILE", help="Masthead wordmark / site title (default: ÉTOILE)")
    parser.add_argument(
        "--subtitle",
        default="Personal Michelin & World's 50 Best Dining Almanac",
        help="Subtitle displayed below masthead",
    )
    parser.add_argument("--years", default="2024 — 2027", help="Edition years shown in top colophon")
    parser.add_argument("--keep-demo", action="store_true", help="Keep the existing full demo dataset instead of resetting")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    parser.add_argument(
        "--root",
        default=str(pathlib.Path(__file__).resolve().parent.parent),
        help="Repository root directory",
    )
    args = parser.parse_args()

    root = pathlib.Path(args.root).resolve()
    data_dir = root / "data"
    sample_file = data_dir / "sample.bootstrap.json"
    bootstrap_file = data_dir / "bootstrap.json"
    unmatched_file = data_dir / "region_unmatched.json"
    index_file = root / "index.html"

    if not index_file.is_file():
        raise SystemExit(f"Error: index.html not found under {root}")

    if not args.keep_demo:
        if not sample_file.is_file():
            raise SystemExit(f"Error: starter dataset not found at {sample_file}")
        if args.dry_run:
            print(f"[dry-run] copy {sample_file} -> {bootstrap_file}")
            print(f"[dry-run] reset {unmatched_file} -> {{\"items\": []}}")
        else:
            shutil.copyfile(sample_file, bootstrap_file)
            unmatched_file.write_text(json.dumps({"items": []}, indent=2) + "\n", encoding="utf-8")
            print(f"Reset data/bootstrap.json to 3-restaurant starter template.")

    html = index_file.read_text(encoding="utf-8")
    updated = html
    updated = re.sub(
        r"<title>.*?</title>",
        f"<title>{args.title} — {args.subtitle}</title>",
        updated,
        count=1,
    )
    updated = re.sub(
        r'<h1 class="masthead-wordmark">.*?</h1>',
        f'<h1 class="masthead-wordmark">{args.title}</h1>',
        updated,
        count=1,
    )
    updated = re.sub(
        r"ÉDITION\s+[^<]+",
        f"ÉDITION {args.years}",
        updated,
        count=1,
    )

    if args.dry_run:
        print(f"[dry-run] update {index_file} title='{args.title}', years='{args.years}'")
    else:
        index_file.write_text(updated, encoding="utf-8")
        print(f"Updated index.html branding for '{args.title}' ({args.years}).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
