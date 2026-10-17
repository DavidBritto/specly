```text
   _____ ____  ________________  __
  / ___// __ \/ ____/ ____/ /\ \/ /
  \__ \/ /_/ / __/ / /   / /  \  /
 ___/ / ____/ /___/ /___/ /___/ /
/____/_/   /_____/\____/_____/_/
```

**specly** — **Spec-Driven Development** scaffolding for AI agents: requirements, design, tasks, and steering before code.

<p align="center">
  <a href="https://www.npmjs.com/package/specly"><img src="https://img.shields.io/npm/v/specly" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/specly" alt="license"></a>
  <a href="https://www.npmjs.com/package/specly"><img src="https://img.shields.io/node/v/specly" alt="node version"></a>
  <a href="https://github.com/DavidBritto/specly"><img src="https://img.shields.io/github/stars/DavidBritto/specly?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
  <code>npx specly</code>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/specly">npm</a> ·
  <a href="https://github.com/DavidBritto/specly">GitHub</a> ·
  <a href="./how-to-use.md">Documentation</a> ·
  <a href="https://github.com/DavidBritto/specly/issues">Issues</a> ·
  <a href="./LICENSE">MIT License</a>
</p>

---

## Problem 

Building software with AI agents often looks like this:

```
vague prompt → generated code → hope it works
```

That is **vibe coding**: fast at the start, fragile at scale.

| | Vibe Coding | Spec-Driven Development |
|---|---|---|
| **Source of truth** | Ephemeral prompt | Versioned spec |
| **Traceability** | Almost none | Idea → req → task → code → test |
| **Code review** | _"What does this do?"_ | Against EARS acceptance criteria |
| **Best for** | Prototypes, throwaways | Products, teams, long-lived software |

Without structure, every agent session starts from zero. Requirements drift. Tasks are vague. Generated code ships without a clear definition of done.

---

## The Solution

**specly** scaffolds a standard Spec-Driven Development workspace in seconds.

One command. Four files. Any AI agent.

```bash
npx specly
```

```
Idea → Requirements → Design → Tasks → Build → Validate
```

Instead of improvising prompts, you get a versioned spec that guides the agent **before** a single line of code is written.

---

## Why specly?

- **Agent-agnostic** — same structure for Cursor, Kiro, Claude Code, Windsurf, and more.
- **Opinionated but minimal** — four files, no heavy framework.
- **Spec-first** — the agent works against testable criteria, not vibes.

---

## Demo

```bash
$ npx specly --agent cursor --feature auth

🤖 Agent:  Cursor (cursor)
📂 Feature: auth
📁 Specs:   .cursor/specs/auth/

📁 Folder created: .cursor/specs/auth/
✅ Created: .cursor/specs/auth/requirements.md
✅ Created: .cursor/specs/auth/design.md
✅ Created: .cursor/specs/auth/tasks.md
✅ Created: .cursor/steering.md
✅ Created: .cursor/how-to-use.md

🚀 SDD initialized.
   Start with: .cursor/specs/auth/requirements.md
   Context:    .cursor/steering.md
   Guide:      .cursor/how-to-use.md (opened in your IDE)
```

Generated layout:

```
.cursor/
├── how-to-use.md
├── steering.md
└── specs/
    └── auth/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

---

## What It Generates

| File | Role | Contents |
|------|------|----------|
| `requirements.md` | The **what** | User stories + testable EARS criteria |
| `design.md` | The **how** | 6 fixed sections + Mermaid diagrams |
| `tasks.md` | The **order** | Checklist, max 2 hierarchy levels |
| `steering.md` | Context | Stack, rules, and agent conventions |

**EARS** (Easy Approach to Requirements Syntax) gives you structured, testable acceptance criteria using keywords like `WHEN`, `IF...THEN`, `WHILE`, and `WHERE`. See the [EARS reference](./how-to-use.md#ears-criteria-templates) in the full guide.

A copy of `how-to-use.md` is placed in your project and opened in your IDE.

---

## Supported Agents

specly detects your environment and writes files to the standard path for each agent:

| Agent | Command | Specs path | Steering |
|-------|---------|------------|----------|
| Generic | `--agent generic` | `specs/` | `specs/steering.md` |
| Cursor | `--agent cursor` | `.cursor/specs/<feature>/` | `.cursor/steering.md` |
| Kiro | `--agent kiro` | `.kiro/specs/<feature>/` | `.kiro/steering.md` |
| VS Code | `--agent vscode` | `.vscode/specs/<feature>/` | `.vscode/steering.md` |
| Antigravity | `--agent antigravity` | `.agent/specs/<feature>/` | `.agent/steering.md` |
| Windsurf | `--agent windsurf` | `.windsurf/specs/<feature>/` | `.windsurf/steering.md` |
| Claude Code | `--agent claude` | `.claude/specs/<feature>/` | `.claude/steering.md` |

---

## Quick Start

```bash
# Initialize with the original shorthand (still supported)
npx specly

