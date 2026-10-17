# Generated artifact contract

Specly's generated-file contract is **version 1** (`schemaVersion: 1`, contract version `1.0.0`). The machine-readable definition is [`contracts/artifact-contract-v1.json`](./contracts/artifact-contract-v1.json); it is included in the npm package so other front ends can consume the same paths, layout rules, and template fingerprints.

## Ownership and safe updates

After creation, every generated file belongs to the project using it. Specly supplies defaults; it does not retain ownership of the generated copy or treat it as disposable cache. Initialization skips existing files by default. `--force` is the explicit, file-wide opt-in to replace them with the current templates.

There is no automatic migration or merge in contract version 1. An update must not rewrite, rename, or delete existing generated files unless the user explicitly opts into replacement. To adopt a newer contract, compare the new template with the project's copy, preserve local edits, and update only the files the project owner chooses. Back up or commit changes before using `--force`.

## Stable paths and contents

The fixture declares the six generated artifact roles, filenames, layouts for each supported agent, and SHA-256 fingerprints for the canonical template bytes. Feature layouts substitute `{feature}` without changing the filenames. Generic projects keep all six files in `specs/`; agent-specific layouts keep the four feature files below their `specsDir`, steering at `steeringDir`, and the guide at `agentDir`.

The template fingerprints are conformance data, not an instruction to add version headers to user documents. Keeping document bytes unchanged avoids noisy edits and preserves existing `npx specly` output. A deliberate template change requires updating the fixture version/fingerprints and the compatibility notes in the same change. Compatible additions may preserve the major schema version; changing meanings, required roles, or path conventions requires a new schema version and an explicit migration policy.

## Cross-runtime conformance

Implementations should read the JSON fixture rather than duplicate its artifact list or path rules. Conformance means emitting all declared roles at the declared paths with bytes matching each fingerprint, and honoring the overwrite policy. The Node test suite validates fresh generic and Cursor output against the fixture; another runtime can use the same fixture and canonical template assets for equivalent checks.
