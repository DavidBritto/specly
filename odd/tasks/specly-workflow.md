# Specly workflow implementation

## Objective

Evolve the existing Specly repository into a controlled autonomous SDD workflow while preserving the current npm CLI. Add a Node-free `uvx` distribution, optional Strands and AX integrations, a GitHub Pages presentation site, and release-ready LinkedIn copy.

## Problem and rationale

Specly 1.1.0 scaffolds SDD files but does not orchestrate tasks or verification. Users of non-Node projects should not need to add JavaScript dependencies to their applications. The expansion must preserve existing generated files and make all execution, package changes, and infrastructure effects explicit.

## Scope and constraints

- Repository: `git/specly`; roadmap: `PLAN.md`.
- Keep `npx specly [options]` compatible. New commands must not silently overwrite files or launch tools from `doctor`.
- No package publication, push, pull request, GitHub Pages activation, LinkedIn publication, cluster deployment, or credential use without separate authorization.
- Default to no model provider or agent execution until configured and approved.
- Technical artifacts use English.
- Effective TDD: off (no project or session strict-TDD configuration found); source: repository mapping. Test runner: `npm test` (`node --test test/*.js`). Recheck if configuration appears.
- Delivery strategy: `ask-on-risk`; user selected `feature-branch-chain`. Estimated authored changes: more than 400 lines across the feature. The 400-line figure is a planning heuristic, not a reason to omit tests or compress code.

## Tasks

- [x] **S1 — Preserve and extend the npm CLI.** Capture baseline behavior, add explicit `init` and read-only `doctor`, retain legacy aliases and skip/force semantics, and test Python-project initialization without `package.json`. Route: delegated; trigger: changes to CLI, tests, and docs (2+ non-trivial files). Checks: focused CLI tests, `npm test`, doctor read-only scenario.
- [x] **S2 — Stabilize artifact contract.** Version generated artifacts, document ownership and migration, add cross-runtime conformance fixtures. Route: delegated; trigger: templates, tests, and docs. Checks: fixtures and `npm test`.
- [x] **S3a — Add read-only workflow inspection.** Implement `plan` and `verify` as non-mutating commands that enumerate initialization effects and report only observed local artifact/checklist evidence. Route: delegated; trigger: CLI, tests, and docs. Checks: focused CLI tests, `npm test`, no-write smoke test.
- [ ] **S3b — Add approved task execution and recovery.** Extend the plan to enumerate task-specific effects, require explicit task selection and approval before execution, persist progress and verification evidence, and recover safely after interruption. Route: delegated; trigger: multiple modules and tests. Checks: unit/integration tests, denied-approval and interruption scenarios, one controlled end-to-end task.
- [ ] **S4 — Add Node-free distribution.** Verify PyPI naming, implement Python CLI without an npx dependency, and test equivalent artifacts on supported platforms. Route: delegated; trigger: new package, fixtures, docs. Checks: Python package build, CLI smoke tests, cross-runtime conformance.
- [ ] **S5 — Add optional Strands executor.** Configure provider, budgets, timeouts, tools, and verification; keep it out of target apps by default. Route: delegated; trigger: integration and tests. Checks: controlled local end-to-end task and failure cases.
- [ ] **S6 — Add opt-in AX adapter.** Detect prerequisites, plan manifests, and require separate approval before any cluster mutation. Route: delegated; trigger: integration and tests. Checks: offline diagnostics and dry-run; no live cluster assumed.
- [ ] **S7 — Build presentation site.** Create an accessible dark static site with a terminal demo, accurate availability labels, and GitHub Pages deployment workflow. Route: delegated; trigger: site, tests, and workflow files. Checks: static/link/accessibility checks and local preview.
- [ ] **S8 — Draft launch copy.** Create `content.md` with primary and short LinkedIn posts grounded in shipped features and verified links. Route: delegated if research and editing require broader context; otherwise inline. Checks: claim and link readback.

## Acceptance criteria

- Existing Specly initialization remains compatible and non-destructive by default.
- Autonomous actions are scoped, approved, resumable, and backed by observed verification evidence.
- Python users can run the CLI through `uvx` without Node or `package.json`.
- Strands and AX are optional; AX never mutates a cluster during basic initialization.
- The site and LinkedIn copy never present unreleased capabilities as shipped.

## Progress and evidence

- Tracker branch: `feat/specly-workflow` (created from `main`; no tracker PR opened).
- PR slice 1 branch: `feat/specly-workflow-01-cli`, based on the tracker branch; intended PR base is `feat/specly-workflow`. Future slices will branch from the prior child. No PRs have been created.
- PR slice 2 branch: `feat/specly-workflow-02-contract`, based on slice 1; intended PR base is `feat/specly-workflow-01-cli`. No PRs have been created.
- PR slice 3 branch: `feat/specly-workflow-03-workflow`, based on slice 2; intended PR base is `feat/specly-workflow-02-contract`. No PRs have been created.
- Baseline exploration: current CLI parses bare positional tokens as agents; `doctor` must be routed before legacy parsing. Existing tests disable IDE launch with `SDD_NO_OPEN=1`.
- S1 implementation: `src/index.js`, `test/cli.test.js`, and `README.md` now contain explicit `init`, read-only `doctor`, compatibility coverage, and documentation. Work-unit commit: `2f3d046` (`feat(cli): add explicit init and read-only doctor`). Rollback boundary: revert that work-unit commit; it also contains the initial plan and tracker document.
- S1 checks: writer reported focused CLI tests, `npm test`, manual doctor from a temporary Python project with unchanged target files, and `git diff --check` passed. Parent spot-check `npm test` and `git diff --check` also passed. The writer's pre-edit baseline could not run because sandbox policy returned `EPERM` for subprocess spawning; tests now call the exported CLI entry point in-process.
- S1 review outcome: native assessment was high risk (`process_boundary` in `src/index.js`). User granted candidate review, but all four reviewer captures were unavailable because nested Codex could not initialize on a read-only filesystem. No approval or review findings were produced. At the user's explicit request, receipt-driven development was disabled for this clone; subsequent work follows ordinary checks without review receipts.
- S2 implementation: contract v1 fixture, ownership/migration documentation, npm packaging, and Node conformance tests. Work-unit commit: `48c00f1` (`feat(contract): define versioned generated artifacts`). Rollback boundary: revert that commit only; the S1 CLI remains usable.
- S2 checks: writer baseline and final `npm test`, focused CLI tests, and `git diff --check` passed. Parent spot-check `npm test` passed; `npm pack --dry-run --json` included both the contract document and fixture. Receipt-driven development is disabled for this clone, so no S2 review receipt exists.
- S3a implementation: read-only `plan <feature>` enumerates scaffold writes and explicit non-effects; `verify <feature>` reports artifact readability and checklist status without running tests or persisting a report. Work-unit commit: `b483fdc` (`feat(workflow): add read-only plan and verify commands`). Rollback boundary: revert that commit only; S1 and S2 remain usable.
- S3a checks: writer reported focused CLI tests, `npm test`, `git diff --check`, and no-write smoke passed; parent spot-check `npm test` and `git diff --check` passed. External test execution is intentionally skipped by `verify`; requirements/design acceptance evidence remains unavailable.
- Running authored changed-line count: 347 in S1, 156 in S2, 144 in S3a, plus task-evidence updates; each intended PR slice remains below 400 authored lines. The chain strategy is `feature-branch-chain`.
- Next step: commit this evidence update, create the next child branch from `feat/specly-workflow-03-workflow`, and implement S3b.
