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