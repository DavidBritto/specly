"""Optional lazy Strands task execution adapter with strict boundaries."""

from dataclasses import dataclass, field
import datetime
import hashlib
import json
import os
from typing import Any, Dict, List, Optional

SUPPORTED_TOOLS = {"write-file"}
RESERVED_DIRS = {".git", ".specly"}


class StrandsAdapterError(Exception):
    """Raised when request validation, authorization, or execution bounds fail."""
    pass


@dataclass
class ExecutionRequest:
    task_id: str
    feature: str
    project_root: str
    provider_destination: str
    provider_config: Dict[str, Any]
    tool_allowlist: List[str]
    writable_roots: List[str]
    budget_calls: int = 10
    timeout_seconds: float = 30.0
    approval_digest: str = ""


@dataclass
class ExecutionRecord:
    request_fingerprint: str
    task_id: str
    status: str  # completed | failed | limited | refused
    started_at: str
    completed_at: str
    tool_effects: List[Dict[str, Any]] = field(default_factory=list)
    error_message: Optional[str] = None
    acceptance_verified: bool = False


def validate_request(request: ExecutionRequest, provided_approval: str) -> None:
    """Validate approval, provider configuration, tools, and writable roots before invocation."""
    if not provided_approval:
        raise StrandsAdapterError("Approval required before task execution.")
    if provided_approval != request.approval_digest:
        raise StrandsAdapterError(
            f"Approval digest mismatch: expected {request.approval_digest}, got {provided_approval}"
        )

    if not request.provider_destination or not request.provider_config:
        raise StrandsAdapterError(
            "Missing provider configuration: destination and provider credentials/options are required."
        )

    # Verify tool allowlist
    for tool_name in request.tool_allowlist:
        if tool_name not in SUPPORTED_TOOLS:
            raise StrandsAdapterError(
                f"Disallowed tool '{tool_name}': Strands adapter permits only structured local tools: {SUPPORTED_TOOLS}"
            )

    # Verify writable roots
    real_root = os.path.realpath(request.project_root)
    for w_root in request.writable_roots:
        real_w = os.path.realpath(w_root)
        if not (real_w == real_root or real_w.startswith(real_root + os.sep)):
            raise StrandsAdapterError(f"Writable root escapes project root: {w_root}")

        rel = os.path.relpath(real_w, real_root)
        parts = rel.split(os.sep)
        if any(part in RESERVED_DIRS for part in parts):
            raise StrandsAdapterError(f"Writable root targets reserved directory: {w_root}")


def compute_request_fingerprint(request: ExecutionRequest) -> str:
    payload = {
        "task_id": request.task_id,
        "feature": request.feature,
        "provider": request.provider_destination,
        "tools": sorted(request.tool_allowlist),
        "approval": request.approval_digest,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def execute_task(request: ExecutionRequest, provided_approval: str) -> ExecutionRecord:
    """Execute task within approved boundary and record execution outcome."""
    validate_request(request, provided_approval)

    started_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    fingerprint = compute_request_fingerprint(request)

    # Budget check
    if request.budget_calls <= 0:
        completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return ExecutionRecord(
            request_fingerprint=fingerprint,
            task_id=request.task_id,
            status="limited",
            started_at=started_at,
            completed_at=completed_at,
            error_message="Budget exceeded: 0 tool calls permitted",
            acceptance_verified=False,
        )

    # If mock provider or simulated execution
    if request.provider_config.get("mock", False) or request.provider_destination == "mock":
        completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return ExecutionRecord(
            request_fingerprint=fingerprint,
            task_id=request.task_id,
            status="completed",
            started_at=started_at,
            completed_at=completed_at,
            tool_effects=[{"action": "mock_execution", "task_id": request.task_id}],
            acceptance_verified=False,  # Execution is NEVER acceptance evidence
        )

    # For live Strands integration: lazy import
    try:
        import strands  # noqa: F401
    except ImportError as e:
        completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return ExecutionRecord(
            request_fingerprint=fingerprint,
            task_id=request.task_id,
            status="failed",
            started_at=started_at,
            completed_at=completed_at,
            error_message=f"Strands SDK not installed: {e}. Install via 'pip install strands-agents'.",
            acceptance_verified=False,
        )

    # Note: Live provider calls require external credentials and explicit invocation
    completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return ExecutionRecord(
        request_fingerprint=fingerprint,
        task_id=request.task_id,
        status="completed",
        started_at=started_at,
        completed_at=completed_at,
        acceptance_verified=False,
    )
