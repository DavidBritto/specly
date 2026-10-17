# Design: Continue Specly beyond the local workflow baseline

## Technical approach

Extend the local S1–S3c Node.js baseline in independent S4–S8 slices. The npm CLI remains the compatibility anchor; a separately packaged Python CLI reads the same versioned artifact contract and ships byte-checked copies of its canonical assets. Strands and AX are separate optional adapters behind explicit, scoped approval gates. The static site and launch drafts describe only evidenced availability. None of this design implies a package release, live site, provider call, or cluster deployment.

This document is an implementation plan, not authorization to implement or perform remote operations. The five delta specs under `specs/` are normative for behavior; this document selects boundaries and verification methods. Current source evidence: `src/index.js` dispatches the CommonJS CLI; `src/agents.js` owns agent layouts; `src/workflow.js` owns digest-approved single-file actions and the run ledger; `contracts/artifact-contract-v1.json` and `src/templates/` define generated output; `test/cli.test.js` covers the Node baseline. `package.json` still identifies version `1.1.0`; the current feature branch is not release evidence.

## Architecture decisions

### 1. Separate Python runtime, shared artifact authority

**Choice:** Add a Python project at `python/` with an internal `specly_cli` package, `pyproject.toml`, console entry point, and packaged contract/template assets. The distribution name and public `uvx` spelling remain provisional. Root `contracts/artifact-contract-v1.json`, `src/templates/`, and `how-to-use.md` remain the canonical inputs. A deterministic asset-sync/check step copies those bytes into `python/src/specly_cli/assets/`; a wheel contains the checked snapshot so installed Python never reads the npm tree or invokes Node.

**Alternatives considered:** A Python wrapper around `npx` fails Node independence. Reading the repository tree at runtime fails for an isolated wheel. Maintaining hand-edited duplicate templates invites drift.

