#!/usr/bin/env python3
"""Deterministic asset synchronization and verification script.

Synchronizes canonical contracts and templates from the repository root
into python/src/specly_cli/assets/ and validates SHA-256 fingerprints.

Usage:
  python3 python/scripts/sync_assets.py          # Synchronize assets
  python3 python/scripts/sync_assets.py --check  # Verify without writing
"""

import hashlib
import json
import os
import shutil
import sys
from typing import Dict, List, Tuple


def compute_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def get_asset_mappings(repo_root: str) -> List[Tuple[str, str, str]]:
    """Return list of (canonical_path, snapshot_path, expected_sha256) tuples."""
    canonical_contract = os.path.join(repo_root, "contracts", "artifact-contract-v1.json")
    snapshot_contract = os.path.join(
        repo_root, "python", "src", "specly_cli", "assets", "artifact-contract-v1.json"
    )

    with open(canonical_contract, "r", encoding="utf-8") as f:
        contract = json.load(f)

    mappings = [
        (canonical_contract, snapshot_contract, compute_sha256(canonical_contract)),
    ]

    for item in contract.get("artifacts", []):
        src_rel = item["template"]
        sha = item["sha256"]
        canonical_file = os.path.join(repo_root, src_rel)
        basename = os.path.basename(src_rel)
        if "templates" in src_rel:
            snapshot_file = os.path.join(
                repo_root, "python", "src", "specly_cli", "assets", "templates", basename
            )
        else:
            snapshot_file = os.path.join(
                repo_root, "python", "src", "specly_cli", "assets", basename
            )
        mappings.append((canonical_file, snapshot_file, sha))

    return mappings


def check_assets(repo_root: str) -> bool:
    """Verify that snapshot assets match canonical assets and expected fingerprints."""
    mappings = get_asset_mappings(repo_root)
    mismatches = []

    for canonical, snapshot, expected_sha in mappings:
        if not os.path.exists(canonical):
            mismatches.append(f"Canonical source missing: {canonical}")
            continue

        canonical_sha = compute_sha256(canonical)
        if canonical_sha != expected_sha:
            mismatches.append(
                f"Canonical source SHA mismatch for {os.path.basename(canonical)}: expected {expected_sha}, got {canonical_sha}"
            )

        if not os.path.exists(snapshot):
            mismatches.append(f"Snapshot file missing: {snapshot}")
            continue

        snapshot_sha = compute_sha256(snapshot)
        if snapshot_sha != canonical_sha:
            mismatches.append(
                f"Snapshot mismatch for {os.path.basename(snapshot)}: snapshot SHA {snapshot_sha} != canonical SHA {canonical_sha}"
            )

    if mismatches:
        print("Asset verification failed with mismatches:\n", file=sys.stderr)
        for m in mismatches:
            print(f"  - {m}", file=sys.stderr)
        return False

    print(f"Assets are synchronized ({len(mappings)} verified).")
    return True


def sync_assets(repo_root: str) -> None:
    """Synchronize assets from canonical sources into snapshots."""
    mappings = get_asset_mappings(repo_root)

    for canonical, snapshot, expected_sha in mappings:
        if not os.path.exists(canonical):
            raise FileNotFoundError(f"Canonical source missing: {canonical}")

        canonical_sha = compute_sha256(canonical)
        if canonical_sha != expected_sha:
            raise ValueError(
                f"Canonical source fingerprint mismatch for {canonical}: expected {expected_sha}, got {canonical_sha}"
            )

        os.makedirs(os.path.dirname(snapshot), exist_ok=True)
        shutil.copyfile(canonical, snapshot)
        print(f"Synced: {os.path.relpath(snapshot, repo_root)}")

    print(f"\nSuccessfully synchronized {len(mappings)} assets.")


def main() -> int:
    # Determine repo root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    check_only = "--check" in sys.argv

    if check_only:
        success = check_assets(repo_root)
        return 0 if success else 1
    else:
        sync_assets(repo_root)
        return 0


if __name__ == "__main__":
    sys.exit(main())
