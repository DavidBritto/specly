# Tasks

> Define the **order** of implementation. Max 2 hierarchy levels. Each task references its Requirements.

- [ ] 1. [Main task — references User Story 1]
  - [ ] 1.1 [Verifiable sub-task — small enough to review in one pass]
  - [ ] 1.2 [Verifiable sub-task]

- [ ] 2. [Main task — references User Story 2]
  - [ ] 2.1 [Verifiable sub-task]
  - [ ] 2.2 [Verifiable sub-task]

- [ ] 3. Validation and wrap-up
  - [ ] 3.1 Verify EARS criteria from requirements.md
  - [ ] 3.2 Run tests defined in design.md
  - [ ] 3.3 Security review: no secrets leaked, proper auth checks
  - [ ] 3.4 Update steering.md if new conventions emerged

---

## Rules

### Task Slicing
- If a task has more than 5 sub-steps, split it into smaller tasks.
- One task = one logical change. If it does two unrelated things, split it.
- Each task should feel like "I know exactly what to do here."

### Atomic Commits
- One commit per checked task (when possible).
  ```
  feat(auth): implement login validation
  ```
- If a task spans multiple files but is one logical change, it is still one commit.
- Mark `[x]` only when the task is verified (tested + reviewed).
- Never commit secrets, API keys, or credentials.

### Traceability
- Every task references a requirement or design section.
- If a task does not trace back to a requirement, does it belong here?
- After all tasks are done, run verification.md against the implementation.
