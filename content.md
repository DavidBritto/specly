# Specly Launch Copy Drafts

> **Status:** Draft — not published, scheduled, or broadcast. Non-publish-ready pending final release observation.
> **Authorization Notice:** Posting, scheduling, or publishing any copy requires separate explicit user authorization naming destination, operation, and credential/session.

---

## 1. Primary Announcement Draft

**Vibe coding is fast. Spec-Driven Development is durable.**

When you build with AI coding agents, what guides the model before it writes code?
A prompt in the chat box? That works for quick prototypes, but at scale, requirements drift and context disappears.

That's why I created **Specly** — a lightweight Spec-Driven Development (SDD) scaffolding tool for AI agents.

In one command:
```bash
npx specly
```

You get a clean, versioned specification structure directly in your project:
- `requirements.md` (EARS-compliant testable criteria)
- `design.md` (architecture, boundaries, and diagrams)
- `tasks.md` (hierarchical checklist)
- `verification.md` (observable checklist)
- `steering.md` (persistent project rules & context)

### What's Available Today (Released v1.2.0 on npm)
- Native scaffolding for Cursor, Kiro, VS Code, Claude Code, Windsurf, Antigravity, and generic projects.
- Safe by default: skips existing files unless `--force` is specified.
- Controlled workflow commands: read-only `specly doctor`, `specly plan`, and `specly verify`.
- Auditable action execution: digest-approved local write-file actions with atomic run ledger.
- Single command execution: `npx specly`.

### In Active Local Preview (Coming Soon)
- **Node-free Python CLI:** a standalone Python distribution conforming to the shared artifact contract (tested in local wheel preview; provisional PyPI identity).
- **Optional agent adapters:** lazy boundaries for Strands task execution and Google AX cluster diagnostics (currently unreleased / unverified).

Check out the project:
- npm: https://www.npmjs.com/package/specly
- GitHub: https://github.com/DavidBritto/specly
- Presentation site: https://davidbritto.github.io/specly/

How does your team keep AI coding agents grounded in testable specifications?

---

## 2. Short LinkedIn Draft

Vibe coding gets you started. Specifications get you to production.

Most AI agent failures aren't model failures — they are context failures. If the agent doesn't have a clear, versioned definition of done, it invents one.

**Specly** sets up a complete Spec-Driven Development workspace in 5 seconds:
`npx specly`

Scaffolds EARS requirements, technical design, tasks, and steering for Cursor, Kiro, Claude Code, and more.

📦 Available now on npm: `specly@1.2.0`
🔬 In local preview: Node-free Python CLI (`uvx`) and agent execution adapters.

Try it out: `npx specly`
Web: https://davidbritto.github.io/specly/
GitHub: https://github.com/DavidBritto/specly

#AI #SoftwareEngineering #AgenticAI #OpenSource #ProductDevelopment

---

## 3. Claim Reconciliation Checklist (against `site/claims.json`)

| Claim ID | Capability | Stated Copy Status | Observed Evidence Locator | Reconciliation Verdict |
|----------|------------|--------------------|----------------------------|------------------------|
| `node_cli_sdd_scaffolding` | Node CLI SDD scaffolding | Released | npm: `specly@1.2.0` | Verified |
| `node_cli_workflow_commands` | `doctor`, `plan`, `verify` | Local Preview | Git branch `feat/specly-workflow-*` | Verified as unreleased |
| `node_cli_approved_run_ledger` | Digest-gated `run` & ledger | Local Preview | Git branch `feat/specly-workflow-*` | Verified as unreleased |
| `python_cli_node_free` | Python CLI package | Local Preview | `python/` wheel smoke tests; unallocated PyPI | Verified as unreleased |
| `strands_adapter` | Strands task execution | Local Preview | `strands_adapter.py` local tests | Verified as unreleased |
| `ax_cluster_adapter` | Google AX adapter | Unverified | Google AX prerelease; offline tests | Verified as unverified |
| `presentation_site` | Static presentation site | Local Preview | `site/` local files; inert Pages | Verified as unreleased |
| `linkedin_launch_copy` | Launch copy drafts | Draft | `content.md` (this file) | Verified as draft |
