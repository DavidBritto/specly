"""Layout detection and resolution for supported agent configurations."""

import os
import re

AGENT_KEYS = ["generic", "agents", "cursor", "kiro", "vscode", "antigravity", "windsurf", "claude"]

AGENT_LABELS = {
    "generic": "Generic",
    "agents": "Agents (Universal)",
    "cursor": "Cursor",
    "kiro": "Kiro",
    "vscode": "VS Code / Copilot",
    "antigravity": "Antigravity",
    "windsurf": "Windsurf",
    "claude": "Claude Code",
}

FEATURE_REGEX = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")


class LayoutError(Exception):
    """Raised when layout resolution or safety checks fail."""
    pass


def detect_agent(root: str) -> str:
    """Detect agent from existing project markers in root."""
    if os.path.exists(os.path.join(root, ".agents")) or os.path.exists(
        os.path.join(root, "AGENTS.md")
    ) or os.path.exists(os.path.join(root, "agents.md")):
        return "agents"
    if os.path.exists(os.path.join(root, ".cursor")):
        return "cursor"
    if os.path.exists(os.path.join(root, ".kiro")):
        return "kiro"
    if os.path.exists(os.path.join(root, ".vscode")) or os.path.exists(
        os.path.join(root, ".github", "copilot-instructions.md")
    ):
        return "vscode"
    if os.path.exists(os.path.join(root, ".agent")) or os.path.exists(
        os.path.join(root, ".antigravity")
    ):
        return "antigravity"
    if os.path.exists(os.path.join(root, ".windsurf")):
        return "windsurf"
    if os.path.exists(os.path.join(root, "CLAUDE.md")) or os.path.exists(
        os.path.join(root, ".claude")
    ):
        return "claude"
    return "generic"


def resolve_layout(agent: str, feature: str, root: str, layouts: dict = None) -> dict:
    """Resolve and validate layout paths for an agent and feature."""
    if not feature or not FEATURE_REGEX.match(feature) or ".." in feature or "/" in feature or "\\" in feature:
        raise LayoutError(f"Invalid or unsafe feature name: {feature!r}")

    if not agent:
        agent = detect_agent(root)
    elif agent not in AGENT_KEYS:
        raise LayoutError(f"Unknown agent: {agent!r}")

    # Default layout mappings conforming to artifact-contract-v1
    layout_defs = layouts or {
        "generic": {"specsDir": "specs", "steeringDir": "specs", "agentDir": "specs"},
        "agents": {"specsDir": ".agents/specs/{feature}", "steeringDir": ".agents", "agentDir": ".agents"},
        "cursor": {"specsDir": ".cursor/specs/{feature}", "steeringDir": ".cursor", "agentDir": ".cursor"},
        "kiro": {"specsDir": ".kiro/specs/{feature}", "steeringDir": ".kiro", "agentDir": ".kiro"},
        "vscode": {"specsDir": ".vscode/specs/{feature}", "steeringDir": ".vscode", "agentDir": ".vscode"},
        "antigravity": {"specsDir": ".agent/specs/{feature}", "steeringDir": ".agent", "agentDir": ".agent"},
        "windsurf": {"specsDir": ".windsurf/specs/{feature}", "steeringDir": ".windsurf", "agentDir": ".windsurf"},
        "claude": {"specsDir": ".claude/specs/{feature}", "steeringDir": ".claude", "agentDir": ".claude"},
    }

    if agent not in layout_defs:
        raise LayoutError(f"Layout definition missing for agent: {agent}")

    conf = layout_defs[agent]
    real_root = os.path.realpath(root)

    resolved = {
        "agent": agent,
        "label": AGENT_LABELS.get(agent, agent.title()),
        "feature": feature,
        "specsDir": os.path.join(root, conf["specsDir"].replace("{feature}", feature)),
        "steeringDir": os.path.join(root, conf["steeringDir"]),
        "agentDir": os.path.join(root, conf["agentDir"]),
        "relativeSpecsDir": conf["specsDir"].replace("{feature}", feature),
        "steeringInSpecs": conf["steeringDir"] == conf["specsDir"].replace("{feature}", feature),
    }

    # Safety checks: ensure resolved paths are inside root and no symlink escapes root
    for key in ["specsDir", "steeringDir", "agentDir"]:
        target_path = resolved[key]
        rel = os.path.relpath(target_path, root)
        if rel.startswith("..") or os.path.isabs(rel):
            raise LayoutError(f"Path escape detected in layout for {key}: {target_path}")

        # Check existing parent or target if it's a symlink pointing outside root
        curr = target_path
        while curr and curr != root:
            if os.path.islink(curr):
                link_dest = os.path.realpath(curr)
                if not (link_dest == real_root or link_dest.startswith(real_root + os.sep)):
                    raise LayoutError(f"Symlink escape detected: {curr} points to {link_dest}")
            parent = os.path.dirname(curr)
            if parent == curr:
                break
            curr = parent

    return resolved
