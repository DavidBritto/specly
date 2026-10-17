## Exploration: Specly app continuation

### Current State

Specly 1.1.0 is a Node.js 18+ CommonJS CLI. The current local feature branch, `feat/specly-workflow-07-sdd-handoff` at `f0e4ee7`, already contains S1–S3c: compatible `init`, read-only `doctor` and `plan`, read-only artifact and task verification, and digest-approved execution/recovery of one manifest-declared `write-file` action. The action planner binds approval to the project, task file, manifest, and target content. A separate `.specly/runs/` ledger records attempts. This is **not** autonomous code generation, arbitrary command execution, requirements acceptance verification, or an OS sandbox. The work is committed on prior feature-chain slices, but no PR, package release, or site publication is evidenced here. The package metadata still says `1.1.0`; local branch behavior must not be advertised as published behavior.

`odd/tasks/specly-workflow.md` records S1–S3c complete and S4–S8 open. `PLAN.md` is a useful product roadmap but its statement that only the legacy command exists is stale relative to this branch. Its full requirement-to-verified-result acceptance goal is not met by the present local action and evidence subset. The ODD tracker records TDD off for earlier organic work; the new `openspec/config.yaml` explicitly sets strict TDD on for subsequent SDD implementation, with `npm test` as the Node runner. The SDD artifacts should distinguish these historical and prospective rules.

### Affected Areas

- `PLAN.md` and `odd/tasks/specly-workflow.md` — roadmap intent and completed/open-task evidence; neither should be rewritten during this documentation-only handoff.
- `src/index.js`, `src/workflow.js`, `src/agents.js`, `src/templates/` — current CLI, guarded local workflow, layout, and canonical templates that future front ends must preserve.
- `ARTIFACT-CONTRACT.md` and `contracts/artifact-contract-v1.json` — shared artifact roles, paths, ownership, overwrite policy, and template fingerprints for cross-runtime conformance.
- `test/cli.test.js`, `package.json`, `README.md` — Node compatibility and safety tests, package command, and current behavior documentation.
- Future S4–S8 areas, not yet present: Python package and tests, optional Strands/AX adapters, `site/` and Pages workflow, and `content.md`.

### Approaches

1. **Continuation delta (recommended)** — specify the remaining S4–S8 work and explicitly reference S1–S3c as an implemented baseline.
   - Pros: preserves evidence and scope boundaries; avoids reimplementing shipped-on-branch behavior; supports interruption-safe resumption.
   - Cons: future readers must follow references to the baseline and prior commits.
   - Effort: Medium.

2. **Rewrite the entire roadmap as new work** — restate S1–S8 as if all features were pending.
   - Pros: one self-contained narrative.
   - Cons: conflates implemented, locally available, and released behavior; risks duplicate work and false marketing claims.
   - Effort: High.

### Recommendation

Create a durable, bounded SDD continuation for S4–S8. Proposal and specs should state the implemented S1–S3c baseline and its limitations before defining new requirements. Keep the Node CLI and artifact contract compatible. S4 must be truly Node-free rather than wrapping `npx`, and should reuse canonical template/fixture data; the PyPI name and ownership need verification before any public command or release claim. S5 and S6 remain separately opt-in, with explicit provider/tool and cluster-mutation approvals. S7 may be built locally but must label unavailable features and must not activate Pages. S8 may draft copy but should not claim live URLs or publication without verification. No implementation, publishing, deployment, remote access, or credential use is authorized by this handoff.

### Risks

- `PLAN.md` is stale against the current branch, and `1.1.0` metadata does not establish that branch-only commands are released.
- A Python implementation could drift from `contracts/artifact-contract-v1.json` or accidentally retain a Node dependency.
- Strands/AX capabilities and current upstream APIs require fresh primary-source verification before design or implementation; basic diagnostics must remain non-mutating.
- The existing run ledger proves only a constrained local write, not project acceptance; future verification must not promote it to broader success.
- SDD strict TDD differs from the historical ODD tracker; future task planning must use the new SDD configuration without rewriting past evidence.

### Ready for Proposal

Yes — draft the continuation proposal within the existing authorization: durable planning artifacts only, no remaining-feature implementation. Record release/name/prerequisite unknowns as explicit gates rather than inventing answers.
