# Presentation Site Specification

## Purpose

Define an accessible, responsive static product site under `site/` that communicates Specly's actual availability without presenting local branch work as released. S1–S3c are local feature-branch behavior; no package release or site publication is evidenced by this change's inputs. Site preparation does not authorize deployment or Pages activation.

## Requirements

### Requirement: Site presents release-grounded availability

The static site MUST distinguish released functionality from local, planned, preview, unavailable, or unverified functionality. Claims MUST be traceable to observed release evidence; a roadmap, source branch, local build, or package version metadata alone MUST NOT establish public availability. External/live links MUST be omitted or clearly marked unavailable unless verified.

#### Scenario: Local branch feature has no release evidence

- GIVEN a capability exists only on a local or feature branch and has no observed release evidence
- WHEN the site describes that capability
- THEN it is labeled as a preview, planned, or otherwise unreleased state
- AND it is not presented as part of an available published product

#### Scenario: Release evidence supports a claim

- GIVEN observed release evidence identifies a shipped feature and its version or destination
- WHEN the site makes an availability claim
- THEN the claim is limited to the evidenced release and feature

#### Scenario: A live URL is unverified

- GIVEN no verified live destination exists for a link
- WHEN site content is rendered
- THEN the link is omitted or clearly marked unavailable
- AND the site does not imply a live deployment

### Requirement: Site is understandable without motion

The site MUST provide an accessible terminal-style narrative and an equivalent non-animated presentation of the same essential information. Motion MUST respect reduced-motion preferences, and content MUST remain available when animation is disabled or unsupported.

#### Scenario: Motion is enabled

- GIVEN a visitor has not requested reduced motion
- WHEN the terminal narrative is presented
- THEN any animation supplements rather than exclusively conveys essential information

#### Scenario: Visitor requests reduced motion

- GIVEN the visitor's system preference requests reduced motion
- WHEN the site is rendered
- THEN non-essential animation is disabled or reduced
- AND the equivalent content remains available

#### Scenario: Animation is unavailable

- GIVEN scripts or animation are unavailable or disabled
- WHEN the visitor reads the page
- THEN the equivalent non-animated narrative conveys the same essential product information

### Requirement: Responsive and keyboard-accessible presentation

The site MUST support narrow and wide viewports and keyboard operation for all interactive controls. Text and controls MUST meet the project's verified accessibility checks for contrast, focus visibility, and usable layout; failures MUST be corrected before the site is described as accessibility-checked.

#### Scenario: Visitor navigates by keyboard

- GIVEN a visitor uses only a keyboard
- WHEN they move through the page and activate available controls
- THEN each interactive control is reachable and has a visible focus state

#### Scenario: Visitor uses a narrow viewport

- GIVEN the page is rendered at a mobile-width viewport
- WHEN the visitor reads content and navigates controls
- THEN content remains legible and operable without unintended horizontal overflow

### Requirement: Deployment preparation is not deployment authorization

Static site files and a Pages workflow MAY be prepared locally, but creation or activation of a remote deployment, Pages publication, or remote repository operation MUST NOT occur without explicit authorization for the destination, operation, and credential/session. Ambient credentials MUST NOT be probed or reused.

#### Scenario: Local site checks run

- GIVEN site source is available locally and no deployment authorization exists
- WHEN local accessibility, responsive, and link checks run
- THEN they operate on local files or fixtures without deploying or contacting a remote site

#### Scenario: Pages workflow is prepared but not authorized

- GIVEN a local workflow definition exists but Pages activation is not authorized
- WHEN the change is prepared or verified
- THEN the workflow remains inactive
- AND no remote deployment or repository operation is performed
