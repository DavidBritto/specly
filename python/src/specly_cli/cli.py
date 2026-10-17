"""Specly CLI implementation in Python."""

import argparse
import os
import re
import shutil
import sys
from typing import List, Optional

from specly_cli.contract import (
    compute_sha256,
    load_contract,
    resolve_artifacts,
    ContractError,
)
from specly_cli.layout import AGENT_KEYS, AGENT_LABELS, detect_agent, resolve_layout, LayoutError


def print_help() -> None:
    agents = ", ".join(AGENT_KEYS)
    print(f"""
specly — Spec-Driven Development scaffolding (Python CLI)

Usage:
  specly [options]
  specly init [options]
  specly doctor
  specly plan <feature>
  specly verify <feature>

Commands:
  init                    Create the SDD files (default)
  doctor                  Check runtime, agent, and template readiness without changing files
  plan <feature>          Show proposed local writes and effects without executing them
  verify <feature>        Inspect local artifacts and report observed workflow evidence

Options:
  -a, --agent <name>      Target agent ({agents})
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show this help

Note:
  run and recover are not supported in the Python CLI.
""")


def print_agents() -> None:
    print("\nSupported agents:\n")
    for key in AGENT_KEYS:
        print(f"  {key.ljust(14)} {AGENT_LABELS.get(key, key)}")
    print("\nWithout --agent, the CLI auto-detects from project folders.")


def run_doctor(root: str) -> int:
    contract = load_contract()
    agent = detect_agent(root)
    py_ver = sys.version_info
    runtime_ready = py_ver.major == 3 and py_ver.minor >= 10

    artifacts = contract.get("artifacts", [])
    missing_templates = []
    for item in artifacts:
        from specly_cli.contract import get_packaged_template_path
        tpl_path = get_packaged_template_path(item["template"])
        if not os.path.exists(tpl_path) or compute_sha256(tpl_path) != item["sha256"]:
            missing_templates.append(item["id"])

    template_ready = len(missing_templates) == 0

    print("Specly doctor — read-only readiness check (Python)\n")
    print(f"Runtime:   {'ready' if runtime_ready else 'unsupported'} (Python {sys.version.split()[0]}; requires >=3.10)")
    print(f"Agent:     ready ({agent}{' fallback' if agent == 'generic' else ' detected'})")
    print(f"Templates: {'ready' if template_ready else 'incomplete'} ({len(artifacts)} packaged templates verified)")
    if missing_templates:
        print(f"Missing:   {', '.join(missing_templates)}")

    return 0 if (runtime_ready and template_ready) else 1


def run_plan(feature: str, root: str, agent: Optional[str] = None) -> int:
    contract = load_contract()
    if not agent:
        agent = detect_agent(root)
    layout = resolve_layout(agent, feature, root, layouts=contract.get("layouts"))
    artifacts = resolve_artifacts(contract, agent, feature, root)

    print(f"Specly plan — {feature} (read-only; nothing is executed)\n")
    print(f"Agent: {layout['label']} ({layout['agent']})")
    print(f"Feature specs: {layout['relativeSpecsDir']}/\n")
    print("Proposed local file writes:")
    for art in artifacts:
        target = art["target_path"]
        rel = art["relative_target"]
        state = "preserve existing file" if os.path.exists(target) else "create if init is separately approved"
        print(f"  {state}: {rel} ({art['file']})")

    print("\nDependency changes: none.")
    print("External commands: none.")
    print("Permissions: this plan reads local paths only; a later init would need write access to the listed missing paths.")
    print("Network, credentials, and IDE launch: none.")
    return 0


def checkbox_state(content: str) -> str:
    matches = re.findall(r"^\s*- \[([ xX])\]", content, flags=re.MULTILINE)
    if not matches:
        return "unavailable"
    return "passed" if all(m.lower() == "x" for m in matches) else "failed"


