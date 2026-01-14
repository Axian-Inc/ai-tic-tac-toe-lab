# Prompt

# AGENTS.md instructions for /workspaces/codex-first-pass

<INSTRUCTIONS>
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

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /home/vscode/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /home/vscode/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  3) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  4) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
</INSTRUCTIONS>

<environment_context>
  <cwd>/workspaces/codex-first-pass</cwd>
  <approval_policy>on-request</approval_policy>
  <sandbox_mode>workspace-write</sandbox_mode>
  <network_access>restricted</network_access>
  <shell>bash</shell>
</environment_context>

# Task: Determine Next Story Step

## Analysis Phase
1. Review all project context files to understand:
   - Current project state and completed work
   - Overall project goals and architecture
   - Defined story/task sequence or roadmap

2. Identify the next logical step by considering:
   - Dependencies and prerequisites (are they satisfied?)
   - Alignment with project goals and structure
   - Any explicitly defined priority or sequence

## Validation Phase
3. Present your analysis:
   - State the proposed next step clearly
   - Explain why this step is the logical next choice
   - Note any dependencies or considerations
   - **Ask for confirmation**: "Is this the correct step to work on next?"

## Execution Phase
4. Upon confirmation, proceed with implementation:
   - Follow any specific instructions or requirements from the context
   - Adhere to project coding standards and patterns
   - Reference relevant context files as needed
   - Provide progress updates for significant milestones

## Output Requirements
- Be explicit about what you're working on and why
- If context is ambiguous or missing, request clarification before proceeding
- Document any assumptions or decisions made during implementation
