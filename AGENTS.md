# AI Coding Agent Guidelines

You are an AI coding agent working in this repository. The `context/` directory contains project knowledge that evolves with the codebase. Follow these rules exactly.

## Core Principles

1. **Context is canon**: The `context/` directory is the source of truth for requirements, constraints, and decisions
2. **Self-maintaining**: Keep context files current as the project evolves
3. **Flexible structure**: Not all projects need all context files; create only what's useful
4. **Explicit over implicit**: Document decisions and rationale; don't rely on assumptions

## Context Directory Structure

The following files **may exist** in `context/`. Only use files that are present:

- **`project-overview.md`**: Purpose, goals, scope, stakeholders, and planning assumptions
  - *When to use*: Understanding why the project exists and what is in/out of scope
  
- **`architecture.md`**: System design, components, API contracts, data flow, and integration points
  - *When to use*: Before touching system boundaries, APIs, or data contracts
  
- **`tech-stack.md`**: Approved frameworks, libraries, tooling, and rationale
  - *When to use*: Before introducing dependencies or selecting implementation approaches
  
- **`coding-standards.md`**: Language conventions, formatting, module boundaries, error handling, logging
  - *When to use*: For every code change
  
- **`testing-strategy.md`**: Test categories, priorities, coverage requirements, and what not to test
  - *When to use*: When adding or updating tests
  
- **`deployment.md`**: Environment variables, deployment commands, CI/CD pipeline, and smoke tests
  - *When to use*: When changing configuration, infrastructure, or release steps
  
- **`known-issues.md`**: Active/resolved issues, workarounds, and known quirks
  - *When to use*: Before debugging or changing behavior that may already be tracked
  
- **`ai-guidelines.md`**: Project-specific rules for AI agents, common patterns, and preferences
  - *When to use*: Always; this contains project-specific AI workflow guidance

## Workflow

### Before Starting Any Task

1. **Check for context directory**:
````bash
   ls -la context/
````

2. **Read existing context files**:
   - Scan all files in `context/` to understand the project
   - Note which files exist and which are missing
   - Identify any gaps in documentation

3. **Assess task against context**:
   - Does the task align with documented requirements?
   - Are there constraints or decisions that affect the approach?
   - Is anything unclear or contradictory?

4. **If context conflicts with task**:
   - **STOP** and ask for clarification
   - Present the conflict clearly: "Task requests X, but context/Y.md states Z"
   - Wait for human decision before proceeding

### During Task Execution

1. **Follow documented standards**:
   - Use patterns from `coding-standards.md`
   - Respect constraints from `architecture.md` and `tech-stack.md`
   - Align with testing strategy and deployment requirements

2. **Document decisions**:
   - When making architectural choices, note rationale
   - When adding dependencies, explain why
   - When discovering issues, track them

3. **Stay within scope**:
   - Don't expand scope without explicit approval
   - Don't override context with assumptions
   - Don't introduce undocumented patterns

### After Completing Task

1. **Update context files** when any of these occur:
   - Requirements or scope change → Update `project-overview.md`
   - Architectural decisions made → Update `architecture.md`
   - New dependencies/tools added → Update `tech-stack.md`
   - Coding patterns established → Update `coding-standards.md`
   - Testing approach changes → Update `testing-strategy.md`
   - Deployment/config changes → Update `deployment.md`
   - Issues discovered or resolved → Update `known-issues.md`
   - New AI workflow patterns → Update `ai-guidelines.md`

2. **Keep updates concise and factual**:
   - Use clear, scannable formatting (headings, lists, code blocks)
   - Include dates for time-sensitive information
   - Provide rationale for non-obvious decisions
   - Link to related files or external docs when helpful

## Creating Missing Context Files

### When to Create Context Files

Create context files **only when they add clear value**. Signs you need a file:

- **`project-overview.md`**: Multiple stakeholders, unclear scope, or frequent scope questions
- **`architecture.md`**: Multiple components, external integrations, or complex data flows
- **`tech-stack.md`**: Technology choices need justification or team lacks expertise
- **`coding-standards.md`**: Inconsistent code style or multiple contributors
- **`testing-strategy.md`**: Unclear testing requirements or test coverage debates
- **`deployment.md`**: Complex deployment process or multiple environments
- **`known-issues.md`**: Recurring bugs, workarounds, or technical debt to track
- **`ai-guidelines.md`**: Project-specific AI patterns or repeated AI workflow issues

### How to Create Context Files

1. **Assess need**: Confirm the file would prevent confusion or repetitive questions
2. **Start minimal**: Create basic structure; expand as needed
3. **Announce creation**: Tell the human you're creating the file and why
4. **Use templates** (see below)

### Template: project-overview.md
````markdown
# Project Overview

## Purpose
[What problem does this solve? Why does it exist?]

## Goals
- [Specific, measurable objective 1]
- [Specific, measurable objective 2]

## Scope
**In scope:**
- [Feature/capability 1]
- [Feature/capability 2]

**Out of scope:**
- [Explicitly excluded 1]
- [Explicitly excluded 2]

## Stakeholders
- **[Role]**: [Name/Team] - [Responsibility]

## Key Assumptions
- [Assumption 1 and its impact]
- [Assumption 2 and its impact]
````

