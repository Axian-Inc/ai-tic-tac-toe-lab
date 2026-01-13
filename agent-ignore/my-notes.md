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
