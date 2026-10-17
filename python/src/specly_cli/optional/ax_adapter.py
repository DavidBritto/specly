"""Optional Google AX cluster adapter for offline diagnostics and effect preview."""

from dataclasses import dataclass, field
import datetime
import hashlib
import json
import shutil
from typing import Any, Callable, Dict, List, Optional

AX_COMPATIBILITY_STATUS = "unverified"
AX_DOCUMENTED_EVIDENCE = (
    "Google AX (github.com/google/ax) prerelease. Local prerequisites: kubectl, ko, go, container registry."
)
REQUIRED_PREREQUISITES = ["kubectl", "ko", "go"]


class AxAdapterError(Exception):
    """Raised when AX validation, prerequisite checks, or approval matching fails."""
    pass


@dataclass
class AxPrerequisiteResult:
    prerequisites: Dict[str, bool]
    missing: List[str]
    ready: bool
    actionable_diagnostic: str
    compatibility_status: str = AX_COMPATIBILITY_STATUS


@dataclass
class AxPreview:
    cluster_context: str
    namespace: str
    operation: str
    resource_targets: List[str]
    proposed_effects: List[str]
    compatibility_evidence: str
    approval_digest: str
    created_at: str
    is_mutation: bool


def check_prerequisites(binaries_checker: Optional[Callable[[str], bool]] = None) -> AxPrerequisiteResult:
    """Check local required binaries without cluster probing or credential inspection."""
    checker = binaries_checker or (lambda name: shutil.which(name) is not None)
    results = {}
    missing = []

    for name in REQUIRED_PREREQUISITES:
        found = bool(checker(name))
        results[name] = found
        if not found:
            missing.append(name)

    ready = len(missing) == 0
    if ready:
        diag = "All local AX prerequisites detected (kubectl, ko, go). Cluster status remains unverified."
    else:
        missing_str = ", ".join(missing)
        diag = (
            f"Actionable prerequisite blockers: missing [{missing_str}]. "
            "Install required tooling before attempting AX operations."
        )

    return AxPrerequisiteResult(
        prerequisites=results,
        missing=missing,
        ready=ready,
        actionable_diagnostic=diag,
        compatibility_status=AX_COMPATIBILITY_STATUS,
    )


def compute_preview_digest(
    cluster_context: str,
    namespace: str,
    operation: str,
    resource_targets: List[str],
    proposed_effects: List[str],
    compatibility_evidence: str,
) -> str:
    payload = {
        "cluster_context": cluster_context,
        "namespace": namespace,
        "operation": operation,
        "resource_targets": sorted(resource_targets),
        "proposed_effects": sorted(proposed_effects),
        "compatibility_evidence": compatibility_evidence,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def generate_ax_preview(
    cluster_context: str,
    namespace: str,
    operation: str,
    resource_targets: List[str],
    proposed_effects: List[str],
    compatibility_evidence: str = AX_DOCUMENTED_EVIDENCE,
) -> AxPreview:
    """Generate read-only immutable effect preview and approval digest."""
    digest = compute_preview_digest(
        cluster_context=cluster_context,
        namespace=namespace,
        operation=operation,
        resource_targets=resource_targets,
        proposed_effects=proposed_effects,
        compatibility_evidence=compatibility_evidence,
    )
    is_mutation = operation.lower() in {"apply", "create", "delete", "update", "patch"}
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return AxPreview(
        cluster_context=cluster_context,
        namespace=namespace,
        operation=operation,
        resource_targets=resource_targets,
        proposed_effects=proposed_effects,
        compatibility_evidence=compatibility_evidence,
        approval_digest=digest,
        created_at=created_at,
        is_mutation=is_mutation,
    )


def submit_ax_operation(
    preview: AxPreview,
    approval_digest: str,
    destination_auth: Dict[str, str],
    submit_fn: Optional[Callable[[AxPreview], Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Submit an AX cluster operation after explicit approval bound to the preview."""
    if not approval_digest:
        raise AxAdapterError("Approval digest required: cluster submission requires affirmative approval.")

    if approval_digest != preview.approval_digest:
        raise AxAdapterError(
            f"Approval digest mismatch: expected {preview.approval_digest}, got {approval_digest}. "
            "A fresh preview and approval are required."
        )

    required_auth_keys = {"destination", "operation", "credential_session"}
    if not required_auth_keys.issubset(destination_auth.keys()) or not all(
        destination_auth[k] for k in required_auth_keys
    ):
        raise AxAdapterError(
            f"Missing explicit authorization: must provide destination, operation, and credential_session. "
            f"Provided keys: {list(destination_auth.keys())}"
        )

    if submit_fn:
        return submit_fn(preview)

    # Offline / unverified default: do not contact real cluster
    return {
        "status": "dry_run_recorded",
        "digest": preview.approval_digest,
        "message": "Operation approved and recorded. Real cluster submission requires external provider session.",
    }
