# AI Coding Agent Guidelines

You are an AI coding agent. 


## Core Principle

* **The contents of the /context folder (called "context" below) is cannon for this project.** 
  Never override context content with assumptions.  Always document in the context all
  standards, technologies, architecture etc. used in the project - lean toward richer rather than leaner
  documentation.  If any part of the context becomes obsolete due to changes, mark this fact describing
  briefly what was the previous state of the things.
* All timestamps that you insert in the context should be in local time.


## Project Context
The `context/` directory is the source of truth for this project. Follow these rules exactly. 
These files all have a section "File Index" at the top with max 10 lines of the text describing 
file purpose and context.

### Common Context Files

Only create files when this adds value. Common files include (but any other files that make sense are encouraged):

- `project-overview.md` - Purpose, goals, scope, stakeholders
- `architecture.md` - System design, components, APIs, data flow
- `tech-stack.md` - Approved frameworks, libraries, rationale
- `coding-standards.md` - Language conventions, formatting, error handling
- `testing-strategy.md` - Test types, priorities, coverage
- `deployment.md` - Env vars, deployment process, smoke tests
- `known-issues.md` - Active/resolved issues, workarounds
- `ai-guidelines.md` - Project-specific AI agent patterns

Create other context files if none of the files listed above seems appropriate for some project 
information that is relevant.

Document each completed prompt by appending an entry to `timeline.md` file.
Never edit or remove existing content from it.  Include in each entry:
- Date/time.
- The prompt.
- Detailed summary of work performed.
- Don't include files or code.


## Workflow

### Before Starting
1. Read all files in `context/` (create a new folder in the project root if none exists).
2. If task conflicts with context → **STOP** and ask for clarification.
3. Note missing information; state assumptions if proceeding.


### During Work
- Follow documented standards and constraints.
- Stay within documented scope.
- Don't introduce undocumented patterns.
- For all major public methods (e.g. controller endpoints)
  - Comment them with all the information relevant to the caller.
  - Add a log entry: if it's backend, to stdout, if it's a UI component, to browser console.
    For UI logs, create a toggle flag.  Log only if it's set to true.
- Add tests to cover all code with cyclomatic complexity of 3 or more.  But also cover the code
  that you think is error prone even when the complexity is lower.


### After Completing
Update the timeline.md file.

Also, update context when:
- Requirements/scope change → `project-overview.md`
- Architectural decisions made → `architecture.md`
- Dependencies added → `tech-stack.md`
- Project setup → `project-seyup.md`
- Coding patterns established → `coding-standards.md`
- Testing approach changes → `testing-strategy.md`
- Config/deployment changes → `deployment.md`
- Issues found/resolved → `known-issues.md`

Keep updates concise, factual, and dated.  
If any of the above files don't exist, create it and add content as described above.

All files in context folder should match the following template (<...> are placeholders - expand them):
# <REPLACE THIS WITH THE FILE DESCRIPTIVE TITLE>

## File Index

<PUT HERE UP TO 10 LINES OF THE TEXT THAT DESCRIBES THE PURPOSE OF THE FILE>

## Content

<THE CONTENT OF THE FILE>


## Rules
✅ Read context first | ❌ Override context with guesses  
✅ Update context with decisions | ❌ Expand scope without approval  
✅ Ask when unclear | ❌ Assume undocumented requirements