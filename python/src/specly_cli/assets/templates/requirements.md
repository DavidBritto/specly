# Requirements

> Define **what** to build and **why**. Use user stories and testable EARS criteria.
> Before writing code, hunt for ambiguities: vague terms, missing edge cases, undefined actors.

## Feature: [Feature Name]

### User Story 1
As a [role], I want [action] so that [benefit].

#### Acceptance Criteria (EARS)
- WHEN [trigger event] THE SYSTEM SHALL [expected behavior]
- IF [undesired condition] THEN THE SYSTEM SHALL [error handling or alternative]
- WHILE [continuous state] THE SYSTEM SHALL [keep reacting]
- WHERE [specific context or location] THE SYSTEM SHALL [contextual behavior]
- AS SOON AS [event] THE SYSTEM SHALL [time-sensitive response]

### User Story 2
As a [role], I want [action] so that [benefit].

#### Acceptance Criteria
- WHEN [event] THE SYSTEM SHALL [behavior]
- IF [error case] THEN THE SYSTEM SHALL [fallback]

---

## Ambiguity Checklist

Before approving requirements, verify:

- [ ] Every noun is clearly defined (no "user" when you mean "admin")
- [ ] Every condition has a negative case (what happens when it fails?)
- [ ] Numbers have explicit limits ("at most 5", not "a few")
- [ ] Temporal words are precise ("within 2 seconds", not "instantly")
- [ ] Actors are identified (who triggers? who receives?)

---

## EARS Reference

| Keyword       | Use case                         | Example                                                          |
|---------------|----------------------------------|------------------------------------------------------------------|
| `WHEN`        | Trigger event (ubiquitous)       | WHEN the user submits THE SYSTEM SHALL validate the form         |
| `IF...THEN`   | Undesired condition / error      | IF the email is invalid THEN THE SYSTEM SHALL show an error      |
| `WHILE`       | Continuous state                 | WHILE the upload is in progress THE SYSTEM SHALL show a spinner  |
| `WHERE`       | Location or feature context      | WHERE the user is admin THE SYSTEM SHALL show the panel          |
| `AS SOON AS`  | Time-sensitive response          | AS SOON AS the payment completes THE SYSTEM SHALL send a receipt |

**Rule:** If you cannot test it, it is not clear enough yet. If a criterion does not have a clear pass/fail, rewrite it.
