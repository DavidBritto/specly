# Specly Python CLI (Local Preview)

Standalone Python distribution for **Specly** — Spec-Driven Development scaffolding without requiring Node.js.

> **Status:** Local development and testing only. This package is **not published** to PyPI or any public registry. The package name and public command identities remain provisional.

## Supported Commands

- `specly init [options]`: Generate SDD files conforming to canonical artifact contract v1.
- `specly doctor`: Read-only readiness check for Python runtime (>=3.10), agent markers, and packaged template fingerprints.
- `specly plan <feature>`: Read-only preview of proposed local file writes and effects.
- `specly verify <feature>`: Read-only verification of local specification files and checklist progress.

*Note: `specly run` and `specly recover` are not supported in the Python CLI and remain available via the Node CLI.*

## Interruption & Overwrite Safety

- Running `init` on existing files checks their SHA-256 against canonical templates.
- Files matching canonical template bytes are reported as already complete and skipped.
- Modified or partial files trigger a warning requiring review; they are never overwritten without explicit `--force`.

## Optional Strands Task Execution Adapter

The optional module `specly_cli.optional.strands_adapter` provides a strictly bounded task-execution boundary using the Strands Agents SDK:

- **Disabled by default:** Default commands (`init`, `doctor`, `plan`, `verify`) never import Strands or inspect ambient credentials.
- **Explicit authorization:** Execution requires an `ExecutionRequest` bound to an affirmative `approval_digest`, explicit provider configuration, and task ID.
- **Strict safety boundary:**
  - Allowed tools are restricted to structured, data-only local operations (`write-file`). Shell, subprocess, VCS, PR, and network tools are prohibited.
  - Writable roots are confined to the project root; directory traversal, symlink escapes, and reserved paths (`.git`, `.specly`) fail closed.
  - Resource limits (`budget_calls`, `timeout_seconds`) halt execution with a `limited` status and claim no success.
- **Evidence distinction:** An `ExecutionRecord` documents tool outcomes and status, but **never** marks tasks checked or implies requirements acceptance. Local unit tests run against local mock fixtures and contact no external providers.
- **Installation:** Optional extra: `pip install "specly[strands]"`.

## Development & Testing

```bash
# Verify asset synchronization against canonical repository sources
python3 python/scripts/sync_assets.py --check

# Run test suite
PYTHONPATH=python/src python3 -m unittest discover -s python/tests

# Build isolated wheel
uv build --wheel --no-sources
```
