# Tasks: Continue Specly beyond the local workflow baseline

Implementation planning for S4–S8 only. S1–S3c are an implemented local npm baseline and are not new tasks in this change. These tasks do not authorize implementation, remote access, provider invocation, cluster operations, commits, PR creation, deployment, or publication. Every availability or compatibility claim remains provisional until its evidence gate is observed.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,800–2,800 authored additions plus deletions across S4–S8; estimate only, excluding generated artifacts |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Future slice A S4 package foundation → slice B S4 parity → slice C S5 Strands → slice D S6 AX → slice E S7 site → slice F S8 launch copy |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

No slice is permission to create a PR. The existing feature-branch chain already contains six child slices; these proposed future slices begin at the final SDD handoff tip, not at the tracker branch. Future slice A would base on that final handoff tip; each later slice would base on the immediately preceding future slice (B on A, C on B, D on C, E on D, F on E). This does not claim those future slices or PRs exist. Keep each eventual child diff limited to its own slice. If any slice cannot honestly fit the 400 authored-line budget in one bounded slicing pass, retain the complete tests/docs and report the smallest honest overage for a maintainer decision; do not code-golf.

### Suggested Work Units

| Unit | Goal | Likely PR / base | Focused test command | Runtime harness | Rollback boundary |
|------|------|------------------|----------------------|-----------------|-------------------|
| S4a | Establish Python package, supported command surface, contract parser, and Node-free clean-project smoke | Future slice A; base = final SDD handoff tip | Python test command selected when `python/tests/` exists; `npm test` for Node compatibility | Build/install the local wheel in an isolated Python environment with Node tools absent from `PATH`; no registry access | Remove `python/` package foundation; leave the npm baseline and canonical contract untouched |
| S4b | Package canonical assets, detect stale snapshots, and prove Python/npm conformance | Future slice B; base = future slice A | Python test command selected when harness exists; `npm test` | Generate equivalent temporary projects under both runtimes, then run the Python wheel with Node/npm/npx absent | Revert Python asset-sync/conformance changes and associated fixtures/docs only |
| S5 | Add an optional, lazy Strands adapter with scoped approval and auditable outcomes | Future slice C; base = future slice B | Python test command selected when harness exists; `npm test` regression | Local fake provider/tool harness; prove default commands do not import/call provider | Remove Strands extra, adapter, tests, and its narrowly scoped docs; preserve S4 and npm behavior |
| S6 | Add local AX prerequisite diagnostics and immutable effect preview with separate approval boundary | Future slice D; base = future slice C | Python test command selected when harness exists; `npm test` regression | Offline fixtures/mocks only; no real cluster or credential inspection | Remove AX extra/adapter/tests/docs without changing Strands or baseline |
| S7 | Build accessible local static site and evidence-state claim inventory; prepare only inert deployment configuration | Future slice E; base = future slice D | `npm test` plus local site/accessibility/link checks selected with the site harness | Local static preview with scripts disabled, keyboard-only navigation, mobile viewport, and reduced-motion preference | Remove `site/` and inert Pages workflow; do not alter or activate remote settings |
| S8 | Draft primary and short LinkedIn copy against verified claim inventory | Future slice F; base = future slice E | `npm test` plus local claim/link checks selected with the content harness | Read back `content.md` and validate locally against claim fixtures; no posting or remote URL probe | Revert `content.md` and any copy-only README changes |

The Python test runner is intentionally unresolved: select it only after the Python package/test harness exists, record the chosen command in the implementation artifact, and use strict RED → GREEN → REFACTOR. `openspec/config.yaml` currently sets `strict_tdd: true` and `npm test`; keep `npm test` as the Node regression command. Runtime harnesses above are local and do not authorize remote work.

## Phase 1: S4 — Python distribution and contract parity

