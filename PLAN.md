# Specly: autonomous SDD and multi-runtime distribution

Specly will grow in this repository from an SDD scaffolder into a controlled SDD workflow. The existing `npx specly` entry point remains supported. A Python CLI distributed through `uvx` will provide a Node-free entry point for Python teams. Strands is an optional execution engine; AX is a later, opt-in cluster adapter. A small GitHub Pages site will explain and demonstrate the product.

## Product boundary

**Promise:** initialize a spec, turn it into reviewable work, execute approved tasks, and verify outcomes without silently changing the user's application or infrastructure.

**Not the promise:** install every framework into every application, replace its package manager, or deploy Kubernetes from an initialization command.

The current release (1.1.0) creates requirements, design, tasks, steering, and a guide. It does not yet orchestrate autonomous execution. Treat that distinction as a compatibility and documentation requirement, not a marketing detail.

## Intended user experience

```text
npx specly --feature auth                 # existing Node entry point
npx specly init --feature auth            # future explicit subcommand
uvx <verified-pypi-package> init --feature auth  # future Node-free entry point
specly doctor                              # report environment and integrations
specly plan auth                           # show proposed file and command changes
specly run auth --task 1.1                 # execute an explicitly selected task
specly verify auth                         # report evidence against criteria
```

Only the first command is currently available; the others are target interfaces. Confirm the PyPI package name before publishing or documenting a real `uvx` invocation. Keep the current `npx specly` syntax working while introducing explicit subcommands.

## Architecture

| Layer | Responsibility | Boundary |
| --- | --- | --- |
| SDD contract | Versioned requirements, design, tasks, steering, and verification evidence | One documented schema and migration policy shared across entry points |
| CLI front ends | Parse commands and render the same workflow | npm entry point remains; Python/`uvx` entry point is added |
| Workflow engine | State transitions, task selection, approvals, resumability, and evidence | No model or cloud dependency for `init`, `doctor`, or `plan` |
| Execution adapter | Run an approved task using Strands when enabled | Isolated configuration; no dependency added to the target app by default |
| Infrastructure adapter | Submit explicitly approved workloads to AX | Requires a configured cluster; never part of basic initialization |

Keep templates and the artifact contract canonical. If both Node and Python front ends remain, add conformance fixtures so they produce equivalent SDD artifacts rather than maintaining two drifting methodologies. Do not make the first Python release a thin wrapper that calls `npx`: that would retain the Node requirement that `uvx` is intended to remove.

## Work units

### 1. Stabilize the existing Specly contract

- [ ] Record current CLI outputs, overwrite behavior, agent paths, and test results as a compatibility baseline.
- [ ] Define schema version, artifact ownership, and migration rules for generated files.
- [ ] Add non-destructive `init` and `doctor` behavior; preserve existing invocation aliases.
- [ ] Test fresh and existing projects, including Python projects without `package.json`.

**Acceptance:** existing documented `npx specly` usage still works; repeated initialization does not overwrite user changes without explicit approval.

### 2. Add a controlled SDD workflow

- [ ] Define `plan`, `run`, and `verify` state transitions and durable progress records.
- [ ] Make the plan enumerate file writes, dependency changes, external commands, and required permissions before execution.
- [ ] Require explicit task selection and approval for execution; keep model credentials out of generated artifacts and logs.
- [ ] Record verification evidence and distinguish passed, failed, skipped, and unavailable checks.
- [ ] Test interruption/resume and rollback or recovery of partial local changes.

**Acceptance:** a task can move from requirement to verified result with a traceable approval and no hidden installation or execution.

### 3. Distribute a Node-free CLI with `uv`

- [ ] Verify the PyPI name and package ownership before choosing the published command.
- [ ] Package a Python CLI with a console entry point; use `uv build` and `uv publish` for release automation.
- [ ] Share artifact schemas/templates with the npm release and run the same conformance fixtures against both front ends.
- [ ] Test `uvx` from a clean Python project on Linux, macOS, and Windows, with no Node installation.
- [ ] Pin release versions in examples and document the trust boundary of one-shot package execution.

