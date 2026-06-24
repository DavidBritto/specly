# Requirements

> Define **what** to build and **why**. Use user stories and testable EARS criteria.

## Feature: [Feature Name]

### User Story 1
As a [role], I want [action] so that [benefit].

#### Acceptance Criteria
- WHEN [trigger event] THE SYSTEM SHALL [expected behavior]
- IF [undesired condition] THEN THE SYSTEM SHALL [error handling or alternative]
- WHILE [continuous state] THE SYSTEM SHALL [system response]

### User Story 2
As a [role], I want [action] so that [benefit].

#### Acceptance Criteria
- WHEN [event] THE SYSTEM SHALL [behavior]
- WHERE [context or location] THE SYSTEM SHALL [contextual behavior]

---

## EARS Reference

| Keyword     | Use case                         |
|-------------|----------------------------------|
| `WHEN`      | Trigger event (ubiquitous)       |
| `IF...THEN` | Undesired condition / error      |
| `WHILE`     | Continuous state                 |
| `WHERE`     | Location or feature context      |

**Rule:** If you cannot test it, it is not clear enough yet.
