# Atlassian Interactive Story Grooming (Codex Skill)

This package is a **Codex CLI skill** designed to work in conjunction with an **Atlassian/Jira MCP server** to run
an interactive grooming session for a Jira story.

## What it does
- Fetches a Jira issue (story) via MCP
- Runs a readiness scan (Definition of Ready)
- Asks high-value questions in short rounds (3–6 at a time)
- Captures decisions, assumptions, and out-of-scope items
- Rewrites the story **Description** into a consistent structure (**Acceptance Criteria embedded in Description**)
- Adds *Grooming Notes* as a Jira comment (date-stamped)
- Optionally transitions the issue from **TODO → Groomed** (only if Ready)

## Jira conventions used
- **Acceptance Criteria** live inside the **Description** under an `## Acceptance Criteria` heading.
- When grooming is complete and passes checks, the issue is transitioned **TODO → Groomed**.

## How to use (typical)
1. Start a grooming session with your team (call/meeting).
2. Run the skill against a story key (e.g., `PROJ-123`).
3. Answer the skill’s questions, confirm decisions, and let it apply updates.

> Tip: Use `--dry-run` first to see proposed changes without writing.

## Files in this package
- `skill.json` — lightweight metadata for the skill
- `prompt.md` — the main skill prompt/instructions (the “constitution”)
- `config/config.json` — workflow + field conventions
- `flows/` — step-by-step playbooks (used by the prompt)
- `templates/` — structured Description templates / blocks
- `examples/` — example inputs/outputs

## Assumptions
This skill assumes the **Atlassian MCP server** used in Codex exposes tools like:
- `mcp__atlassian__getAccessibleAtlassianResources` (to get `cloudId`)
- `mcp__atlassian__getJiraIssue`
- `mcp__atlassian__editJiraIssue`
- `mcp__atlassian__transitionJiraIssue`
- `mcp__atlassian__addCommentToJiraIssue` (optional)

If your tool names differ, update `config/config.json` and the references in `prompt.md`.

---

Generated: 2026-02-05
