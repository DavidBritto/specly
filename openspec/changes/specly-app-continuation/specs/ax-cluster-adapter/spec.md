# AX Cluster Adapter Specification

## Purpose

Define an optional adapter for read-only prerequisite diagnostics and effect preview, with a distinct approval boundary before any cluster submission or mutation. The current S1–S3c local workflow does not establish cluster integration. This specification does not verify the identity, API, prerequisites, or compatibility range of any AX project.

## Requirements

### Requirement: Optional adapter remains inactive by default

The AX adapter MUST be optional and MUST NOT be added to default execution. Initialization, ordinary diagnostics, and read-only planning MUST NOT contact a cluster or invoke AX. The adapter MUST identify itself as unavailable or unverified until the intended project identity, current API, prerequisites, and a supported compatibility range have been verified from primary sources and tested.

#### Scenario: Adapter is not configured

- GIVEN a default installation without AX configuration
- WHEN initialization, diagnostics, or planning runs
- THEN no AX tool or cluster is invoked
- AND the user can continue using unrelated local workflow capabilities

#### Scenario: Compatibility has not been verified

- GIVEN the project identity, API, prerequisites, or compatibility range is not verified
- WHEN AX availability is displayed
- THEN it is labeled unavailable or unverified
- AND no supported-version claim is made

### Requirement: Prerequisite inspection and effect preview are non-mutating

Prerequisite diagnostics and effect previews MUST be read-only. They MUST describe the intended target and proposed effects with enough information for a user to review them, and MUST NOT submit, apply, delete, or otherwise mutate cluster resources. Missing prerequisites MUST produce actionable diagnostics without mutation.

#### Scenario: Prerequisites are inspected

- GIVEN an explicitly configured AX adapter and an authorized read-only inspection context
- WHEN the user requests prerequisite diagnostics
- THEN the adapter reports detected prerequisites and missing items
- AND it performs no cluster mutation

#### Scenario: Effects are previewed

- GIVEN an operation has a proposed cluster target and effect set
- WHEN the user requests a preview
- THEN the target and proposed effects are presented before approval
- AND no submission or mutation occurs

#### Scenario: Prerequisites are missing

- GIVEN one or more required prerequisites cannot be established
- WHEN diagnostics run
- THEN the missing prerequisites are reported as actionable blockers
- AND no cluster operation is attempted

### Requirement: Cluster mutation requires separate explicit approval

Every cluster submission or mutation MUST require an affirmative approval after the effect preview, bound to the specific operation, target, and proposed effects. Approval for diagnostics or preview MUST NOT count as mutation approval. The adapter MUST fail closed if the approved target or effect set changes before submission.

#### Scenario: User approves the exact preview

- GIVEN a completed preview identifies a specific operation, target, and effects
- WHEN the user separately approves that exact preview
- THEN only the approved operation may be submitted to the approved target

#### Scenario: Approval is absent or the preview changes

- GIVEN no mutation approval exists or the target/effects changed after preview
- WHEN submission is requested
- THEN submission is refused
- AND a fresh preview and separate approval are required

### Requirement: Remote and credential boundaries are enforced

Cluster access is a remote operation and MUST NOT be attempted without explicit user authorization identifying the destination, operation, and credential/session. The adapter MUST NOT discover, inspect, or reuse ambient SSH agents, authenticated sessions, or credentials. Local tests MUST use non-remote fixtures or mocks unless the user separately authorizes a specific remote test.

#### Scenario: Remote authorization is incomplete

- GIVEN the destination, operation, or credential/session is not explicitly authorized
- WHEN cluster inspection or mutation is requested
- THEN the adapter performs no remote access and does not probe connectivity
- AND reports which authorization element is missing

#### Scenario: Local adapter tests run

- GIVEN no remote test authorization was provided
- WHEN the adapter test suite runs
- THEN it uses local fixtures or mocks
- AND it does not contact a real cluster or inspect ambient credentials
