<p align="center">
  <strong>specly</strong><br>
  <em>Spec-Driven Development scaffolding for AI agents</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/specly">npm</a> ·
  <a href="./how-to-use.md">Documentation</a> ·
  <a href="./LICENSE">MIT License</a>
</p>

---

<br>

## ◆ The Problem

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

<br>

---

<br>

## ◆ The Solution

**specly** scaffolds a standard Spec-Driven Development workspace in seconds.

One command. Four files. Any AI agent.

```bash
npx specly
```

```
Idea → Requirements → Design → Tasks → Build → Validate
```

Instead of improvising prompts, you get a versioned spec that guides the agent **before** a single line of code is written.

<br>

---

<br>

## ◆ What It Generates

| File | Role | Contents |
|------|------|----------|
| `requirements.md` | The **what** | User stories + testable EARS criteria |
| `design.md` | The **how** | 6 fixed sections + Mermaid diagrams |
| `tasks.md` | The **order** | Checklist, max 2 hierarchy levels |
| `steering.md` | Context | Stack, rules, and agent conventions |

A copy of `how-to-use.md` is placed in your project and opened in your IDE.

<br>

---

<br>

## ◆ Supported Agents

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

<br>

---

<br>

## ◆ Quick Start

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

<br>

---

<br>

## ◆ CLI Options

```
npx specly [options]

  -a, --agent <name>      Target agent
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show help
```

<br>

---

<br>

## ◆ Development

```bash
git clone <repo-url>
cd specly
npm test
npm link          # test locally: specly
```

<br>

---

<br>

## ◆ Credits

Created by **[davidops](https://www.npmjs.com/~davidops)**

<br>

---

<br>

<p align="center">
  <sub>MIT License · specly — because specs should come before code</sub>
</p>
