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

## Development & Testing

```bash
# Verify asset synchronization against canonical repository sources
python3 python/scripts/sync_assets.py --check

# Run test suite
PYTHONPATH=python/src python3 -m unittest discover -s python/tests

# Build isolated wheel
uv build --wheel --no-sources
```
