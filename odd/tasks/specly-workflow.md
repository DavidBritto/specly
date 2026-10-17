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

- [ ] **S1 — Preserve and extend the npm CLI.** Capture baseline behavior, add explicit `init` and read-only `doctor`, retain legacy aliases and skip/force semantics, and test Python-project initialization without `package.json`. Route: delegated; trigger: changes to CLI, tests, and docs (2+ non-trivial files). Checks: focused CLI tests, `npm test`, doctor read-only scenario.
- [ ] **S2 — Stabilize artifact contract.** Version generated artifacts, document ownership and migration, add cross-runtime conformance fixtures. Route: delegated; trigger: templates, tests, and docs. Checks: fixtures and `npm test`.
- [ ] **S3 — Add controlled local workflow.** Implement `plan`, approved task execution, `verify`, durable progress, and interruption recovery. Route: delegated; trigger: multiple modules and tests. Checks: unit/integration tests and one end-to-end task.
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
- Baseline exploration: current CLI parses bare positional tokens as agents; `doctor` must be routed before legacy parsing. Existing tests disable IDE launch with `SDD_NO_OPEN=1`.
- S1 implementation: `src/index.js`, `test/cli.test.js`, and `README.md` now contain explicit `init`, read-only `doctor`, compatibility coverage, and documentation. Checkbox remains open until commit and review evidence are recorded.
- S1 checks: writer reported focused CLI tests, `npm test`, manual doctor from a temporary Python project with unchanged target files, and `git diff --check` passed. Parent spot-check `npm test` and `git diff --check` also passed. The writer's pre-edit baseline could not run because sandbox policy returned `EPERM` for subprocess spawning; tests now call the exported CLI entry point in-process.
- Commits and review outcomes: pending. Receipt-driven development is on by global setting.
- Running authored changed-line count: pending first work-unit commit. The chain strategy is resolved as `feature-branch-chain`.
- Next step: commit the S1 work unit, assess/review the committed candidate as required, then advance to S2.
