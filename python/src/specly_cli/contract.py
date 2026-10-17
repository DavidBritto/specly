"""Contract loading, validation, and artifact resolution."""

import hashlib
import json
import os
from typing import Any, Dict, List

from specly_cli.layout import resolve_layout

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
DEFAULT_CONTRACT_PATH = os.path.join(ASSETS_DIR, "artifact-contract-v1.json")


class ContractError(Exception):
    """Raised when artifact contract validation or template fingerprint fails."""
    pass


def load_contract(path: str = DEFAULT_CONTRACT_PATH) -> Dict[str, Any]:
    """Load contract JSON file."""
    if not os.path.exists(path):
        raise ContractError(f"Contract file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    validate_contract(data)
    return data


def validate_contract(data: Dict[str, Any]) -> None:
    """Validate contract name, schema version, and structure."""
    if data.get("contract") != "specly-generated-artifacts":
        raise ContractError(f"Unsupported contract name: {data.get('contract')}")
    if data.get("schemaVersion") != 1:
        raise ContractError(f"Unsupported contract schema version: {data.get('schemaVersion')}")
    if "artifacts" not in data or "layouts" not in data:
        raise ContractError("Invalid contract: missing 'artifacts' or 'layouts' sections")


def get_packaged_template_path(template_name: str) -> str:
    """Resolve packaged template path within assets directory."""
    # Maps src/templates/foo.md -> assets/templates/foo.md
    # Maps how-to-use.md -> assets/how-to-use.md
    basename = os.path.basename(template_name)
    if "templates" in template_name:
        path = os.path.join(ASSETS_DIR, "templates", basename)
    else:
        path = os.path.join(ASSETS_DIR, basename)
    return path


def compute_sha256(file_path: str) -> str:
    """Calculate SHA-256 hex digest of file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def resolve_artifacts(contract: Dict[str, Any], agent: str, feature: str, root: str) -> List[Dict[str, Any]]:
    """Resolve and verify all artifacts for an agent layout and feature."""
    validate_contract(contract)
    layout = resolve_layout(agent, feature, root, layouts=contract.get("layouts"))
    artifacts_result = []

    for item in contract.get("artifacts", []):
        artifact_id = item["id"]
        dir_key = item["directory"]
        file_name = item["file"]
        expected_sha = item["sha256"]
        template_ref = item["template"]

        dir_path = layout.get(dir_key)
        if not dir_path:
            raise ContractError(f"Layout does not define directory key '{dir_key}' for artifact '{artifact_id}'")

        target_file = os.path.join(dir_path, file_name)
        template_file = get_packaged_template_path(template_ref)

        if not os.path.exists(template_file):
            raise ContractError(f"Packaged template missing for {artifact_id}: {template_file}")

        actual_sha = compute_sha256(template_file)
        if actual_sha != expected_sha:
            raise ContractError(
                f"Packaged template fingerprint mismatch for {artifact_id}: expected {expected_sha}, got {actual_sha}"
            )

        artifacts_result.append({
            "id": artifact_id,
            "role": item.get("role", ""),
            "file": file_name,
            "target_path": target_file,
            "relative_target": os.path.relpath(target_file, root),
            "template_path": template_file,
            "sha256": expected_sha,
            "ownership": item.get("ownership", "user"),
        })

    return artifacts_result
