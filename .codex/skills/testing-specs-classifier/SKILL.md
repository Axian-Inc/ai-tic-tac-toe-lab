---
name: testing-specs-classifier
description: Classify and normalize Testing Specs from Jira stories or markdown requirements into clear test categories and actionable checks. Use when a ticket has vague or mixed testing notes and you need structured Unit, Integration, and End-to-End guidance with explicit pass criteria.
---

# Testing Specs Classifier

## Quick Start
- Extract the current `Testing Specs` content from the source (Jira issue description, comment, or markdown file).
- Classify each statement into one category: `unit`, `integration`, `e2e`, `non-testable`, or `missing-detail`.
- Rewrite the section into a normalized structure with concrete, verifiable checks.

## Classification Rules
- Label as `unit` when it validates pure logic, isolated functions, or module behavior without external systems.
- Label as `integration` when it validates interactions between components, APIs, services, storage, CLI tools, or infrastructure dependencies.
- Label as `e2e` when it validates complete user/system workflows across boundaries from entry point to observable outcome.
- Label as `non-testable` when it is a goal, preference, or implementation detail that cannot be directly verified.
- Label as `missing-detail` when intent is testable but required inputs, expected outputs, or environment details are absent.

## Rewrite Rules
- Keep the original testing intent; do not invent product scope.
- Convert ambiguous statements into explicit checks with setup, action, and expected result.
- Preserve constraints from the source ticket (environment, tooling, dependencies, out-of-scope items).
- Keep each check single-purpose and independently verifiable.
- Move non-testable statements to a short `Notes` section or flag for clarification.

## Output Template
Use this structure in the final rewritten testing section:

```markdown
## Testing Specs

### Unit Tests
- <check 1>
- <check 2>

### Integration Tests
- <check 1>
- <check 2>

### End-to-End Tests (if applicable)
- <check 1>

### Test Data / Environments
- <required data, env, profiles, or fixtures>

### Observability (logs/metrics/traces)
- <what to inspect to verify outcomes>

### Notes
- <non-testable or deferred items>
```

## Quality Bar
- Ensure every kept test statement answers: what is tested, how it is triggered, and what proves success.
- Prefer command-level or assertion-level wording when tools are known.
- Call out missing prerequisites explicitly so grooming can resolve them.

## Final Response Contract
- Provide a short `Classification Summary` with counts per label.
- Provide the rewritten `Testing Specs` section.
- Provide `Open Clarifications` only for unresolved `missing-detail` items.
