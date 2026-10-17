# Launch Copy Specification

## Purpose

Define release-grounded launch drafts in `content.md`, including a primary and short LinkedIn draft. S1–S3c are local feature-branch behavior, not evidence of a published product; no PR, package release, or site publication is established by this change's inputs.

## Requirements

### Requirement: Drafts are complete but not automatically publishable

The launch-copy artifact MUST contain a primary draft and a shorter LinkedIn draft. Drafts MUST distinguish available, preview, planned, and unverified capabilities, and MUST NOT describe local branch behavior as a published release. Draft preparation MUST NOT post, schedule, or otherwise publish content.

#### Scenario: Draft artifact is prepared

- GIVEN the requested launch-copy artifact is being authored
- WHEN `content.md` is produced
- THEN it contains both a primary draft and a short LinkedIn draft
- AND it remains a draft that requires verification before publication

#### Scenario: Feature has only local evidence

- GIVEN a feature is present only in local branch code without release evidence
- WHEN copy describes it
- THEN the copy labels it as unreleased, preview, or planned
- AND does not claim it is available in a published release

### Requirement: Commands, links, and claims require evidence

Every installation command, product availability claim, version, and live link in launch copy MUST be verified against observed release evidence before the copy is marked publish-ready. Unverified commands or destinations MUST be omitted or clearly marked provisional. A local build, roadmap, or package metadata alone MUST NOT be treated as publication evidence.

#### Scenario: Copy contains an unverified installation command

- GIVEN no observed release evidence verifies the package identity, version, and installation command
- WHEN draft copy is reviewed
- THEN the command is omitted or marked provisional
- AND the draft is not marked publish-ready

#### Scenario: Copy contains a verified release claim

- GIVEN observed release evidence supports a specific package/version/feature claim
- WHEN the claim is included
- THEN its wording is limited to what that evidence demonstrates
- AND the evidence can be traced by the reviewer

#### Scenario: A link destination is not live or verified

- GIVEN a proposed URL has not been verified as a live intended destination
- WHEN copy is prepared
- THEN the URL is omitted or explicitly marked provisional
- AND no wording implies the destination is published

### Requirement: Publishing requires separate authorization

Preparing or reviewing copy MUST NOT post to LinkedIn or another external service. Publishing, scheduling, or editing a remote post MUST require separate explicit authorization naming the destination, operation, and credential/session. The workflow MUST NOT discover or reuse ambient credentials or authenticated sessions.

#### Scenario: Draft review without publishing authorization

- GIVEN copy has been prepared but no publishing authorization exists
- WHEN a review or validation task runs
- THEN it remains local and does not contact a publishing service

#### Scenario: Publish request lacks complete authorization

- GIVEN destination, operation, or credential/session authorization is missing
- WHEN publishing is requested
- THEN no post is created or modified and no remote service is probed
- AND the missing authorization element is reported