### Template: architecture.md
````markdown
# Architecture

## System Overview
[High-level description of how the system works]

## Components
### [Component Name]
- **Responsibility**: [What it does]
- **Technology**: [Key tech used]
- **Interfaces**: [APIs, contracts]

## Data Flow
[How data moves through the system]

## External Integrations
- **[Service Name]**: [Purpose, API version, auth method]

## Key Design Decisions
- **[Decision]**: [Rationale, date, alternatives considered]
````

### Template: tech-stack.md
````markdown
# Tech Stack

## Core Technologies
- **Language**: [Version, rationale]
- **Framework**: [Version, rationale]
- **Database**: [Type, version, rationale]

## Libraries & Dependencies
### [Category]
- **[Library Name]** ([version]): [Purpose, why chosen over alternatives]

## Development Tools
- **[Tool]**: [Purpose]

## Rationale
[Overall philosophy and constraints that guided tech choices]
````

### Template: coding-standards.md
````markdown
# Coding Standards

## General Principles
- [Principle 1]
- [Principle 2]

## Naming Conventions
- **Files**: [Convention]
- **Variables**: [Convention]
- **Functions**: [Convention]
- **Classes**: [Convention]

## File Organization
[How to structure files and directories]

## Error Handling
[How to handle errors consistently]

## Logging
[What/when/how to log]

## Comments & Documentation
[When to comment, what to document]

## Forbidden Patterns
[Things not to do and why]
````

### Template: testing-strategy.md
````markdown
# Testing Strategy

## Test Categories
- **Unit Tests**: [What, when, coverage target]
- **Integration Tests**: [What, when, coverage target]
- **E2E Tests**: [What, when, coverage target]

## Priorities
1. [Highest priority test category and why]
2. [Second priority]

## What NOT to Test
- [Explicitly excluded 1 and why]
- [Explicitly excluded 2 and why]

## Test Standards
- [Test file naming]
- [Test organization]
- [Assertion patterns]

## Running Tests
```bash
[Commands to run tests]
```
````

### Template: deployment.md
````markdown
# Deployment

## Environments
- **Development**: [URL, purpose]
- **Staging**: [URL, purpose]
- **Production**: [URL, purpose]

## Environment Variables
```bash
REQUIRED_VAR_1=description
REQUIRED_VAR_2=description
OPTIONAL_VAR_3=description (default: value)
```

## Deployment Process
### [Environment Name]
```bash
[Commands to deploy]
```

## Smoke Tests
After deployment, verify:
- [ ] [Critical path 1]
- [ ] [Critical path 2]

## Rollback Procedure
[How to rollback if deployment fails]
````

### Template: known-issues.md
````markdown
# Known Issues

## Active Issues

### [Issue Title]
- **Status**: Active
- **Discovered**: [Date]
- **Impact**: [What breaks or is limited]
- **Workaround**: [Temporary solution if any]
- **Root Cause**: [If known]
- **Tracked**: [Issue number/link if applicable]

## Resolved Issues

### [Issue Title]
- **Status**: Resolved
- **Resolved**: [Date]
- **Solution**: [What fixed it]

## Known Quirks
- [Behavior 1]: [Why it works this way]
````

### Template: ai-guidelines.md
````markdown
# AI Agent Guidelines

## Project-Specific Rules
- [Rule 1 specific to this project]
- [Rule 2 specific to this project]

## Common Patterns
### [Pattern Name]
[When to use it, example]

## Preferences
- **Code style**: [Specific preferences beyond coding-standards.md]
- **Communication**: [How to present options, ask questions]

## Context Update Triggers
Beyond the standard triggers, also update context when:
- [Project-specific trigger 1]
- [Project-specific trigger 2]
````

## Adding Custom Context Files

If you need a context file not listed above:

1. **Identify the need**: What recurring question or confusion would it solve?
2. **Propose the file**: "I recommend creating `context/[filename].md` to document [purpose]"
3. **Get approval**: Wait for human confirmation
4. **Create with structure**:
````markdown
   # [Title]
   
   ## Purpose
   [Why this file exists]
   
   ## [Section 1]
   [Content]
   
   ## [Section 2]
   [Content]
````
5. **Update this file**: Add the new file to the "Context Directory Structure" section above

## Rules Summary

✅ **DO**:
- Read all existing context files before starting
- Treat context as the source of truth
- Update context when making decisions
- Create context files when they prevent confusion
- Ask for clarification when context conflicts with task
- Document rationale for non-obvious choices

❌ **DON'T**:
- Override context with assumptions
- Expand scope without approval
- Create context files that don't add value
- Make architectural decisions without updating architecture.md
- Add dependencies without updating tech-stack.md
- Skip reading context because you think you know the project

## When Something Is Missing or Unclear

1. **State what's missing**: "The context doesn't specify [X]"
2. **Propose assumption**: "I assume [Y] because [reasoning]"
3. **Suggest update**: "Should I add this to `context/[file].md`?"
4. **Wait for confirmation** before proceeding with anything non-trivial

## Meta: Updating This File

This file (`AGENTS.md`) should be updated when:
- New context file types become standard for this project
- Workflow rules change
- New templates are needed
- AI agent patterns evolve

Keep this file aligned with actual project practices.