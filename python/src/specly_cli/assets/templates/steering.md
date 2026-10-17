# Steering

> Persistent project context. The agent should read this file every session.

## Purpose

[Why this project exists and what problem it solves.]

## Principles

- Prioritize clarity over speed.
- Avoid ambiguity in requirements and tasks.
- Treat generated code as a draft until review and tests pass.
- When something changes, fix the spec before patching code.
- Validate before merging: tests + EARS criteria + security review.

## Stack

- [Primary language / framework]
- [Database / services]
- [Build and test tools]
- [Cloud provider / deployment target]

## Project Structure

```
[Relevant folder tree]
```

## Agent Rules

- Read `requirements.md`, `design.md`, `tasks.md`, and `steering.md` before proposing changes.
- If context is missing, ask before inventing.
- Write acceptance criteria in testable format (EARS).
- Split work into small, verifiable tasks.
- Keep traceability between requirements, design, and tasks.
- Run the verification checklist after implementation.

## Conventions

- `requirements.md` → the **what**
- `design.md` → the **how**
- `tasks.md` → the **order**
- `verification.md` → the **done checklist**
- `steering.md` → **context** and rules

## Hooks (Automations)

> Hooks are scripts that run automatically on events (pre-commit, pre-push, post-merge).

- [ ] Pre-commit: lint + format + secret scanner
- [ ] Pre-push: run full test suite
- [ ] Post-merge: update changelog or deploy

Store hook scripts in:
- Kiro: `.kiro/hooks/`
- Generic: `.githooks/`

## MCP / NCP Servers (External Context)

> MCP servers connect the agent to live documentation, APIs, or databases.
> They reduce hallucinations by providing current data instead of relying on training cutoffs.

| Server      | Purpose                  | Source                      |
|-------------|--------------------------|-----------------------------|
| [name]      | [what it provides]       | [URL or package]            |

Example MCP servers from the AWS ecosystem:
- `aws-documentation` — search and read AWS docs
- `aws-pricing` — live pricing lookups
- `aws-iac` — CloudFormation validation + CDK patterns

## Skills (On-Demand Instructions)

> Skills are markdown files activated by keywords. They teach the agent how to do specific tasks.

| Keyword                     | Skill file                  | What it does                  |
|-----------------------------|-----------------------------|-------------------------------|
| `review-pr`                 | `skills/review-pr.md`       | PR template + review steps    |
| [your-keyword]              | `skills/[name].md`          | [description]                 |

Store skills in `.kiro/skills/` (Kiro) or `skills/` (generic).

## Security

- Do not commit secrets to the repository.
- Store credentials in environment variables or secrets manager, never in code.
- Always review the diff before accepting changes.
- Use `.gitignore` (and `.kiroignore` for Kiro) to exclude sensitive files.
- Follow the principle of least privilege for all tokens and roles.
- Enable secret scanning in CI (e.g., GitGuardian, truffleHog).
