# Python CLI Distribution Specification

## Purpose

Define a standalone Python distribution that exposes Specly workflows without requiring Node.js, while preserving the existing npm CLI and canonical artifact contract. This capability extends the existing local S1–S3c baseline; it does not restate or replace that baseline, and it does not imply a published Python package.

## Requirements

### Requirement: Node-free Python command

The Python distribution MUST provide a user-facing CLI that can initialize and operate a Specly project using Python alone. Its supported operations MUST be declared and MUST NOT silently invoke Node.js, `npm`, or `npx`. The existing npm command and its behavior MUST remain compatible. The public package name, command identity, and release claims MUST remain provisional until package-registry availability and ownership have been verified.

#### Scenario: Run a supported operation in a clean Python project

- GIVEN a supported Python runtime and a clean project with no Node.js, npm, `npx`, or `package.json`
- WHEN the user runs a supported Python CLI operation
- THEN the operation completes or reports a Python-specific actionable prerequisite error without creating a `package.json`
- AND no Node.js, npm, or `npx` process is invoked

#### Scenario: Preserve the npm interface

- GIVEN an existing project using the npm CLI
- WHEN the Python distribution is installed or used separately
- THEN the existing npm commands and their documented behavior remain available and unchanged

#### Scenario: Registry identity is not verified

- GIVEN package-name availability or ownership has not been verified against the registry
- WHEN installation or release instructions are prepared
- THEN the package name and public command identity are marked provisional
- AND no instruction presents an unverified registry identity as an available published package

### Requirement: Artifact contract parity

The Python and npm implementations MUST conform to the canonical artifact contract and shared fixtures. Equivalent supported operations MUST preserve the contract's artifact roles, paths, ownership, overwrite behavior, and content/fingerprint rules. A divergence MUST fail conformance rather than silently create a second contract.

#### Scenario: Equivalent operations produce contract-conforming artifacts

- GIVEN the same supported operation and fixture inputs for both runtimes
- WHEN the npm and Python implementations generate or inspect the artifacts
- THEN each result conforms to the canonical artifact contract
- AND shared conformance checks detect any relevant path, ownership, overwrite, or content divergence

#### Scenario: Contract fixture exposes a mismatch

- GIVEN an implementation output differs from a canonical contract fixture
- WHEN cross-runtime conformance checks run
- THEN the mismatch is reported as a failure with the affected contract element identified
- AND the output is not represented as conformant

### Requirement: Distribution evidence gates

The Python distribution MUST distinguish local build/test evidence from registry publication. A release claim MUST be supported by observed publication evidence for the named package and version. Building or testing locally MUST NOT be described as publishing or releasing the package.

#### Scenario: Local build has no publication evidence

- GIVEN the package has only been built or tested locally
- WHEN status or product copy describes its availability
- THEN it is labeled as local or unreleased
- AND it is not described as published or installable from a public registry

#### Scenario: Published release is evidenced

- GIVEN an observed registry record identifies the package and version as published
- WHEN availability is reported
- THEN the claim identifies only that evidenced package and version

### Requirement: Installation is local and authorization-bounded

Documentation and automated checks for the Python CLI MUST NOT perform remote access, publish packages, or use credentials without separate explicit authorization for the destination, operation, and credential/session. Local test workflows MUST be able to validate Node independence without contacting a package registry.

#### Scenario: Local validation needs no remote access

- GIVEN the package source and local test fixtures are available
- WHEN the Node-free smoke and conformance checks run
- THEN they validate local behavior without registry access, credential use, or remote file transfer

#### Scenario: A release action lacks authorization

- GIVEN no explicit authorization names a registry destination, publish operation, and credential/session
- WHEN a release workflow is requested or invoked
- THEN the workflow does not publish or probe the registry
- AND it reports that the release action requires authorization
