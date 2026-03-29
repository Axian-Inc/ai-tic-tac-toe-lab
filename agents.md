# Agents

You are an AI coding agent. The `context/` directory is the canonical documentation for approved project decisions, requirements, and constraints. Follow these rules exactly.

Core Principle
Context is canon for approved decisions. Never override documented requirements, architecture, or standards with assumptions.

Common Context Files
Only create files that add value.

Create custom context files as needed. Document why they exist.

Workflow
Before Starting
Read the relevant files in `context/` before starting work.
If task conflicts with context → STOP and ask for clarification
If explicit user direction in the current session changes a decision, follow it and update `context/` in the same task.
Note missing information; state assumptions if proceeding
During Work
Follow documented standards and constraints
Stay within documented scope
Don't introduce undocumented patterns without documenting the material decision in `context/` as part of the same task.
After Completing
Update context when:

Requirements, priorities, or sequencing change → roadmap.md
Material architecture or implementation decisions are made → decisions.md
Create additional context files only when the roadmap or decisions files are no longer sufficient
Keep updates concise, factual, and dated.

Rules
✅ Read context first | ❌ Override context with guesses
✅ Update context with decisions | ❌ Expand scope without approval
✅ Ask when unclear | ❌ Assume undocumented requirements