**Acceptance:** `uvx` can initialize and inspect a Python project without creating `package.json` or installing Node; equivalent operations produce compatible artifacts through npm and PyPI.

### 4. Integrate Strands, then AX

- [ ] Add Strands as an opt-in executor for approved SDD tasks, with explicit provider configuration, budgets, timeouts, and tool permissions.
- [ ] Keep Strands out of the target application's dependencies unless that application explicitly requests it.
- [ ] Verify a local end-to-end task against the SDD acceptance criteria before calling this integration ready.
- [ ] Add AX only after the local workflow is stable: `doctor` checks Kubernetes, Agent Substrate, credentials, and AX version; `plan` shows manifests and deployment effects.
- [ ] Gate AX submission and cluster mutation behind separate approval and a documented compatibility range.

**Acceptance:** local Specly works without Strands or AX; an AX-unavailable machine receives an actionable diagnostic, not a partial cluster installation.

### 5. Publish the presentation site on GitHub Pages

- [ ] Build a minimal dark, responsive static site in `site/`, with no application framework unless a real need appears.
- [ ] Lead with the product boundary and two entry points (`npx` today, `uvx` only after release).
- [ ] Show an animated terminal sequence: initialize a feature, inspect the plan, approve one task, and display verification evidence. Label unreleased steps as preview until they exist.
- [ ] Provide a non-animated equivalent and respect `prefers-reduced-motion`; preserve keyboard access and readable contrast.
- [ ] Add installation, quick-start, security model, repository, and roadmap links.
- [ ] Deploy through a GitHub Actions Pages workflow only after the site has passed mobile, accessibility, and link checks.

**Acceptance:** the page loads as a static GitHub Pages site, the terminal demo never implies unshipped commands are available, and the full story remains understandable with animations disabled.

### 6. Prepare LinkedIn launch copy

- [ ] Create `content.md` in the repository with a primary LinkedIn post and a shorter alternative announcing the Specly update.
- [ ] Include the problem, what changed, who benefits, a verified installation command, and links to the repository and presentation site when available.
- [ ] Check every feature and availability claim against the released version; describe Strands and AX as roadmap items until their integrations ship.
- [ ] Proofread the copy and leave publication to the maintainer; creating `content.md` does not publish a post.

**Acceptance:** `content.md` contains ready-to-review LinkedIn copy with accurate release claims and no placeholder links presented as live.

## Sequence and release gates

1. **Foundation release:** work units 1–2, with tests and documentation in the same reviewable commits.
2. **Distribution release:** work unit 3; publish npm and PyPI only after cross-runtime conformance passes.
3. **Agent release:** Strands portion of work unit 4; observe real task success and failure cases before widening autonomy.
4. **Infrastructure preview:** AX portion of work unit 4, explicitly experimental and opt-in.
5. **Site:** start its design alongside foundation work, but publish claims only as each release gate is met.
6. **Launch copy:** complete work unit 6 after the release scope and live links are known; the maintainer reviews and publishes the LinkedIn post separately.

Keep each commit a coherent behavior with its tests and user-facing documentation. Do not split a behavior merely by language or file type. No push, package publication, cloud deployment, or GitHub Pages activation is implied by this plan.

## Decisions to validate before implementation

- Whether the Python CLI becomes the primary workflow engine while the Node CLI remains a compatible front end, or both front ends call a separate native core. Favor the simpler Python-first path for the initial `uvx` release; re-evaluate after measuring duplication.
- Which model providers and tool permissions an autonomous task may use by default. Default to no provider and no execution until configured and approved.
- Which artifacts are stable across CLI versions and how existing Specly users migrate without losing their edits.

## Evidence consulted

- Local `package.json`, `README.md`, and `src/index.js` for current Specly behavior.
- [uv tools](https://docs.astral.sh/uv/concepts/tools/) and [publishing](https://docs.astral.sh/uv/guides/publish/) for the Python distribution path.
- [Strands Python quickstart](https://strandsagents.com/docs/user-guide/sdk/quickstart/python/) for the optional executor.
- [Google AX README](https://github.com/google/ax) for its cluster prerequisites and pre-stable status.