**Rationale:** `uvx` runs a Python CLI in an isolated tool environment, but that does not make an unpublished or unowned package publicly installable ([uv tools](https://docs.astral.sh/uv/concepts/tools/)). Build and registry publication are distinct ([uv publishing guide](https://docs.astral.sh/uv/guides/publish/)). Package identity, supported Python versions, build backend, and the exact public command must be settled with fresh implementation-time checks; PyPI ownership is not established here.

The first Python CLI declares `init`, `doctor`, `plan`, and `verify` as supported. `run` and `recover` are explicitly unsupported, not silently delegated to Node: their current approval digest depends on Node serialization and an absolute project root, while the `.specly/runs/` state and lock protocol has no separate cross-runtime contract. A later parity slice may add them only after a versioned digest/ledger interoperability contract and recovery tests; the Python CLI must not reinterpret existing Node approvals. This narrower declared command set satisfies the Python spec without claiming full workflow parity.

### 2. Preserve generated-file ownership and exact bytes

**Choice:** The Python initializer resolves all six artifact roles and seven layout keys from contract v1, substitutes `{feature}`, and copies the canonical packaged bytes. Existing files are skipped; replacement requires explicit `--force`. Contract and template digests are checked before writes. Python output should match Node's paths and bytes for equivalent supported operations; nonessential terminal prose may differ.

**Alternatives considered:** Translating templates into Python strings or generating semantically equivalent Markdown would break fingerprint conformance.

**Rationale:** `ARTIFACT-CONTRACT.md` makes generated copies user-owned and specifies byte fingerprints and overwrite behavior. Conformance is about exact artifacts, not merely similar text. Any intentional template change must update the contract version/fingerprints and compatibility notes together; it cannot be hidden in one runtime.

### 3. Strands is a task-scoped capability, never a default path

**Choice:** Place the first adapter in the optional Python package boundary (`python/src/specly_cli/optional/strands_adapter.py`), behind an explicit `execute` surface and a task-scoped request object. The default `init`, `doctor`, `plan`, and `verify` paths do not import or initialize Strands or inspect provider credentials. A preflight validates the selected task, provider destination and credential/session authorization, declared tools, writable roots, budgets, and timeout; an effects summary and digest are displayed before a separate affirmative execution approval. Each invocation gets only the approved tool set and limits. The first adapter permits structured, bounded local artifact operations only; arbitrary shell, subprocess, VCS, PR, and network-capable tools are not offered. Its result is a separate execution record, not a checked task or requirements-acceptance verdict.

**Alternatives considered:** Auto-running after planning, using ambient provider credentials, or supplying general shell tools would enlarge authority without user review.

**Rationale:** Strands documents hooks in both Python and TypeScript and discusses production controls ([hooks](https://strandsagents.com/docs/user-guide/sdk/agents/hooks/), [operating agents](https://strandsagents.com/docs/user-guide/sdk/deploy/operating-agents-in-production/)); those sources support an adapter feasibility assessment, not a frozen hook/API binding or guarantee that a timeout stops every side effect. The adapter must be mapped to a freshly verified SDK version and tested before enabling it. The implementation should use a separate package extra or other lazy optional dependency boundary so ordinary installs do not load the provider stack.

### 4. AX diagnostics and cluster mutation have distinct authority

**Choice:** Keep AX in a second Python optional module (`python/src/specly_cli/optional/ax_adapter.py`), independent of Strands. `ax doctor` first checks local configuration/prerequisite declarations without contacting a cluster. An explicitly authorized remote inspection may read the named destination only with a named credential/session. An effect preview is locally assembled and identifies the exact context, namespace, operation, resource targets, and proposed effects. Submission requires a second approval bound to a digest of that preview; changed target/effects or missing compatibility evidence fail closed. AX libraries or binaries are optional and never invoked by ordinary Specly commands.

**Alternatives considered:** Conflating `doctor` with cluster discovery or treating preview approval as deployment approval.

**Rationale:** The current [Google AX README](https://github.com/google/ax/blob/main/README.md) identifies prerelease/breaking-change status and prerequisites including Kubernetes, Agent Substrate, Go, `kubectl`, `ko`, and a registry. That is evidence of a substantial operational boundary, not proof of a stable API or a supported version range. No real cluster probe, credential discovery, or mutation is part of planning or default tests.

### 5. Claims are release-evidence gated

**Choice:** Keep a local, reviewable claim inventory for S7/S8 in `site/claims.json` (or equivalent static data) with capability, state (`released`, `local-preview`, `planned`, `unverified`), exact wording, and evidence locator. Rendering defaults to non-released language unless observed registry/site release evidence justifies `released`. `content.md` uses the same inventory during human review; it is a draft, not an automated posting pipeline.

**Alternatives considered:** Copying roadmap claims directly into the site or treating `package.json`, a local build, or feature-branch code as publication evidence.

**Rationale:** Release-accurate language is a testable input, not a late editorial judgment. A claim validator can reject unverified install commands, versions, and live links before anything is called publish-ready. It must not probe external URLs without separate authorization; local validation can inspect fixture-based link/claim data.

The terminal narrative is semantic HTML with all essential information present before JavaScript runs. CSS or a small progressive-enhancement script may add motion, but `prefers-reduced-motion` disables nonessential animation and a visible static transcript remains equivalent. This avoids making animation an accessibility dependency.

## Data flow and interfaces

```text
Canonical contract + templates ── sync/check ──> Python wheel assets
              │                                      │
              ├──> Node init/test                      └──> Python init/test
              └──> shared conformance fixtures <──────────┘

Selected task ── preflight ──> effect/tool/limit digest ── approval ──> Strands adapter
                                                              │
                                                              └──> execution evidence only

AX config ── local prerequisite check ──> effect preview ── separate approval
                                                   │                   │
                                                   └── no mutation     └── authorized submit

Observed release evidence ──> claim inventory ──> site + content.md drafts
```

The Python adapter reads a parsed contract with `contractVersion`, `schemaVersion`, `layouts`, `artifacts[]`, and `overwritePolicy`; unknown required versions fail before filesystem writes. Each artifact maps `directory` to the selected layout, validates the resolved project-relative path, verifies the packaged template SHA-256, then applies skip-existing or explicit-force behavior. It must not create `package.json` or invoke Node. Python tests should compare a temporary Node-generated project and a Python-generated project only in a test environment where Node is available; a separate smoke test runs Python with Node/npm/npx absent from `PATH` and no registry/network access.

The optional adapter contracts are design-level shapes, not promises about upstream SDK names:

| Boundary | Input | Output / failure |
| --- | --- | --- |
| `ExecutionRequest` | task identity, approved project root, provider destination/session, tool allowlist, writable roots, budget, timeout, approval digest | bounded execution result or pre-invocation refusal |
| `ExecutionRecord` | request fingerprint, start/end, tool effects, limit status, sanitized provider/tool errors | auditable `completed`, `failed`, `limited`, or `interrupted`; never acceptance proof |
| `AxPreview` | named cluster/context, namespace, operation, resource/effect list, compatibility evidence | immutable approval digest; changed target/effects require new preview |
| `Claim` | text, capability, availability state, evidence locator, optional command/link | rendered or rejected by release-claim validator |

Approvals are single-operation and bound to concrete target/effects. Secrets must not enter previews, approval digests displayed in logs, or persisted evidence. A denial, missing provider configuration, changed scope, expired budget, interrupted operation, or unavailable dependency fails closed and reports a recovery action. Stale execution/cluster attempts require inspection and fresh approval; they are not retried automatically. Strands and AX records must not modify the existing S1–S3c ledger or turn its `write-file` evidence into requirements acceptance.

## Planned file changes

Paths are proposed, not created by this planning phase. The exact adapter SDK files and release workflow shape are contingent on fresh implementation-time evidence.

| Path | Action | Purpose |
| --- | --- | --- |
| `python/pyproject.toml`, `python/src/specly_cli/{__main__,cli,contract,layout}.py` | Create | Node-free package metadata, entry point, contract-driven CLI. Public distribution/command names remain provisional. |
| `python/src/specly_cli/assets/`, `python/scripts/sync_assets.py` | Create | Packaged canonical contract/templates with deterministic sync/check. |
| `python/tests/` | Create | Unit, Node-free wheel smoke, and cross-runtime conformance tests. |
| `python/src/specly_cli/optional/{strands_adapter,ax_adapter}.py` | Create | Independent lazy optional integration boundaries; exact upstream calls follow verified SDK/prerequisite fit. |
| `src/index.js`, `src/workflow.js`, `test/cli.test.js` | Preserve and regression-test | Keep default Node commands and S1–S3c approval semantics unchanged. |
| `contracts/artifact-contract-v1.json`, `ARTIFACT-CONTRACT.md`, `src/templates/` | Preserve by default | Canonical contract and assets; update together only for an intentional, separately tested versioned change. |
| `site/index.html`, `site/styles.css`, `site/claims.json`, `site/` local tests | Create | Static accessible presentation, evidence states, and local checks. |
| `.github/workflows/pages.yml` | Optional create | Disabled/inert local workflow preparation only; activation/deployment needs separate authorization. |
| `content.md`, `README.md` | Create/modify | Primary and short LinkedIn drafts plus precise availability documentation. |

## Verification strategy and failure recovery

`openspec/config.yaml` sets prospective strict TDD for SDD implementation: observe RED, implement GREEN, then REFACTOR. The exact current Node runner is `npm test`. The Python runner is not yet defined and must be selected when its package/test harness exists; do not claim a Python test pass or invent a command now.

| Layer | RED test / check | Expected proof |
| --- | --- | --- |
| Contract unit | bad version, bad fingerprint, unsafe layout path, existing file without/with force | no unauthorized overwrite; explicit mismatch diagnostics |
| Cross-runtime integration | all six artifacts across generic and agent layouts, content bytes/fingerprints, selected `init`/`plan`/`verify` behavior | equivalent supported operations conform, npm tests stay green |
| Node-free package | build wheel locally, install from wheel in an isolated Python environment with Node tools unavailable, run supported commands in a clean project | no Node process, `package.json`, registry call, or undeclared runtime dependency |
| Strands adapter | absent enablement, missing/changed approval, missing provider config, disallowed tool/root, budget/timeout, provider failure/interruption | no provider/tool call before gate; scoped record with no acceptance promotion |
| AX adapter | missing prerequisites, no remote authorization, read-only preview, changed digest, failed submit/interruption | no probe or mutation without exact scope; fresh approval for retry |
| Site/copy | claims without release evidence, unverified commands/links, keyboard/focus/contrast, mobile layout, scripts off, reduced motion | release-accurate accessible local artifacts; no deployment/posting |

An interruption during Python initialization must leave existing user files untouched. On rerun, the initializer checks each existing output against the canonical template bytes and fingerprint: a match is treated as already complete, while a mismatch is reported as a divergent or possibly partial file requiring explicit user review and repair. Skip-existing must never silently certify a mismatched file as complete or overwrite it; `--force` remains the explicit replacement path. A sync/check mismatch blocks wheel creation rather than shipping stale assets. Optional-adapter failures are recorded with redacted evidence; they never trigger silent retry or fallback to the S1–S3c `run` path. AX uncertainty is especially fail-closed: remote authorization and a compatibility range are prerequisites to a real submit. Site and copy publication checks are manual/authorized release gates; local checks alone cannot mark them published.

## Threat matrix

The optional adapters cross process/provider and potential cluster boundaries, so the required SDD threat matrix is considered below. The proposed first Strands adapter excludes shell, subprocess, VCS, PR, and executable-file classification entirely; any later tool grant that adds them requires revisiting these rows and adding the corresponding RED tests before implementation.

| Boundary | Applicability | Safe/failure behavior and planned RED test |
| --- | --- | --- |
| Documentation-like paths (`requirements.txt`, `CMakeLists.txt`, executable Markdown/MDX, `README.sh`) | N/A — no path is classified as executable and no shell/script tool is offered | Structured writes remain data only; no execution-classification task for this slice. |
| Git repository selection (`git -C`, relative, absolute) | N/A — adapters do not invoke Git | No repository selector is accepted by a tool. |
| Commit state (staged, `commit -a`, empty index) | N/A — adapters cannot commit | No commit API or subprocess is exposed. |
| Push state (tracking, first push, refspec) | N/A — adapters cannot push | No remote VCS operation is exposed. |
| PR commands (`--head`, environment prefix, composed commands) | N/A — adapters cannot create PRs | No PR command composition is exposed. |

Separately applicable boundaries still require RED tests: path escape/symlink and reserved-directory attempts for structured writes; provider invocation with missing/changed task-tool approval; ambient credential presence that must remain unread; AX remote probe without destination/operation/session authorization; changed cluster target/effects after preview; and timeout/interruption without a success claim. These do not make the five matrix rows applicable because no command/classification route exists in this scope.

## Sequencing and rollout

1. **S4:** verify packaging/name assumptions, implement the Node-free package and shared conformance suite, then document only locally demonstrated commands. Do not publish.
2. **S5:** verify current Strands SDK/provider/tool contracts, settle explicit provider/tool policy, then implement and test the optional executor. Keep it disabled by default.
3. **S6:** verify Google AX identity, version range, prerequisites, and operation API; implement local diagnostics/preview before any separately authorized remote integration test or mutation.
4. **S7–S8:** build the static site and claim inventory locally; draft both copy lengths; validate accessibility and evidence. Prepare but do not activate Pages or post.

The slices may be delivered in a feature-branch chain for focused review; this design does not create a PR or commit. Rollback removes an optional package/adapter/site slice without rewriting user-owned generated files or the existing Node workflow. Public releases, Pages activation, provider calls, cluster operations, and posting each require their own later authorization.

## Open questions and implementation-time gates

- [ ] Verify PyPI distribution-name availability/ownership, final console-script name, supported Python range, and wheel build backend before advertising any public `uvx` command.
- [ ] Select the Python test runner after creating the Python harness; preserve `npm test` as the Node/SDD baseline.
- [ ] Decide whether a later Python `run`/`recover` parity requirement warrants a versioned, cross-runtime digest and ledger contract; do not reuse Node approval digests speculatively.
- [ ] Recheck current Strands SDK APIs and concrete provider/tool policy before binding adapter code; hooks are not themselves a permission sandbox.
- [ ] Recheck Google AX identity, current prerelease API/prerequisites, and a tested compatibility range before asserting support or using a cluster.
- [ ] Verify each package release, command, live URL, and feature claim before marking site or copy publish-ready; obtain separate authorization for every remote operation.
