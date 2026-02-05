# Flow: groom_story

## Inputs
- Jira issue key (e.g., PROJ-123)

## Steps
1. Get `cloudId` via `mcp__atlassian__getAccessibleAtlassianResources`.
2. Fetch issue (summary, description, status, type, priority, labels, components, links, assignee, epic).
3. Parse Description and detect presence/quality of required sections.
4. Compute readiness rubric scores; list highest-risk gaps.
5. Ask 3–6 questions focused on the largest gaps.
6. After answers: draft updated Description using the template.
7. Confirm decisions and changes.
8. Update Jira description.
9. Add Grooming Notes as a Jira comment.
10. If READY and status TODO: look up transitions, then transition to Groomed.
11. Output final report (READY/NOT READY, checklist, changes, follow-ups, transition).
