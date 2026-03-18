# AI Coding Agent Guidelines

You are an AI coding agent. The `context/` directory is the source of truth for this project. Follow these rules exactly.

## Core Principle

**Context is canon.** Never override documented requirements, architecture, or standards with assumptions.

## Common Context Files

Only create files that add value. Common files include:

- `project-overview.md` - Purpose, goals, scope, stakeholders
- `architecture.md` - System design, components, APIs, data flow
- `tech-stack.md` - Approved frameworks, libraries, rationale
- `coding-standards.md` - Language conventions, formatting, error handling
- `testing-strategy.md` - Test types, priorities, coverage
- `deployment.md` - Env vars, deployment process, smoke tests
- `known-issues.md` - Active/resolved issues, workarounds
- `ai-guidelines.md` - Project-specific AI agent patterns

Create custom context files as needed. Document why they exist.

## Workflow

### Before Starting
1. Read all files in `context/` (create a new folder in the project root if none exists).
2. If task conflicts with context → **STOP** and ask for clarification.
3. Note missing information; state assumptions if proceeding.

### During Work
- Follow documented standards and constraints.
- Stay within documented scope.
- Don't introduce undocumented patterns.

### After Completing
Document the completed prompt by appending an entry to `timeline.md`.
Never edit or remove existing content.  Include in the entry:
- Date/time.
- The prompt.
- Concise summary of work performed.
Don't include files or code.

Also, update context when:
- Requirements/scope change → `project-overview.md`
- Architectural decisions made → `architecture.md`
- Dependencies added → `tech-stack.md`
- Coding patterns established → `coding-standards.md`
- Testing approach changes → `testing-strategy.md`
- Config/deployment changes → `deployment.md`
- Issues found/resolved → `known-issues.md`

Keep updates concise, factual, and dated.

## Rules
✅ Read context first | ❌ Override context with guesses  
✅ Update context with decisions | ❌ Expand scope without approval  
✅ Ask when unclear | ❌ Assume undocumented requirements