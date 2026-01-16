# ai-tic-tac-toe-lab

## Dev Container Setup Instructions

### Pre-Requisites:
This lab will takes place INSIDE a docker container using the Dev Containers Extension so you need very little on the host OS beyond Docker, Git, VS Code (and Dev Containers Extension)

- Docker Desktop
- VS Code + Dev Container Extension
- LOCAL (host OS) install of OpenAI Codex CLI (npm / brew are easiest)
<br/>Example: brew install codex or  npm install -g @openai/codex
<br/>NOTE: We’ll only be running codex to enable auth, you won’t need many of its features on the Host OS.
- Axian Github account access
- Axian AWS L&D Access Key (for AWS CLI work) 

### Prep:

- Grab/generate your AWS L&D access key (URL: Axian AWS L&D Account)

- Run codex from the terminal/command prompt and login to your local codex (follow the prompts to the web UI auth).

### Clone and Create Personal Branch

- Clone the repo to your local machine
```
git clone https://github.com/Axian-Inc/ai-tic-tac-toe-lab.git
```
- Checkout the starting lab branch
```
git checkout 00-devcontainer-starter
```
- Create a personal branch for your work (i.e. chadr-first-pass)
```
git checkout -b <firstname-last initial>-<whatever you want>
```

### Open in Dev Container
- Open the folder in VS Code
- When prompted, open in Dev Container
- Wait for the container to build and start (this may take a few minutes the first time)
- The build will run the `copy-codex-auth.sh` script to copy your local codex auth into the container

### Verify Codex Auth Copied
- Open a terminal in the Dev Container
- Run `codex` and verify you are logged in (it should not prompt you to login again)
- You can use `/status` to verify the account info

### AWS Setup
- In the Dev Container terminal, run `aws configure`
- Enter your Axian AWS L&D Access Key ID and Secret Access Key when prompted
- For default region, enter `us-west-2`
- For default output format, enter `json` or leave blank
- Verify AWS CLI is working by running `aws s3 ls` (you should see a list of S3 buckets)

### Github Setup
- In the Dev Container terminal, verify git is working by running `git ls-remote origin` 
- If prompted, enter your Github credentials (you may need to set up a personal access token)

### You are now ready to begin the lab!


## AGENTS.md

AGENTS.md contains important guidelines for AI coding agents working on this project. 

In this example AGENTS.md instructs the AI coding agent to always refer to the `context/` directory as the source of truth for the project. It emphasizes that context is canon and should never be overridden with assumptions.

As you work through the planning phase with the agent the context files will be generated and updated as needed. The agent is guided to follow specific workflows before, during, and after completing tasks, ensuring adherence to documented standards and constraints.

### Example Prompts to get started

```
We are going to start the planning phase for a new POC of a single player vs AI tic-tac-toe game.  Starting from the basic concept walk me though step by step creating an implemenation plan.  Build up the context directory files as we make decisions.
```

```
I want to create the following, lets focus on planning for now, no implementation:
Participants will build a single-player Tic-Tac-Toe game, where:
The human player plays via a simple UI
The AI opponent is powered by an LLM hosted in AWS Bedrock
The AI makes move decisions based on:
 Current board state
 Game rules
 Prompted strategy (at least the following two)
  balanced (mix of defensive and offensive)
  aggressive (always go for the win)
  ```