# Use the explicit command
npx specly init --feature auth

# Force agent + feature name
npx specly --agent cursor --feature auth

# List all agents
npx specly --list

# Check local readiness without changing files or opening an IDE
npx specly doctor

# Preview the local files and effects a feature would require
npx specly plan auth

# Inspect generated files and task/checklist progress without running tests
npx specly verify auth

# Inspect and explicitly approve one manifest-declared file creation
npx specly plan auth --task 1.1
npx specly run auth --task 1.1 --approve <approval-digest>
```

**Global install (optional):**

```bash
npm install -g specly
specly --agent kiro -n payments
```

---

## Example Prompt

Once files are generated, point your agent at the spec:

```
Read .cursor/specs/auth/requirements.md and execute task 1.1 from tasks.md.
Validate the result against the EARS criteria.
```

More prompting patterns in [how-to-use.md](./how-to-use.md#prompting-your-agent).

---

## CLI Options

```
npx specly [options]
npx specly init [options]
npx specly doctor

Commands:
  init                    Create SDD files (default; legacy syntax remains supported)
  doctor                  Check Node.js, agent, and template readiness (read-only)
  plan <feature>          List proposed local writes and other effects (read-only)
  run <feature>           Apply one digest-approved manifest write-file action
  recover <feature>       Diagnose/reconcile an interrupted write action
  verify <feature>        Report local artifact and checklist evidence (read-only)

Options for the default/init command:
  -a, --agent <name>      Target agent
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show help
```

`doctor` reports the Node.js version requirement, detected agent (or generic fallback), and bundled template availability. It does not write project files or launch an IDE. Initialization remains safe by default: existing files are skipped unless `--force` is provided.

`plan <feature>` lists the feature's expected spec files, steering file, and guide, marking existing files for preservation and missing files as proposed writes only if `init` is separately run. It also states dependency, external-command, permission, network, credential, and IDE effects; it performs none of them. `verify <feature>` reports whether local spec files are readable and whether task/verification checkboxes are complete. Requirements/design acceptance evidence is unavailable unless checked by project-specific validation, and external test execution is skipped. Progress remains durably represented by `tasks.md`; the verify report itself is not saved.

### Approved local file actions (limited preview)

The first `run` implementation accepts only a user-authored manifest at `.specly/actions/<feature>.json`. It does **not** execute task prose, invoke a model, run shell commands, install dependencies, or provide an operating-system sandbox.

```json
{
  "schemaVersion": 1,
  "feature": "auth",
  "actions": [
    {
      "taskId": "1.1",
      "type": "write-file",
      "path": "src/greeting.txt",
      "content": "Hello\n"
    }
  ]
}
```

The referenced task ID must exist in the feature's `tasks.md`. Planning shows the exact target, content SHA-256, created directories, effects, and an approval digest bound to the project root and current manifest/task bytes. Review that plan, then pass the exact digest to `run`. The action creates **one new file only**; existing targets, traversal, reserved `.git`/`.specly` paths, and symlink ancestors are rejected. The task checkbox is never changed.

Run state and content-hash evidence are recorded atomically under `.specly/runs/`, separate from user-owned specification files. If a process is interrupted, Specly will not retry automatically. Inspect with `specly recover auth --task 1.1`; only after confirming the recorded process has stopped, `--confirm-stopped` reconciles an absent target as interrupted or an exact matching target as completed. A new execution still requires a fresh explicit `run` invocation with approval. This is an auditable local write boundary, not a sandbox against an approved process or concurrent host activity.

Generated artifact paths, template fingerprints, ownership, and update policy are defined in the [artifact contract](./ARTIFACT-CONTRACT.md) and its [machine-readable fixture](./contracts/artifact-contract-v1.json).

---

## Documentation

The full workflow, EARS templates, agent examples, and security notes live in **[how-to-use.md](./how-to-use.md)** — also copied into your project when you run `npx specly`.

---

## Development

```bash
git clone https://github.com/DavidBritto/specly.git
cd specly
npm test
npm link          # test locally: specly
```

---

## Contributing

PRs are welcome. Please run `npm test` before submitting. Open an [issue](https://github.com/DavidBritto/specly/issues) to discuss larger changes first.

---

## Credits

Created by **[davidops](https://www.npmjs.com/~davidops)**

- [npm](https://www.npmjs.com/package/specly)
- [GitHub](https://github.com/DavidBritto)

---

<p align="center">
  <sub>MIT License · specly — because specs should come before code</sub>
</p>