- [ ] 1.1 Before selecting a public distribution or console-command identity, verify current PyPI package-name availability/ownership and the applicable `uv` packaging/entry-point behavior using current primary evidence. Do not treat a local lookup, branch name, package metadata, or this task as proof. Do not publish, use credentials, or perform a remote operation without separate explicit authorization naming destination, operation, and credential/session; until verified, keep all public names and install commands provisional.
- [ ] 1.2 Add failing Python contract tests in `python/tests/` for unknown contract/schema versions, invalid or unsafe layout resolution (including path escape and symlink/reserved-directory attempts), bad packaged-template fingerprints, and existing/mismatched files with and without explicit force. Assert failure occurs before unauthorized writes; then implement the minimal contract parser/validation in `python/src/specly_cli/contract.py` and `layout.py`.
- [ ] 1.3 Create the isolated Python project in `python/` (`pyproject.toml`, `src/specly_cli/{__main__,cli}.py`) with an internal package and an explicitly declared `init`, `doctor`, `plan`, and `verify` command surface. Keep public package/command names provisional pending 1.1. Do not expose `run` or `recover` as aliases or delegate them to Node; do not create `package.json` (read-only), invoke Node/npm/npx, or import the target app.
- [ ] 1.4 Add failing CLI tests in `python/tests/` for clean Python projects with no Node tools or `package.json`, skip-existing behavior, explicit `--force`, supported-command diagnostics, and unsupported `run`/`recover`; implement only the declared Python behavior in `python/src/specly_cli/`. Use an isolated local wheel smoke harness, with no registry/network access, and demonstrate that supported commands do not spawn Node tools.
- [ ] 1.5 Add a failing regression case in `test/cli.test.js` for the existing npm command behavior that could be affected by the distribution work, then preserve the existing interface and run `npm test`. Do not change S1–S3c approval, ledger, or artifact semantics to obtain Python parity.
- [ ] 1.6 Add deterministic asset synchronization/checking in `python/scripts/sync_assets.py` and packaged snapshots under `python/src/specly_cli/assets/`, using the canonical `contracts/artifact-contract-v1.json` (read-only), `src/templates/` (read-only), and `how-to-use.md` (read-only). Test that stale or divergent snapshots block wheel creation and that all six artifact roles and seven layouts resolve with canonical bytes/fingerprints; update canonical sources only through a separately justified versioned contract change.
- [ ] 1.7 Add cross-runtime conformance tests under `python/tests/` for equivalent supported `init`, `plan`, and `verify` inputs, comparing artifact roles, paths, ownership, overwrite behavior, bytes, and fingerprints. Use shared fixtures and a temporary Node-generated project only in this conformance test; keep a separate Node-free wheel smoke test. A mismatch must identify the contract element and fail.
- [ ] 1.8 Add the S4 package/Node-free/conformance checks and evidence status to `README.md` (and Python-local docs if created). Distinguish local build/test evidence from registry publication; no package is called published or available absent an observed registry record for its verified name/version. Python initialization interruption/re-run must recognize exact canonical bytes as already complete and require review for mismatched partial files rather than overwrite or certify them.

## Phase 2: S5 — Optional Strands task execution

- [ ] 2.1 Before binding adapter calls or claiming API support, verify current Strands Python SDK, provider configuration, hooks/tool APIs, and execution-control behavior from primary documentation and an implementation-time compatibility test. Record the tested version and exact supported range; do not treat this plan or historical links as verification. Keep integration unavailable/unverified until that evidence exists.
- [ ] 2.2 Add failing tests in `python/tests/` proving default `init`, `doctor`, `plan`, and `verify` do not import Strands or inspect ambient credentials; missing configuration, missing/changed task-tool approval, out-of-scope tool/root, and unapproved provider session refuse before invocation. Then implement the optional lazy dependency boundary in `python/src/specly_cli/optional/strands_adapter.py`.
- [ ] 2.3 Add failing tests for bounded tool allowlists, writable-root enforcement, budget/timeout exhaustion, provider failure/interruption, redacted evidence, and successful execution that does not mark tasks checked or requirements accepted. Implement task-scoped preflight/effect digest/affirmative approval and a separate execution record; expose no shell, subprocess, VCS, PR, or network-capable tool.
- [ ] 2.4 Add tests for applicable structured-write path escape/symlink and reserved-directory attempts. Keep structured writes as data-only operations. Omit threat-matrix rows explicitly marked N/A (Git selection, commit, push, PR commands, and executable-path classification) unless a future scope change adds those capabilities and corresponding RED tests first.
- [ ] 2.5 Document the optional dependency, configuration categories, approval/effect boundary, no-ambient-credential rule, limits, outcomes, and unsupported cases in `README.md` or Python package docs. State that execution evidence is not acceptance evidence and that no provider is contacted by local tests.

## Phase 3: S6 — Opt-in AX adapter

