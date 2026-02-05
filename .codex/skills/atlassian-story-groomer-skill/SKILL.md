---
name: atlassian-interactive-story-grooming
description: Interactive Jira story grooming via Atlassian MCP. Use to run a grooming session, enforce Definition of Ready, ask targeted questions in rounds, capture decisions, rewrite Jira Description with structured Acceptance Criteria and Testing Specs, add Grooming Notes as a comment, and optionally transition TODO to Groomed when READY.
---

# Atlassian Interactive Story Grooming

## Quick Start
- Read `config/config.json` for MCP tool names, workflow settings, and DoR checklist.
- Follow the end-to-end workflow in `flows/groom_story.md`.
- Use `templates/description_template.md` to rewrite the Description.

## Workflow
- Get `cloudId` via the configured MCP tool.
- Fetch the Jira issue fields needed for grooming.
- Perform a readiness scan using the DoR checklist from `config/config.json`.
- Ask 3–6 high-impact questions per round; prioritize gaps.
- Summarize answers and capture decisions (Decision + Rationale + Owner).
- Draft an updated Description using `templates/description_template.md` and preserve important original details.
- Confirm changes with the user/team.
- Update the Jira Description and add Grooming Notes as a comment.
- If READY and workflow allows: look up transitions and move TODO → Groomed.
- Output the final session report (status, checklist, changes, follow-ups, transition).

## Required Writing Rules
- Put Acceptance Criteria under `## Acceptance Criteria` in the Description.
- Use Gherkin-style AC (Given/When/Then) and keep them testable and unambiguous.
- Include Testing Specs with at least unit + integration guidance; include E2E when UI flow applies.
- Record Grooming Notes as a Jira comment, not in the Description.

## Definition of Ready
- Use the checklist in `config/config.json`.
- If a checklist item is not met, either resolve it via questions or record an explicit waiver with reason + owner in Grooming Notes.

## Tools (Atlassian MCP)
- Use the tool names and parameter keys in `config/config.json`.
- Prefer read-modify-write edits: keep important original details and relocate them into the template sections.

## Bundled References
- `flows/groom_story.md` for the main procedure.
- `flows/write_acceptance_criteria.md` for AC quality rules.
- `flows/write_testing_specs.md` for testing guidance.
- `flows/create_spike_or_followup.md` when unresolved unknowns require a spike/task.
- `templates/description_template.md` for the Description structure.

## Output Contract
- Status: READY or NOT READY.
- DoR checklist: pass/fail per item (and any waivers).
- Changes applied: Description/comment updates and transitions.
- Open follow-ups: list and whether a spike/task was created.
