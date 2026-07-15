# How to Use SDD (Spec-Driven Development)

**Author:** [davidops](https://www.npmjs.com/~davidops)

This package scaffolds the minimum structure for **Spec-Driven Development**: specifications that guide the AI agent before writing code.

## Quick Start

From any project root:

```bash
npx specly
```

This creates the 5 base spec files adapted to the agent detected in your project, plus a copy of this guide inside your IDE workspace.

## The 5 Generated Files

| File               | Role              | Contents                                                |
|--------------------|-------------------|---------------------------------------------------------|
| `requirements.md`  | The **what**      | User stories + testable EARS criteria + ambiguity hunt  |
| `design.md`        | The **how**       | 7 fixed sections (architecture, components, data, error handling, security, testing) + Mermaid diagrams |
| `tasks.md`         | The **order**     | Checklist with max 2 hierarchy levels + slicing rules + atomic commit guidance |
| `verification.md`  | The **done**      | Post-implementation validation checklist against requirements, design, and code quality |
| `steering.md`      | **Context**       | Stack, rules, hooks, MCP servers, skills, and project conventions |

## Workflow

```
Idea → Requirements → Design → Tasks → Build → Validate
```

1. Write `requirements.md` with user stories and EARS criteria. Hunt for ambiguities before moving on.
2. Design the solution in `design.md` (7 sections — architecture, components, data, error handling, security, testing).
3. Break work into tasks in `tasks.md` (checkboxes). Slice until each task is small and focused.
4. Keep `steering.md` updated with project context, hooks, MCP servers, and conventions.
5. Ask the agent to execute tasks one by one, validating against EARS criteria.
6. Run `verification.md` after implementation — check every box before closing the feature.

**Golden rule:** when something changes, fix the spec first — do not patch code. Validate before merging.

## Hooks (Automations)

Hooks are scripts that run automatically on events (pre-commit, pre-push, etc.).
They catch errors before they reach the repo.

### Example: pre-commit hook that runs tests

For Kiro (`.kiro/hooks/`):

```bash
#!/bin/sh
npm test
```

For generic projects (`.githooks/`), enable with:

```bash
git config core.hooksPath .githooks
```

### Recommended hook pipeline

1. **Pre-commit**: lint + format + secret scanner
2. **Pre-push**: full test suite
3. **Post-merge**: update dependencies or deploy

## MCP / NCP Servers (External Context)

MCP servers connect the agent to live documentation, APIs, or databases.
They reduce hallucinations by providing current data instead of relying on training cutoffs.

### Examples

| Server             | Purpose                        | When to use                              |
|--------------------|--------------------------------|------------------------------------------|
| `aws-documentation` | Search and read AWS docs       | Building on AWS                          |
| `aws-pricing`       | Live pricing lookups           | Cost estimation                          |
| `aws-iac`           | CloudFormation validation + CDK | Infrastructure as Code                   |
| `context7`          | Library docs (React, Next.js, Prisma, etc.) | Using third-party libraries    |
| `websearch`         | General web search             | Latest information not in training data   |

Configure MCP servers in your agent's settings (e.g., `opencode.json` for OpenCode, `.cursor/mcp.json` for Cursor).

## Skills (On-Demand Instructions)

Skills are markdown files activated by keywords. They teach the agent how to do specific tasks without repeating instructions.

### Quick setup

Create `.kiro/skills/review-pr.md` (for Kiro) or `skills/review-pr.md` (generic) with:

```markdown
# Skill: Review PR

Activate when the user says "review this PR" or uses `/review-pr`.

## Steps
1. Read the diff against the base branch
2. Check every file for:
   - Secrets or credentials in code
   - Debug artifacts (console.log, TODO, commented code)
   - Missing error handling
3. Verify EARS criteria from requirements.md are met
4. Report findings as a checklist
```

The agent loads the skill automatically when the keyword is mentioned.

## Supported Agents

The CLI auto-detects the agent from existing project folders:

| Agent       | Flag                  | Specs path                     | Steering              | Hooks path       |
|-------------|-----------------------|--------------------------------|-----------------------|------------------|
| Generic     | `--agent generic`     | `specs/`                       | `specs/steering.md`   | `.githooks/`     |
| Cursor      | `--agent cursor`      | `.cursor/specs/<feature>/`    | `.cursor/steering.md` | —                |
| Kiro        | `--agent kiro`        | `.kiro/specs/<feature>/`      | `.kiro/steering.md`   | `.kiro/hooks/`   |
| VS Code     | `--agent vscode`      | `.vscode/specs/<feature>/`    | `.vscode/steering.md`  | —                |
| Antigravity | `--agent antigravity` | `.agent/specs/<feature>/`     | `.agent/steering.md`   | —                |
| Windsurf    | `--agent windsurf`    | `.windsurf/specs/<feature>/`  | `.windsurf/steering.md` | —                |
| Claude Code | `--agent claude`      | `.claude/specs/<feature>/`    | `.claude/steering.md`  | —                |

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

| Keyword       | Use case                         | Example                                                          |
|---------------|----------------------------------|------------------------------------------------------------------|
| `WHEN`        | Trigger event                    | WHEN the user saves THE SYSTEM SHALL persist the data            |
| `IF...THEN`   | Undesired condition / error      | IF the title is empty THEN THE SYSTEM SHALL show an error        |
| `WHILE`       | Continuous state                 | WHILE filters are active THE SYSTEM SHALL filter results         |
| `WHERE`       | Location context                 | WHERE the user is admin THE SYSTEM SHALL show the panel          |
| `AS SOON AS`  | Time-sensitive response          | AS SOON AS the payment completes THE SYSTEM SHALL send a receipt |

### Ambiguity Hunting

Before accepting requirements, ask:

- What happens when the input is empty? Malformed? Too large?
- Who exactly is "the user"? Anonymous? Authenticated? Admin?
- What does "fast" mean in milliseconds? What does "a few" mean in numbers?
- What happens if an external service is down?

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

For validation after implementation:

```
Read specs/verification.md and run each check against the implementation.
```

## Task Slicing Guidelines

- If a task has more than 5 sub-steps, split it.
- One task = one logical change.
- Each task should feel like "I know exactly what to do here."
- One commit per checked task when possible.
- Mark a task complete only after it is tested and reviewed.

## Security

- AI-generated code is a **draft**, not a deliverable.
- Verify: does it compile? do tests pass? does it meet EARS criteria?
- Never commit secrets. Use environment variables or Secrets Manager.
- Review diffs before accepting agent changes.
- Enable secret scanning in CI (e.g., GitGuardian, truffleHog).
- Use `.gitignore` (and `.kiroignore` for Kiro) to exclude sensitive files.

## Global Install (Optional)

```bash
npm install -g specly
specly --agent cursor --feature my-feature
```

On install, this guide is copied into your project and opened in your IDE.

---

**First time?** Open `requirements.md` and replace the placeholders with your real feature. Then run through the workflow: Requirements → Design → Tasks → Build → Validate.
