<p align="center">
  <strong>specly</strong><br>
  <em>Spec-Driven Development scaffolding for AI agents</em>
</p>

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

## The Problem

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
# Auto-detect agent
npx specly

# Force agent + feature name
npx specly --agent cursor --feature auth

# List all agents
npx specly --list
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

  -a, --agent <name>      Target agent
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show help
```

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

- [npm](https://www.npmjs.com/~davidops)
- [GitHub](https://github.com/DavidBritto)

---

<p align="center">
  <sub>MIT License · specly — because specs should come before code</sub>
</p>
