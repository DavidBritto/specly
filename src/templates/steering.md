# Steering

> Persistent project context. The agent should read this file every session.

## Purpose

[Why this project exists and what problem it solves.]

## Principles

- Prioritize clarity over speed.
- Avoid ambiguity in requirements and tasks.
- Treat generated code as a draft until review and tests pass.
- When something changes, fix the spec before patching code.

## Stack

- [Primary language / framework]
- [Database / services]
- [Build and test tools]

## Project Structure

```
[Relevant folder tree]
```

## Agent Rules

- Read `requirements.md`, `design.md`, and `tasks.md` before proposing changes.
- If context is missing, ask before inventing.
- Write acceptance criteria in testable format (EARS).
- Split work into small, verifiable tasks.
- Keep traceability between requirements, design, and tasks.

## Conventions

- `requirements.md` → the **what**
- `design.md` → the **how**
- `tasks.md` → the **order**
- `steering.md` → **context** and rules

## Security

- Do not commit secrets to the repository.
- Store credentials in Secrets Manager / environment variables, never in code.
- Always review the diff before accepting changes.
