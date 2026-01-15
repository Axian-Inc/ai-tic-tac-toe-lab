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
- **Version control**: Include `agent-ignore/` files in commits whenever they are modified, regardless of who made the change.
- **Purpose**: Files that should be tracked but not influence agent behavior.

## File Operations Priority

1. Read `context/` files
2. Create/update `chat-history/` entry
3. Perform requested task
4. Update `context/` files if needed
5. Commit changes (including modified `agent-ignore/` files)

## Commit Scope Defaults

- Include changes under `agent-ignore/`, `chat-history/`, and `.codex/` in commits without asking for confirmation.


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
  <shell>bash</shell>
</environment_context>

# Project Visualization Generation

Analyze the entire codebase and generate comprehensive visual documentation.

## Required Diagrams

### 1. System Architecture Overview
Create a Mermaid C4 Context diagram in `docs/diagrams/architecture-overview.mmd` showing:
- All major system components/services
- External dependencies (databases, APIs, third-party services)
- User/client interactions
- Data persistence layers
- Integration points between components
- Technology stack for each component (annotate with tech used)

### 2. Application Structure
Create a Mermaid graph in `docs/diagrams/application-structure.mmd` showing:
- Directory structure with key folders (src, lib, config, etc.)
- Main module/package organization
- Layer separation (presentation, business logic, data access, etc.)
- Configuration and environment dependencies
- Test structure relative to source

### 3. Data Model & Flow
Create a Mermaid ER diagram in `docs/diagrams/data-model.mmd` showing:
- Database schema (tables/models and key relationships)
- Data flow between layers (API → Service → Repository → Database)
- External data sources
- Caching layers
- Message queues or async data flows (if applicable)

### 4. API & Integration Map
Create a Mermaid sequence diagram in `docs/diagrams/api-integration.mmd` showing:
- All exposed API endpoints (REST, GraphQL, etc.)
- External API integrations (third-party services)
- Authentication/authorization flow
- Key request/response flows through the system
- Webhook or callback mechanisms

### 5. Component Dependency Graph
Create a Mermaid graph in `docs/diagrams/component-dependencies.mmd` showing:
- Major classes/modules and their dependencies
- Service layer interactions
- Circular dependencies (highlight in red)
- Shared utilities/libraries
- Plugin or extension points

### 6. Deployment Architecture
Create a Mermaid graph in `docs/diagrams/deployment.mmd` showing:
- Deployment topology (servers, containers, cloud services)
- Environment separation (dev, staging, production)
- Load balancing and scaling components
- Monitoring and logging infrastructure
- CI/CD pipeline overview

### 7. Technology Stack Summary
Create a visual inventory in `docs/diagrams/tech-stack.mmd`:
- Frontend technologies and frameworks
- Backend frameworks and languages
- Database systems
- Infrastructure and DevOps tools
- Third-party services and SDKs
- Development and build tools

## Analysis Instructions

1. **Scan the entire codebase** - Don't just focus on main application code
2. **Read configuration files** - Package.json, Gemfile, pom.xml, build.gradle, etc.
3. **Identify patterns** - MVC, microservices, event-driven, monolith, etc.
4. **Look for documentation** - README, architecture docs, API specs
5. **Analyze dependencies** - Both internal modules and external packages
6. **Check infrastructure** - Docker, K8s configs, cloud provider configs
7. **Review data access** - ORMs, query builders, database connections

## Output Format

Each diagram should:
- Use clear, descriptive labels
- Include technology annotations (e.g., "User Service [Spring Boot]")
- Use color coding for different layers/concerns
- Add notes for complex relationships
- Be self-documenting (someone unfamiliar should understand it)

## Additional Outputs

Create `docs/PROJECT_OVERVIEW.md` with:
- Brief description of project purpose
- Key architectural decisions and why
- Main user flows
- Critical paths and bottlenecks
- Known technical debt areas
- Integration complexity map (which integrations are most fragile)
- Quick reference: "If I need to modify X, which components are affected?"

## Mermaid Syntax Reminders
- Use subgraphs to group related components
- Use arrows with labels for relationships: `A -->|"HTTP Request"| B`
- Color code by layer: style A fill:#f9f,stroke:#333
- Add notes: note right of A: This is critical

Generate all diagrams now based on analyzing the full project structure.
