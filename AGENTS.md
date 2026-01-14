# Agent Rules

## Core Workflow

1. **Read context first**: Always read all files in `context/` before starting any task to understand requirements and current state.
2. **Capture conversations**: Record every interaction in `chat-history/` as paired markdown files.
3. **Update planning state**: Maintain and update files in `context/` as decisions evolve or task requirements change.

## Chat History Management

- **File naming**: Use three-digit zero-padded sequential IDs with suffixes:
  - Prompts: `chat-history/001-prompt.md`, `chat-history/002-prompt.md`, etc.
  - Responses: `chat-history/001-response.md`, `chat-history/002-response.md`, etc.
- **File structure**: Use consistent markdown headings:
  - Prompts: Start with `# Prompt`
  - Responses: Start with `# Response`
- **Automatic creation**: Create `chat-history/` directory if it doesn't exist.
- **Scope**: Capture every user message as a prompt file and every assistant message as a response file.

## Context Directory

- **Purpose**: Contains task-specific details, requirements, and planning documents.
- **Usage**: Read all context files before acting on any task.
- **Maintenance**: Update context files when:
  - Task requirements change
  - Decisions are made that affect planning
  - New information emerges that should inform future actions

## Agent-Ignore Directory

- **Context handling**: Do not read or use files in `agent-ignore/` for decision-making or context.
- **Version control**: Include `agent-ignore/` files in commits when they are modified.
- **Purpose**: Files that should be tracked but not influence agent behavior.

## File Operations Priority

1. Read `context/` files
2. Create/update `chat-history/` entry
3. Perform requested task
4. Update `context/` files if needed
5. Commit changes (including modified `agent-ignore/` files)