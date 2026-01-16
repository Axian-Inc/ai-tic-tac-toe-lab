# LLM and Agents Should ignore this file - DO NOT READ!

Why Dev Continer?  Would a normal docker container not suffice?A Dev Container is specifically designed to provide a consistent development environment that integrates seamlessly with your code editor, such as Visual Studio Code. While a normal Docker container can run applications, a Dev Container offers additional benefits tailored for development, including: (What are the benefits of using a Dev Container over a standard Docker container?)     



Steps Taken -

- Use local codex instance in a blank directory to create a devcontainer that installs Node.js 20, Codex CLI, and AWS CLI v2. (See chat-history/001-prompt.md for the prompt and chat-history/001-response.md for the response.)

- Open VS Code and launch devcontainer.

- Only use Codex in the container moving forward.

- Have Codex generate initial agents.md file with rule about capturing chat prompts and responses into chat-history folder as md files. (We will see if this works)

/new

- Have Codex update agents.md to add rule to ignore all files in agent-ignore/ directory.

/new

- Have Codex generate context structure

/new

- Begin architecturel planning for Tic-Tac-Toe project (see chat-history/005 - 060)

/new

- Review the architecture plan

/new

- Begin planning technology stack (see chat-history/063 - 070)

/new

 - Populate coding-standards.md (see chat-history/071 - 085)

 /new

- Add IaC to tech-stack.md (see chat-history/086 - 090)

/new 

- Generate initial stories for Tic-Tac-Toe project (see chat-history/091 - 100)

/new

- Generate testing strategy (see chat-history/101 - 110)

/new

-Review stories and testing strategy (see chat-history/111 - 120)

/new 

- Begin revising story-001.md to be more granular (see chat-history/121 - 130)

/new 

- Add story process to coding-standards.md (see chat-history/131 - 140)

/new

- Begin woring on story-009, will keep working each story in a new context

.....

- Added next-story prompt to ~/codex/prompts

....

- Used next-story prompt to begin working on story-010

- Linting and prettier added to coding-standards.md (see chat-history/141 - 150)

/new

- story organization

/new

- Used ClaudeCode to review and imporove agents.md and next-story prompt

/new

- Setup Github for this projects repo, add gh to devcontainer for easier authentication

/new

- Rebuilt docker container and prompts were lost, add then and a script to copy them into the container on build

/new 

- Start in on next tasks


/new - switched to high model thinking

- added visualize-docs prompt to ~/.codex/prompts
- run prompt to generate diagrams for architecture and tech-stack docs

/new

- Start in on next tasks

/new

- Begin deployment to AWS, testing, and bug fixing

/new

- highlight winner

-- Fully deployed Tic-Tac-Toe project to AWS and manually verified functionality