- [ ] 3.1 Before asserting an AX project identity, API, prerequisites, or compatibility range, verify the intended project's current primary documentation and API, enumerate required local prerequisites, and run a version-pinned compatibility test. Record evidence and supported range; until verified, label AX unavailable/unverified. This task does not authorize cluster access or credential inspection.
- [ ] 3.2 Add failing offline fixture tests in `python/tests/` for missing prerequisites and absent destination/operation/credential-session authorization; assert diagnostics are actionable and no AX invocation, cluster probe, or ambient credential inspection occurs. Implement local prerequisite diagnostics in `python/src/specly_cli/optional/ax_adapter.py` without wiring AX into ordinary commands.
- [ ] 3.3 Add failing preview tests that bind named context/cluster, namespace, operation, resource targets, effects, and compatibility evidence to an immutable digest; assert preview itself does not submit or mutate. Implement local effect preview and a distinct affirmative approval bound to that digest.
- [ ] 3.4 Add failing tests that absent approval, changed target/effects, missing compatibility evidence, or stale approval refuses submission and requires fresh preview/approval. Implement only the bounded submission interface; tests use mocks/fixtures and never a real cluster. Any later remote inspection or mutation requires separate explicit authorization for destination, operation, and credential/session.
- [ ] 3.5 Document local-only diagnostics, compatibility status, preview vs. mutation approvals, remote authorization requirements, and failure recovery. Never state that a live cluster or credential path was tested unless separately authorized and observed.

## Phase 4: S7 — Accessible static presentation

- [ ] 4.1 Add the `site/claims.json` claim inventory and failing local tests that reject `released` claims without observed package/site evidence, and reject unverified install commands or live links. Seed current S1–S3c/S4–S8 states only from evidence actually observed during implementation; branch code and roadmap text alone remain local-preview/planned/unverified.
- [ ] 4.2 Create semantic `site/index.html` with essential terminal-style narrative present before JavaScript and an equivalent static, non-animated presentation. Add failing tests/checks for scripts-disabled content equivalence and reduced-motion behavior, then implement `site/styles.css` and any progressive-enhancement script without making animation essential.
- [ ] 4.3 Add failing local accessibility/layout checks for keyboard reachability, visible focus, contrast, narrow viewport overflow, and legible controls; correct the page and re-run checks. Mark accessibility checked only for the validations actually observed.
- [ ] 4.4 Add local static/link checks using fixtures that do not probe external URLs. If a Pages workflow is prepared in `.github/workflows/pages.yml`, keep it inert and locally reviewable; activation, deployment, repository operations, and remote URL checks require separate explicit authorization naming destination, operation, and credential/session.
- [ ] 4.5 Document preview/deployment state in `README.md` or `site/` guidance. A local preview or workflow file is not evidence of a live site and must not be presented as a publication.

## Phase 5: S8 — Release-grounded launch copy

- [ ] 5.1 Create `content.md` with a primary announcement and a shorter LinkedIn draft. Use `site/claims.json` as the shared evidence source where available; label local, planned, unavailable, or unverified capabilities accurately, and keep the artifact explicitly a draft.
- [ ] 5.2 Add local checks or a review checklist for every install command, package/version, feature claim, and live URL in `content.md`. Omit or mark provisional anything not backed by observed release evidence; package metadata, local builds, roadmap, and branch code are not publication evidence. Do not probe live URLs without separate authorization.
- [ ] 5.3 Read back both drafts and reconcile each material claim with its exact evidence locator. Keep the copy non-publish-ready while any claim or destination remains unverified. Posting, scheduling, remote editing, credential use, and publication require later separate explicit authorization naming the destination, operation, and credential/session.

## Implementation and verification gates

- Future SDD implementation follows strict TDD: observe each failing RED test before production edits, reach GREEN, then REFACTOR. `npm test` is the configured Node suite. Select and record the Python runner only after `python/` and its test harness exist; do not invent a runner or claim results in this planning phase.
- Before S4 selects a public package/console name or advertises `uvx`, verify PyPI name ownership/availability and current `uv` packaging/entry-point behavior from current primary evidence. No publication is authorized.
- Before S5 binds calls or claims support, verify current Strands APIs and the tested SDK compatibility range; no provider call or ambient credential/session access is authorized.
- Before S6 claims support or targets a cluster, verify AX identity, API, prerequisites, and tested compatibility range; no cluster probe or mutation is authorized.
- Local build/test evidence is not registry publication, and local site preview/workflow evidence is not deployment. Any remote access, publication, deployment, posting, or credential use needs separate explicit authorization for destination, operation, and credential/session.
- Preserve the S1–S3c npm baseline and distinguish task execution records, local ledger evidence, and actual requirements acceptance evidence.
