# How to Use SDD (Spec-Driven Development)

**Author:** [davidops](https://www.npmjs.com/~davidops)

This package scaffolds the minimum structure for **Spec-Driven Development**: specifications that guide the AI agent before writing code.

## Quick Start

From any project root:

```bash
npx specly
```

This creates the 4 base spec files adapted to the agent detected in your project, plus a copy of this guide inside your IDE workspace.

## The 4 Generated Files

| File              | Role        | Contents                                      |
|-------------------|-------------|-----------------------------------------------|
| `requirements.md` | The **what** | User stories + testable EARS criteria        |
| `design.md`       | The **how**  | 6 fixed sections + Mermaid diagrams          |
| `tasks.md`        | The **order**| Checklist with max 2 hierarchy levels      |
| `steering.md`     | Context     | Stack, rules, and project conventions        |

## Workflow

```
Idea → Requirements → Design → Tasks → Build → Validate
```

1. Write `requirements.md` with user stories and EARS criteria.
2. Design the solution in `design.md` (6 sections).
3. Break work into `tasks.md` (checkboxes).
4. Keep `steering.md` updated with project context.
5. Ask the agent to execute tasks one by one, validating against EARS.

**Golden rule:** when something changes, fix the spec first — do not patch code.

## Supported Agents

The CLI auto-detects the agent from existing project folders:

| Agent       | Flag                  | Specs path                     | Steering              |
|-------------|-----------------------|--------------------------------|-----------------------|
| Generic     | `--agent generic`     | `specs/`                       | `specs/steering.md`   |
| Cursor      | `--agent cursor`      | `.cursor/specs/<feature>/`    | `.cursor/steering.md` |
| Kiro        | `--agent kiro`        | `.kiro/specs/<feature>/`      | `.kiro/steering.md`   |
| VS Code     | `--agent vscode`      | `.vscode/specs/<feature>/`    | `.vscode/steering.md` |
| Antigravity | `--agent antigravity` | `.agent/specs/<feature>/`     | `.agent/steering.md`  |
| Windsurf    | `--agent windsurf`    | `.windsurf/specs/<feature>/`  | `.windsurf/steering.md` |
| Claude Code | `--agent claude`      | `.claude/specs/<feature>/`    | `.claude/steering.md` |

### Examples

```bash
# Auto-detect
npx specly

# Cursor with feature "auth"
npx specly --agent cursor --feature auth

# Kiro with feature "payments"
npx specly --agent kiro -n payments

# Generic structure (works in any editor)
npx specly --agent generic

# List all agents
npx specly --list
```

## CLI Options

```
npx specly [options]

  -a, --agent <name>      Force target agent
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show help
```

## EARS Criteria (Templates)

Use these keywords in `requirements.md` for testable criteria:

| Keyword     | Use case                         | Example                                                        |
|-------------|----------------------------------|----------------------------------------------------------------|
| `WHEN`      | Trigger event                    | `WHEN the user saves THE SYSTEM SHALL persist the data`        |
| `IF...THEN` | Undesired condition / error      | `IF the title is empty THEN THE SYSTEM SHALL show an error`    |
| `WHILE`     | Continuous state                 | `WHILE filters are active THE SYSTEM SHALL filter results`     |
| `WHERE`     | Location context                 | `WHERE the user is admin THE SYSTEM SHALL show the panel`      |

## Prompting Your Agent

Once files are generated, use prompts like:

```
Read specs/requirements.md and specs/design.md.
Execute task 1.1 from tasks.md.
Validate the result against the EARS criteria.
```

For agents with per-feature folders:

```
Read .cursor/specs/auth/requirements.md and execute task 2.1 from tasks.md.
```

## Security

- AI-generated code is a **draft**, not a deliverable.
- Verify: does it compile? do tests pass? does it meet EARS criteria?
- Never commit secrets. Use environment variables or Secrets Manager.

## Global Install (Optional)

```bash
npm install -g specly
specly --agent cursor --feature my-feature
```

On install, this guide is copied into your project and opened in your IDE.

---

**First time?** Open `requirements.md` and replace the placeholders with your real feature.
