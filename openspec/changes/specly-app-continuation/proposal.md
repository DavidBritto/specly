# Proposal: Continue the Specly app beyond the local workflow baseline

## Intent

Plan the remaining S4–S8 work without presenting unreleased branch behavior as a published product. Specly needs a genuinely Node-free Python entry point, optional and explicitly approved execution/infrastructure adapters, and accurate presentation materials. This change is a continuation delta, not a rewrite of the existing workflow.

S1–S3c are implemented on the local feature-branch chain: compatible npm initialization, read-only diagnostics/planning, a narrowly scoped digest-approved `write-file` action with recovery ledger, and task-specific evidence inspection. They do **not** provide autonomous code generation, arbitrary command execution, requirements acceptance verification, or an OS sandbox. Package metadata remains `1.1.0`; no PR, release, or publication is evidenced. `PLAN.md` describes intended outcomes but is stale where it says only the legacy command exists.

## Scope

### In Scope

- **S4 — Python distribution:** design a standalone Python CLI and package for `uvx` without invoking Node or `npx`; preserve existing npm behavior and the versioned artifact contract through shared fixtures and cross-runtime conformance tests. Verify the PyPI name and ownership before selecting any public command or release identity.
- **S5 — Optional Strands executor:** specify an opt-in adapter for explicitly selected, approved tasks, including provider configuration, tool permissions, budgets, timeouts, failure evidence, and no target-app dependency by default.
- **S6 — Optional AX adapter:** specify read-only prerequisite diagnostics and effect preview, followed by a separate approval boundary for any cluster submission or mutation. Document a verified compatibility range before claiming support.
- **S7 — Presentation site:** plan a small dark, responsive static site under `site/`, with an accessible terminal narrative, a non-animated equivalent, reduced-motion support, and explicit availability labels. A Pages workflow may be prepared locally; activation requires separate authorization.
- **S8 — Launch copy:** plan `content.md` with a primary and short LinkedIn draft; verify every availability claim, installation command, and live link against release evidence before calling copy publish-ready.

### Out of Scope

- Reimplementing S1–S3c, changing their approval or artifact semantics without a separately justified requirement, or treating their local ledger as full acceptance proof.
- Publishing npm/PyPI packages, pushing or opening PRs, activating GitHub Pages, posting to LinkedIn, remote access, credential use, or cluster deployment under this planning handoff.
- Adding Strands or AX to the default installation or invoking a provider or infrastructure tool from `init`, `doctor`, or read-only planning.
- Promising autonomous requirement-to-verified-result completion until that end-to-end claim has its own observed acceptance evidence.

## Capabilities

### New Capabilities

- `python-cli-distribution`: Node-free Python entry point, packaging, artifact-contract parity, and distribution evidence gates.
- `strands-task-execution`: Opt-in, bounded task execution with explicit provider/tool approval and recorded outcomes.
- `ax-cluster-adapter`: Opt-in prerequisite inspection, effect preview, and separately approved cluster operations.
- `presentation-site`: Accessible static product site with release-accurate availability states and optional Pages deployment preparation.
- `launch-copy`: Release-grounded LinkedIn drafts with verified commands and links.

### Modified Capabilities

None. `openspec/specs/` contains no existing capability specs; S1–S3c are an implemented baseline, not new requirements in this change.

## Approach

Specify each remaining capability as a bounded, independently verifiable slice. S4 reads the canonical `contracts/artifact-contract-v1.json` and template fixtures rather than inventing a second methodology; implementation must prove it works in a clean Python project without Node. S5 and S6 remain separate adapters, off by default, with approvals at their respective provider/tool and cluster-mutation boundaries. S7 and S8 derive displayed claims from verified release state, not from branch code or roadmap intent. Build/test tasks may follow this proposal only after the relevant evidence gates and explicit implementation authorization are satisfied. Future SDD implementation uses `openspec/config.yaml` strict TDD with `npm test` for Node work; historical ODD work remains accurately recorded as TDD-off.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| Python package and tests (path set by design) | New | Standalone CLI, packaging, clean-environment tests, and parity checks. |
| `contracts/artifact-contract-v1.json`, `ARTIFACT-CONTRACT.md`, `src/templates/` | Preserve/extend | Canonical contract and fixtures used by both runtimes; avoid silent schema drift. |
| `src/index.js`, `src/workflow.js`, `test/cli.test.js` | Compatibility | Keep existing npm commands and guarded local workflow behavior covered by tests. |
| Optional adapter modules and tests (paths set by design) | New | Strands and AX integrations with distinct opt-in boundaries. |
| `site/`, Pages workflow (path set by design) | New | Static site and locally prepared deployment workflow; no activation here. |
| `content.md`, `README.md` | New/Modified | Draft announcement and release-accurate product documentation. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| PyPI name, ownership, or `uvx` packaging assumptions are wrong | Medium | Check current registry ownership and primary `uv` documentation before naming or publishing a package; keep commands provisional until verified. |
| Python and npm generate divergent artifacts or Python secretly depends on Node | Medium | Reuse canonical contract/fixtures and test clean Node-free projects on supported platforms. |
| Strands/AX APIs, prerequisites, or permissions differ from assumptions | Medium | Verify current primary documentation before design/implementation; keep adapters unavailable by default and report missing prerequisites without mutation. |
| Site or copy markets local branch work as released | High | Tie each command/link/feature claim to package or site release evidence; visibly label previews and omit unverified live URLs. |
| Existing task evidence is mistaken for full requirements acceptance | Medium | Preserve distinct evidence states and require an observed end-to-end criterion before making that broader claim. |

## Rollback Plan

Keep future work in reviewable feature-chain slices. Revert a Python/adaptor/site/copy slice independently while preserving the S1–S3c npm baseline and user-owned artifacts. Disable optional adapters through configuration if they fail; neither default initialization nor read-only diagnostics may depend on them. If a later authorized publication occurs, use the package registry or Pages release process to withdraw or replace the affected published artifact and correct public claims; this proposal itself performs no publication.

## Dependencies and Evidence Gates

- Before S4 public naming or release claims: verify PyPI package-name availability/ownership and the current `uv` build, console-entry-point, and `uvx` behavior from primary sources.
- Before S5 design/implementation claims: verify current Strands APIs, provider setup, tool permissions, and execution controls from primary sources; settle permitted provider/tool policy before enabling execution.
- Before S6 design/implementation claims: verify the intended AX project's identity, current API, Kubernetes prerequisites, and version compatibility from primary sources; require separate approval for real cluster access or mutation.
- Before S7/S8 publication claims: establish which commands, package versions, site URLs, and integrations actually shipped; obtain separate authorization for publishing/deployment.

## Success Criteria

- [ ] The Python CLI builds and passes a clean Python-project smoke test with no Node installation, `npx` invocation, or generated `package.json`.
- [ ] Equivalent npm/Python operations pass shared artifact-contract conformance fixtures without breaking existing npm CLI tests.
- [ ] Strands and AX are absent from default execution; missing configuration yields actionable diagnostics, and provider tools or cluster mutations require explicit, separately testable approvals.
- [ ] The site remains understandable without animation and passes local keyboard, contrast, reduced-motion, mobile, and link checks; unavailable features are labeled as previews.
- [ ] `content.md` contains primary and short drafts, with every command, feature claim, and live link traceable to observed release evidence or clearly marked provisional.
- [ ] No planning artifact or local build is described as a published release, and no publication, remote operation, or credential use occurs without later explicit authorization.