def run_verify(feature: str, root: str, agent: Optional[str] = None) -> int:
    contract = load_contract()
    if not agent:
        agent = detect_agent(root)
    layout = resolve_layout(agent, feature, root, layouts=contract.get("layouts"))
    artifacts = resolve_artifacts(contract, agent, feature, root)

    checks = []
    tasks_content = ""
    verification_content = ""

    for art in artifacts:
        target = art["target_path"]
        rel = art["relative_target"]
        if os.path.exists(target):
            try:
                with open(target, "r", encoding="utf-8") as f:
                    content = f.read()
                checks.append({"label": f"{art['file']} exists and is readable", "status": "passed"})
                if art["file"] == "tasks.md":
                    tasks_content = content
                elif art["file"] == "verification.md":
                    verification_content = content
            except Exception:
                checks.append({"label": f"{art['file']} exists and is readable", "status": "unavailable"})
        else:
            checks.append({"label": f"{art['file']} exists and is readable", "status": "failed"})

    checks.append({
        "label": "tasks.md checklist is complete",
        "status": checkbox_state(tasks_content) if tasks_content else "unavailable",
    })
    checks.append({
        "label": "verification.md checklist is complete",
        "status": checkbox_state(verification_content) if verification_content else "unavailable",
    })
    checks.append({"label": "requirements/design acceptance evidence", "status": "unavailable"})
    checks.append({"label": "External test commands", "status": "skipped"})

    counts = {s: sum(1 for c in checks if c["status"] == s) for s in ["passed", "failed", "skipped", "unavailable"]}

    print(f"Specly verify — {feature} (read-only; no commands run)\n")
    print(f"Agent: {layout['label']} ({layout['agent']})")
    for check in checks:
        print(f"  {check['status'].upper().ljust(11)} {check['label']}")
    print(
        f"\nSummary: {counts['passed']} passed, {counts['failed']} failed, {counts['skipped']} skipped, {counts['unavailable']} unavailable."
    )
    print("Progress is read from durable tasks.md checkboxes. This report is not persisted; acceptance evidence requires project-specific checks.")
    return 0


def run_init(agent: Optional[str], feature: str, force: bool, root: str) -> int:
    contract = load_contract()
    if not agent:
        agent = detect_agent(root)
    layout = resolve_layout(agent, feature, root, layouts=contract.get("layouts"))
    artifacts = resolve_artifacts(contract, agent, feature, root)

    print(f"\n🤖 Agent:  {layout['label']} ({layout['agent']})")
    print(f"📂 Feature: {layout['feature']}")
    print(f"📁 Specs:   {layout['relativeSpecsDir']}/\n")

    created = 0
    for art in artifacts:
        target = art["target_path"]
        template = art["template_path"]
        rel = art["relative_target"]

        os.makedirs(os.path.dirname(target), exist_ok=True)

        if os.path.exists(target) and not force:
            existing_sha = compute_sha256(target)
            if existing_sha == art["sha256"]:
                print(f"⚠️  Already exists, skipping: {rel}")
            else:
                print(f"⚠️  File differs from template, skipping without --force: {rel}")
            continue

        shutil.copyfile(template, target)
        print(f"✅ Created: {rel}")
        created += 1

    print("\n🚀 SDD initialized.")
    print(f"   Start with: {layout['relativeSpecsDir']}/requirements.md")
    if not layout["steeringInSpecs"]:
        print(f"   Context:    {os.path.relpath(layout['steeringDir'], root)}/steering.md")
    print(f"   Guide:      {os.path.relpath(layout['agentDir'], root)}/how-to-use.md")
    return 0


def main(argv: Optional[List[str]] = None, root: Optional[str] = None) -> int:
    if argv is None:
        argv = sys.argv[1:]
    if root is None:
        root = os.getcwd()

    if not argv:
        command = "init"
        cmd_args = []
    elif argv[0] in ["init", "doctor", "plan", "verify", "run", "recover"]:
        command = argv[0]
        cmd_args = argv[1:]
    elif argv[0].startswith("-"):
        command = "init"
        cmd_args = argv
    else:
        # Check for unknown command
        print(f"Error: Unknown command '{argv[0]}'", file=sys.stderr)
        print_help()
        sys.exit(1)

    if command in ["run", "recover"]:
        print(
            f"Error: 'specly {command}' is not supported in the Python CLI distribution.\n"
            "Action execution and recovery are currently provided by the Node CLI (npx specly).",
            file=sys.stderr,
        )
        sys.exit(1)

    if command == "doctor":
        if "--help" in cmd_args or "-h" in cmd_args:
            print("Usage: specly doctor\n\nChecks runtime, agent, and template readiness without writing files.")
            return 0
        return run_doctor(root)

    if command == "plan":
        if not cmd_args or cmd_args[0].startswith("-"):
            print("Usage: specly plan <feature>", file=sys.stderr)
            sys.exit(1)
        feature = cmd_args[0]
        return run_plan(feature, root)

    if command == "verify":
        if not cmd_args or cmd_args[0].startswith("-"):
            print("Usage: specly verify <feature>", file=sys.stderr)
            sys.exit(1)
        feature = cmd_args[0]
        return run_verify(feature, root)

    # init command parsing
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("-a", "--agent", dest="agent", default=None)
    parser.add_argument("-n", "--feature", "--name", dest="feature", default="starter")
    parser.add_argument("-f", "--force", dest="force", action="store_true")
    parser.add_argument("-l", "--list", dest="list", action="store_true")
    parser.add_argument("-h", "--help", dest="help", action="store_true")

    parsed, remaining = parser.parse_known_args(cmd_args)
    if parsed.help:
        print_help()
        return 0
    if parsed.list:
        print_agents()
        return 0

    return run_init(parsed.agent, parsed.feature, parsed.force, root)
