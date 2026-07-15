# Verification

> **Done checklist.** Validate the implementation against requirements, design, and tasks.
> Run this after implementation and before marking tasks as complete.

## 1. Requirements Traceability

For each user story in `requirements.md`:

- [ ] All EARS criteria pass (WHEN / IF...THEN / WHILE / WHERE / AS SOON AS)
- [ ] Ambiguity checklist is resolved
- [ ] Edge cases are handled (empty state, error state, boundary values)

## 2. Design Compliance

- [ ] Architecture matches `design.md` decisions
- [ ] Data models match the defined schema
- [ ] Error handling covers all documented scenarios
- [ ] Security controls are in place (auth, secrets, data protection)
- [ ] Tests from design.md pass

## 3. Code Quality

- [ ] No secrets, API keys, or credentials in the code
- [ ] No debug code, console.log, or TODO left behind
- [ ] Linter / formatter passes
- [ ] Diff reviewed and approved

## 4. Task Completion

- [ ] Every task in `tasks.md` is checked and verified
- [ ] Commits are atomic and follow the project convention
- [ ] No task was marked done without verification

## 5. Final Sign-Off

- [ ] Build / compilation passes
- [ ] Tests pass (`npm test` or equivalent)
- [ ] If applicable: CI pipeline is green
- [ ] `steering.md` is up to date with any new conventions

---

**Rule:** If any box is unchecked, do not close the feature. Fix it first.
